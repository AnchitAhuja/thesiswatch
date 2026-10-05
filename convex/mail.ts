import { Resend, type EmailId } from "@convex-dev/resend";
import { v } from "convex/values";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { isTestRecipient, renderEdition } from "../shared/newsletter.mjs";

export const resend: Resend = new Resend(components.resend, { testMode: true });

export const enqueue = internalMutation({
  args: { subscriberId: v.id("trackingOptIns"), editionId: v.optional(v.id("editions")), token: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const subscriber = await ctx.db.get(args.subscriberId);
    if (!subscriber || subscriber.unsubscribedAt !== undefined || !isTestRecipient(subscriber.email)) return null;
    const edition = args.editionId ? await ctx.db.get(args.editionId)
      : await ctx.db.query("editions").withIndex("by_published_at").order("desc").first();
    if (!edition) return null; // No saved edition yet; the next weekly run picks it up.
    const previous = await ctx.db.query("mailDeliveries").withIndex("by_subscriber_edition",
      q => q.eq("subscriberId", subscriber._id).eq("editionId", edition._id)).unique();
    if (previous) return previous.emailId;
    const token = subscriber.unsubscribeToken || args.token;
    if (!subscriber.unsubscribeToken) await ctx.db.patch(subscriber._id, { unsubscribeToken: token });
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) throw new Error("CONVEX_SITE_URL is required for private unsubscribe links.");
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
    // Component enqueue, token and ledger commit together in one transaction.
    const emailId = await resend.sendEmail(ctx, {
      from: "Lookout <onboarding@resend.dev>", to: subscriber.email,
      subject: `Lookout — AI thesis — Edition dated ${edition.date}`,
      text: renderEdition(edition, unsubscribeUrl),
      headers: [
        { name: "List-Unsubscribe", value: `<${unsubscribeUrl}>` },
        { name: "List-Unsubscribe-Post", value: "List-Unsubscribe=One-Click" },
      ],
      idempotencyKey: `edition:${subscriber._id}:${edition._id}`,
    });
    await ctx.db.insert("mailDeliveries", {
      subscriberId: subscriber._id, editionId: edition._id, emailId, queuedAt: Date.now(),
    });
    return emailId;
  },
});

async function scheduleBatch(ctx: MutationCtx, editionId: Id<"editions">, cursor: string | null) {
  const page = await ctx.db.query("trackingOptIns").withIndex("by_email").paginate({ cursor, numItems: 50 });
  for (const subscriber of page.page) {
    if (subscriber.unsubscribedAt === undefined && isTestRecipient(subscriber.email)) {
      await ctx.scheduler.runAfter(0, internal.mailActions.prepare, { subscriberId: subscriber._id, editionId });
    }
  }
  if (!page.isDone) await ctx.scheduler.runAfter(0, internal.mail.fanout, { editionId, cursor: page.continueCursor });
}

export const sendWeekly = internalMutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const edition = await ctx.db.query("editions").withIndex("by_published_at").order("desc").first();
    if (edition) await scheduleBatch(ctx, edition._id, null);
    return null;
  },
});
export const fanout = internalMutation({
  args: { editionId: v.id("editions"), cursor: v.string() }, returns: v.null(),
  handler: async (ctx, args) => { await scheduleBatch(ctx, args.editionId, args.cursor); return null; },
});

async function cancelBatch(ctx: MutationCtx, subscriberId: Id<"trackingOptIns">, cursor: string | null) {
  const subscriber = await ctx.db.get(subscriberId);
  if (!subscriber || subscriber.unsubscribedAt === undefined) return;
  const page = await ctx.db.query("mailDeliveries").withIndex("by_subscriber_edition",
    q => q.eq("subscriberId", subscriberId)).paginate({ cursor, numItems: 50 });
  for (const delivery of page.page) {
    const email = await resend.get(ctx, delivery.emailId as EmailId);
    if (email && (email.status === "waiting" || email.status === "queued")) {
      await resend.cancelEmail(ctx, delivery.emailId as EmailId);
    }
  }
  if (!page.isDone) await ctx.scheduler.runAfter(0, internal.mail.cancelPending, { subscriberId, cursor: page.continueCursor });
}
export const cancelPending = internalMutation({
  args: { subscriberId: v.id("trackingOptIns"), cursor: v.string() }, returns: v.null(),
  handler: async (ctx, args) => { await cancelBatch(ctx, args.subscriberId, args.cursor); return null; },
});
export const tokenExists = internalQuery({
  args: { token: v.string() }, returns: v.boolean(),
  handler: async (ctx, args) => Boolean(await ctx.db.query("trackingOptIns")
    .withIndex("by_unsubscribe_token", q => q.eq("unsubscribeToken", args.token)).unique()),
});
export const unsubscribe = internalMutation({
  args: { token: v.string() }, returns: v.boolean(),
  handler: async (ctx, args) => {
    const subscriber = await ctx.db.query("trackingOptIns")
      .withIndex("by_unsubscribe_token", q => q.eq("unsubscribeToken", args.token)).unique();
    if (!subscriber) return false;
    if (subscriber.unsubscribedAt === undefined) await ctx.db.patch(subscriber._id, { unsubscribedAt: Date.now() });
    await cancelBatch(ctx, subscriber._id, null);
    return true;
  },
});

// Internal-only proof for the one address explicitly authorized by the founder.
export const testDelivery = internalQuery({
  args: {}, returns: v.union(v.null(), v.object({
    ledgerId: v.id("mailDeliveries"), editionDate: v.string(),
    status: v.union(v.string(), v.null()), resendId: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  })),
  handler: async ctx => {
    const subscriber = await ctx.db.query("trackingOptIns").withIndex("by_email", q => q.eq("email", "delivered+test@resend.dev")).unique();
    if (!subscriber) return null;
    const edition = await ctx.db.query("editions").withIndex("by_published_at").order("desc").first();
    if (!edition) return null;
    const delivery = await ctx.db.query("mailDeliveries").withIndex("by_subscriber_edition",
      q => q.eq("subscriberId", subscriber._id).eq("editionId", edition._id)).unique();
    if (!delivery) return null;
    const email = await resend.get(ctx, delivery.emailId as EmailId);
    return { ledgerId: delivery._id, editionDate: edition.date, status: email?.status ?? null, resendId: email?.resendId ?? null, error: email?.errorMessage ?? null };
  },
});

"use node";
import { randomBytes } from "node:crypto";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const prepare = internalAction({
  args: { subscriberId: v.id("trackingOptIns"), editionId: v.optional(v.id("editions")) },
  returns: v.union(v.string(), v.null()),
  handler: (ctx, args): Promise<string | null> => ctx.runMutation(internal.mail.enqueue, { ...args, token: randomBytes(32).toString("base64url") }),
});

// Return the provider's unchanged response, never its request headers or API key.
export const testReceipt = internalAction({
  args: {}, returns: v.object({ status: v.number(), body: v.string() }),
  handler: async (ctx): Promise<{ status: number; body: string }> => {
    const delivery = await ctx.runQuery(internal.mail.testDelivery, {});
    if (!delivery?.resendId) throw new Error("The test email has not reached Resend yet.");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured in this Convex deployment.");
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(delivery.resendId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return { status: response.status, body: await response.text() };
  },
});

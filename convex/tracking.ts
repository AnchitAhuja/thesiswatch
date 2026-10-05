import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { validateEmail } from "../shared/email.mjs";
import { internal } from "./_generated/api";

export const save = mutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { email, error } = validateEmail(args.email);
    if (error) throw new ConvexError(error);

    // Convex retries conflicting transactions, so simultaneous submissions
    // also produce one row. Keep the original signup date on repeat submissions.
    const existing = await ctx.db.query("trackingOptIns")
      .withIndex("by_email", q => q.eq("email", email)).unique();
    let subscriberId = existing?._id;
    if (!subscriberId) {
      subscriberId = await ctx.db.insert("trackingOptIns", {
        email,
        savedAt: new Date(Date.now()).toISOString(),
      });
    }
    if (existing?.unsubscribedAt !== undefined) {
      await ctx.db.patch(existing._id, { unsubscribedAt: undefined, unsubscribeToken: undefined });
    }
    await ctx.scheduler.runAfter(0, internal.mailActions.prepare, { subscriberId });
    return null;
  },
});

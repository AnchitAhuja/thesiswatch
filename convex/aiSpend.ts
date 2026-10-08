import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
export const limitMessage = "Lookout has hit today's thinking limit, try again tomorrow.";
export const istDay = (now = Date.now()) => new Date(now + 330 * 60000).toISOString().slice(0, 10);
export function dailyCap() {
 const value = Number(process.env.LOOKOUT_DAILY_AI_CAP_INR ?? 300);
 return Number.isFinite(value) && value >= 0 ? value : 300;
}
export const check = internalMutation({
 args: {}, returns: v.null(), handler: async ctx => {
  const day = istDay();
  const row = await ctx.db.query("aiDailySpend").withIndex("by_day", q => q.eq("day", day)).unique();
  if ((row?.estimatedInr ?? 0) >= dailyCap()) throw Error(limitMessage);
  return null;
 }
});
export const record = internalMutation({
 args: { key: v.string(), day: v.string(), inputTokens: v.number(), outputTokens: v.number(), estimatedInr: v.number() }, returns: v.null(),
 handler: async (ctx, args) => {
  if ([args.inputTokens, args.outputTokens, args.estimatedInr].some(x => !Number.isFinite(x) || x < 0)) throw Error("Invalid usage.");
  const exists = await ctx.db.query("aiUsage").withIndex("by_key", q => q.eq("key", args.key)).unique();
  if (exists) return null;
  await ctx.db.insert("aiUsage", args);
  const row = await ctx.db.query("aiDailySpend").withIndex("by_day", q => q.eq("day", args.day)).unique();
  const update = { estimatedInr: (row?.estimatedInr ?? 0) + args.estimatedInr, inputTokens: (row?.inputTokens ?? 0) + args.inputTokens, outputTokens: (row?.outputTokens ?? 0) + args.outputTokens, calls: (row?.calls ?? 0) + 1 };
  if (row) await ctx.db.patch(row._id, update); else await ctx.db.insert("aiDailySpend", { day: args.day, ...update });
  return null;
 }
});
export const today = internalQuery({
 args: {}, returns: v.object({ day: v.string(), estimatedInr: v.number(), inputTokens: v.number(), outputTokens: v.number(), calls: v.number(), capInr: v.number() }),
 handler: async ctx => {
  const day = istDay(); const row = await ctx.db.query("aiDailySpend").withIndex("by_day", q => q.eq("day", day)).unique();
  return { day, estimatedInr: row?.estimatedInr ?? 0, inputTokens: row?.inputTokens ?? 0, outputTokens: row?.outputTokens ?? 0, calls: row?.calls ?? 0, capInr: dailyCap() };
 }
});

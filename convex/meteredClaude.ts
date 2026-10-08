import { wrapLanguageModel, type LanguageModel } from "ai";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { istDay } from "./aiSpend";
// Sonnet 4.5 USD/MTok: input 3, output 15, cache read .30, cache write conservatively 6 (1h).
// INR conversion is an estimate, configurable without changing provider credentials.
export function meteredClaude(ctx: ActionCtx, model: Parameters<typeof wrapLanguageModel>[0]["model"]) {
 return wrapLanguageModel({ model, middleware: {
  specificationVersion: "v4",
  wrapGenerate: async ({ doGenerate }) => {
   await ctx.runMutation(internal.aiSpend.check, {});
   const day = istDay();
   const response = await doGenerate();
   const i = response.usage.inputTokens, o = response.usage.outputTokens;
   const rawRate = Number(process.env.LOOKOUT_USD_INR_RATE ?? 100);
   const rate = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 100;
   const inputTokens = i.total ?? ((i.noCache ?? 0) + (i.cacheRead ?? 0) + (i.cacheWrite ?? 0));
   const outputTokens = o.total ?? 0;
   const usd = ((i.noCache ?? Math.max(0, inputTokens - (i.cacheRead ?? 0) - (i.cacheWrite ?? 0))) * 3 + (i.cacheRead ?? 0) * .30 + (i.cacheWrite ?? 0) * 6 + outputTokens * 15) / 1000000;
   await ctx.runMutation(internal.aiSpend.record, { key: response.response?.id ?? crypto.randomUUID(), day, inputTokens, outputTokens, estimatedInr: usd * rate });
   return response;
  }
 } });
}

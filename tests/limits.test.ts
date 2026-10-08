import { it, expect, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { digest } from "../convex/theses";
import { istDay, limitMessage } from "../convex/aiSpend";
import { meteredClaude } from "../convex/meteredClaude";
const modules = import.meta.glob("../convex/**/*.ts");
const result = { belief: "Income grows", reflection: "Income grows", statedReasons: [], inferredAssumptions: [], unverifiedClaims: [], risks: [], strengtheningEvidence: [], weakeningEvidence: [] };
it("blocks a fourth saved thesis per normalized email, excludes drafts and failed chats, allows another email and edits", async () => {
 const t = convexTest(schema, modules);
 await t.run(async ctx => { for(let i=0;i<12;i++) await ctx.db.insert("customTheses", { tokenHash: String(i), email: "person@example.com", original: "Draft", investments: [], state: i%2 ? "draft" : "failed", createdAt: i }); });
 const tokens = ["a", "b", "c", "d"].map(x => x.repeat(64));
 for(let i=0;i<4;i++) {
  const token=tokens[i]; const id=await t.mutation(internal.theses.reserve,{ tokenHash: await digest(token), original: "Income grows", investments: [] });
  await t.mutation(internal.theses.finish,{ id, result });
  const save=()=>t.mutation(api.theses.confirm,{ token, email: " Person@Example.com ", reflection: "Income grows" });
  if(i<3) await save(); else await expect(save()).rejects.toThrow("three saved theses");
 }
 await t.mutation(api.theses.confirm,{ token: tokens[0], email: "person@example.com", reflection: "Edited" });
 await t.mutation(api.theses.confirm,{ token: tokens[3], email: "another@example.com", reflection: "Income grows" });
});
it("blocks at the cap before the provider is invoked and resets at midnight IST", async () => {
 const t=convexTest(schema,modules);
 vi.stubEnv("LOOKOUT_DAILY_AI_CAP_INR","300");
 await t.mutation(internal.aiSpend.record,{ key: "test",day:istDay(),inputTokens:1,outputTokens:1,estimatedInr:300 });
 const doGenerate=vi.fn();
 const model={ specificationVersion:"v4", provider:"test", modelId:"test", supportedUrls:{}, doGenerate, doStream:vi.fn() };
 const ctx={ runMutation: (ref: any,args: any)=>t.mutation(ref,args) };
 await expect(meteredClaude(ctx as any,model as any).doGenerate({ prompt: [] } as any)).rejects.toThrow(limitMessage);
 expect(doGenerate).not.toHaveBeenCalled();
 expect(istDay(Date.parse("2026-10-08T18:29:59Z"))).toBe("2026-10-08");
 expect(istDay(Date.parse("2026-10-08T18:30:00Z"))).toBe("2026-10-09");
 vi.unstubAllEnvs();
});
it("records token costs once and retains usage for invalid output", async () => {
 const t=convexTest(schema,modules); vi.stubEnv("LOOKOUT_USD_INR_RATE","100");
 const response={ content:[], finishReason:{ unified:"stop",raw:"end_turn" }, usage:{ inputTokens:{ total:1000,noCache:1000,cacheRead:0,cacheWrite:0 },outputTokens:{ total:100 } }, response:{ id:"once" }, warnings:[] };
 const model={ specificationVersion:"v4", provider:"test",modelId:"test",supportedUrls:{}, doGenerate:vi.fn().mockResolvedValue(response),doStream:vi.fn() };
 const ctx={ runMutation:(ref:any,args:any)=>t.mutation(ref,args) };
 await meteredClaude(ctx as any,model as any).doGenerate({prompt:[]} as any);
 await meteredClaude(ctx as any,model as any).doGenerate({prompt:[]} as any);
 const today=await t.query(internal.aiSpend.today,{});
 expect(today.estimatedInr).toBeCloseTo(.45); expect(today.calls).toBe(1); expect(today.inputTokens).toBe(1000);
 vi.unstubAllEnvs();
});

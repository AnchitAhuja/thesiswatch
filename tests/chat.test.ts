import { it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { digest } from "../convex/theses";
import { parseChatResponse, legacyInterpretation } from "../shared/chat.mjs";
const modules = import.meta.glob("../convex/**/*.ts");
const context = { belief: "Indian consumption grows", why: "Incomes increase", whatWouldProveItWrong: "Spending stagnates", timeHorizon: "Five years" };
const draft = { type: "thesis", reply: "This is your working thesis.", context, thesis: { thesis: "Rising incomes will increase spending in India.", assumptions: ["Incomes grow", "Extra income becomes spending", "Companies can serve that demand"], watchSignals: ["Household incomes", "Retail sales", "Consumer spending"] }, missingFields: [], needsConfirmation: false };
draft.thesis = { ...draft.thesis, sector: "Consumption" } as typeof draft.thesis;
async function setup() {
  const t = convexTest(schema, modules), token = "d".repeat(64);
  const id = await t.mutation(internal.theses.reserve, { tokenHash: await digest(token), original: "Indian consumption grows", investments: [] });
  return { t, token, id };
}
it("counts failed calls, keeps the whole thread, and blocks a seventh call", async () => {
  const { t, token, id } = await setup();
  for (let i = 1; i <= 6; i++) {
    const row = await t.mutation(internal.thesisConversation.claim, { token, requestId: String(i) });
    expect(row.conversation.calls).toBe(i); expect(row.conversation.turns).toBe(0);
    expect(row.conversation.messages).toEqual([{ role: "user", content: "Indian consumption grows" }]);
    await t.mutation(internal.thesisConversation.finish, { id, requestId: String(i) });
  }
  await expect(t.mutation(internal.thesisConversation.claim, { token, requestId: "7" })).rejects.toThrow("Six-call");
});
it("locks concurrent calls, replays completed requests without spending, and caps four replies", async () => {
  const { t, token, id } = await setup();
  for (let i = 1; i <= 4; i++) {
    const requestId = String(i), args = { token, requestId, ...(i > 1 ? { message: `answer ${i}` } : {}) };
    const row = await t.mutation(internal.thesisConversation.claim, args);
    expect(row.conversation.messages.length).toBe(i * 2 - 1);
    await expect(t.mutation(internal.thesisConversation.claim, args)).rejects.toThrow("in progress");
    await t.mutation(internal.thesisConversation.finish, { id, requestId, reply: `reply ${i}` });
    const cached = await t.mutation(internal.thesisConversation.claim, args);
    expect(cached.cached).toBe(true); expect(cached.conversation.calls).toBe(i);
  }
  await expect(t.mutation(internal.thesisConversation.claim, { token, requestId: "5", message: "extra" })).rejects.toThrow("complete");
});
it("starting the same private conversation twice does not occupy two thesis places", async () => {
  const { t, token, id } = await setup();
  expect(await t.mutation(internal.theses.reserve, { tokenHash: await digest(token), original: "Indian consumption grows", investments: [] })).toBe(id);
});
it("validates short single-question replies, final-card shape and prohibited wording", () => {
  const question = { ...draft, type: "question", thesis: null, reply: "More spending on essentials or experiences—which fits?" };
  expect(parseChatResponse(JSON.stringify(question), false).type).toBe("question");
  expect(() => parseChatResponse(JSON.stringify(question), true)).toThrow();
  expect(() => parseChatResponse(JSON.stringify({ ...question, reply: "Why? And how long?" }), false)).toThrow();
  expect(() => parseChatResponse(JSON.stringify({ ...question, reply: "word ".repeat(70) + "?" }), false)).toThrow();
  expect(() => parseChatResponse(JSON.stringify({ ...draft, thesis: { ...draft.thesis, assumptions: ["one"] } }), true)).toThrow();
  expect(() => parseChatResponse(JSON.stringify({ ...question, reply: "Buy this company?" }), false)).toThrow();
});
it("saves an edited assumption without inventing missing context", async () => {
  const { t, token, id } = await setup();
  const data = parseChatResponse(JSON.stringify({ ...draft, context: { ...context, why: null, timeHorizon: null } }), true);
  expect(data.missingFields).toEqual(["why", "timeHorizon"]); expect(data.needsConfirmation).toBe(true);
  await t.mutation(internal.thesisConversation.claim, { token, requestId: "1" });
  await t.mutation(internal.thesisConversation.finish, { id, requestId: "1", reply: data.reply, thesis: data.thesis, context: data.context, missingFields: data.missingFields, needsConfirmation: true, result: legacyInterpretation(data) });
  const assumptions = ["Edited first assumption", ...data.thesis.assumptions.slice(1)];
  await t.mutation(api.theses.confirm, { email: "test@example.com", token, reflection: data.thesis.thesis, assumptions });
  const provisional = await t.query(api.theses.read, { token });
  expect(provisional?.state).toBe("saved"); expect(provisional?.context?.why).toBeNull();
  expect(provisional?.missingFields).toEqual(["why", "timeHorizon"]); expect(provisional?.needsConfirmation).toBe(true);
  expect(provisional?.thesis?.assumptions).toEqual(assumptions); expect(provisional?.interpretation?.inferredAssumptions).toEqual(assumptions);
  await expect(t.mutation(api.theses.confirm, { email: "test@example.com", token, reflection: data.thesis.thesis, assumptions: ["one"] })).rejects.toThrow("three assumptions");
  await t.mutation(api.theses.confirm, { email: "test@example.com", token, reflection: data.thesis.thesis, context });
  const saved = await t.query(api.theses.read, { token });
  expect(saved?.state).toBe("saved"); expect(saved?.needsConfirmation).toBe(false); expect(saved?.thesis?.assumptions).toHaveLength(3);
});


it("accepts neutral retail business descriptions while blocking securities trade wording", () => {
 const response = { ...draft, reply: "Avenue Supermarts operates supermarket chains selling groceries and household goods." };
 expect(parseChatResponse(JSON.stringify(response), true).reply).toContain("providing groceries");
 expect(() => parseChatResponse(JSON.stringify({ ...response, reply: "Consider selling shares." }), true)).toThrow("Unacceptable wording");
 expect(() => parseChatResponse(JSON.stringify({ ...response, reply: "Would these fit?" }), true)).toThrow();
});

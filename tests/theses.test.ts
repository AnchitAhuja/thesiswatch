import { it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { digest } from "../convex/theses";
import { parseInterpretation } from "../shared/thesis.mjs";
const modules = import.meta.glob("../convex/**/*.ts");
const result = { belief: "AI demand grows", reflection: "You're betting on sustained AI demand.", statedReasons: ["More adoption"], inferredAssumptions: ["Spending continues"], unverifiedClaims: ["Nvidia booked until 2030"], risks: [], strengtheningEvidence: [], weakeningEvidence: [] };
it("accepts Claude's JSON code block but rejects missing reasoning fields", () => {
  expect(parseInterpretation('```json\n' + JSON.stringify(result) + '\n```')).toEqual(result);
  expect(() => parseInterpretation('{"reflection":"invented"}')).toThrow();
});
it("keeps a thesis private, preserves original words, and saves edited confirmation", async () => {
  const t = convexTest(schema, modules); const token = "a".repeat(64);
  const id = await t.mutation(internal.theses.reserve, { tokenHash: await digest(token), original: "  I believe AI grows.  ", investments: ["Nvidia"] });
  await t.mutation(internal.theses.finish, { id, result });
  expect(await t.query(api.theses.read, { token: "b".repeat(64) })).toBeNull();
  await expect(t.mutation(api.theses.confirm, { email: "test@example.com", token: "b".repeat(64), reflection: "Not mine" })).rejects.toThrow();
  await expect(t.mutation(api.theses.confirm, { email: "test@example.com", token, reflection: "My edited belief", investments: Array(6).fill("NVDA") })).rejects.toThrow("five");
  await t.mutation(api.theses.confirm, { email: "test@example.com", token, reflection: "My edited belief", investments: ["CEG", "GRID"] });
  const saved = await t.query(api.theses.read, { token });
  expect(saved?.original).toBe("  I believe AI grows.  "); expect(saved?.confirmedReflection).toBe("My edited belief");
  expect(saved?.interpretation?.unverifiedClaims).toEqual(result.unverifiedClaims);
  expect(saved?.state).toBe("saved"); expect(saved).not.toHaveProperty("tokenHash");
  expect(saved?.investments).toEqual(["CEG", "GRID"]);
});
it("allows drafts while enforcing five investments", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(internal.theses.reserve, { tokenHash: "test", original: "belief", investments: Array(6).fill("NVDA") })).rejects.toThrow("five");
  for (let i = 0; i < 10; i++) await t.mutation(internal.theses.reserve, { tokenHash: String(i), original: "belief", investments: [] });
  await t.mutation(internal.theses.reserve, { tokenHash: "11", original: "belief", investments: [] });
});

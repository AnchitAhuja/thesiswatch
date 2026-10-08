import { v } from "convex/values";
export const interpretation = v.object({
  belief: v.string(), reflection: v.string(), statedReasons: v.array(v.string()),
  inferredAssumptions: v.array(v.string()), unverifiedClaims: v.array(v.string()),
  risks: v.array(v.string()), strengtheningEvidence: v.array(v.string()), weakeningEvidence: v.array(v.string()),
});
export const thesisFields = {
  tokenHash: v.string(), original: v.string(), investments: v.array(v.string()),
  clarifications: v.optional(v.array(v.string())),
  state: v.union(v.literal("interpreting"), v.literal("draft"), v.literal("saved"), v.literal("failed")),
  createdAt: v.number(), interpretation: v.optional(interpretation), confirmedReflection: v.optional(v.string()),
};

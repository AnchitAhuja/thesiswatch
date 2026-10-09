import { v } from "convex/values";
import { standingResult } from './standingFields';
export const thesisContext = v.object({ belief: v.union(v.string(), v.null()), why: v.union(v.string(), v.null()), whatWouldProveItWrong: v.union(v.string(), v.null()), timeHorizon: v.union(v.string(), v.null()) });
export const structuredThesis = v.object({ thesis: v.string(), assumptions: v.array(v.string()), watchSignals: v.array(v.string()), sector: v.string() });
export const chatMessage = v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() });
export const conversation = v.object({
  messages: v.array(chatMessage), calls: v.number(), turns: v.number(),
  busySince: v.optional(v.number()), threadId: v.optional(v.string()), lastRequestId: v.optional(v.string()),
});
export const interpretation = v.object({
  belief: v.string(), reflection: v.string(), statedReasons: v.array(v.string()),
  inferredAssumptions: v.array(v.string()), unverifiedClaims: v.array(v.string()),
  risks: v.array(v.string()), strengtheningEvidence: v.array(v.string()), weakeningEvidence: v.array(v.string()),
});
export const thesisFields = {
  standingResult: v.optional(standingResult), standingKey: v.optional(v.string()), standingBusySince: v.optional(v.number()), standingEmail: v.optional(v.string()), standingSubscribedAt: v.optional(v.number()), standingActive:v.optional(v.boolean()), standingUnsubscribeToken:v.optional(v.string()),
  email: v.optional(v.string()),
  tokenHash: v.string(), original: v.string(), investments: v.array(v.string()),
  clarifications: v.optional(v.array(v.string())),
  state: v.union(v.literal("interpreting"), v.literal("draft"), v.literal("saved"), v.literal("failed")),
  createdAt: v.number(), interpretation: v.optional(interpretation), confirmedReflection: v.optional(v.string()),
  conversation: v.optional(conversation),
  thesis: v.optional(structuredThesis), context: v.optional(thesisContext),
  missingFields: v.optional(v.array(v.string())), needsConfirmation: v.optional(v.boolean()),
};

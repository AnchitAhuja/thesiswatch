import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { editionFields } from "./editionFields";
import { thesisFields } from "./thesisFields";
import {holdingLine,researchEvidenceFields} from './holdingsFields';

export default defineSchema({
  holdingSessions:defineTable({tokenHash:v.string(),original:v.string(),lines:v.array(holdingLine),createdAt:v.number(),confirmedAt:v.optional(v.number()),email:v.optional(v.string())}).index('by_token_hash',['tokenHash']),
  stockResearchCache:defineTable({key:v.string(),stockId:v.string(),busySince:v.optional(v.number()),lease:v.optional(v.string()),evidence:v.optional(researchEvidenceFields)}).index('by_key',['key']),
  customTheses: defineTable(thesisFields).index("by_token_hash", ["tokenHash"]).index("by_created_at", ["createdAt"]).index("by_state", ["state"]).index("by_email_state", ["email", "state"]).index('by_standing_active',['standingActive']).index('by_standing_unsubscribe',['standingUnsubscribeToken']),
  standingDeliveries: defineTable({thesisId:v.id('customTheses'),edition:v.string(),emailId:v.string(),queuedAt:v.number()}).index('by_thesis_edition',['thesisId','edition']),
  aiDailySpend: defineTable({ day: v.string(), estimatedInr: v.number(), inputTokens: v.number(), outputTokens: v.number(), calls: v.number() }).index("by_day", ["day"]),
  aiUsage: defineTable({ key: v.string(), day: v.string(), estimatedInr: v.number(), inputTokens: v.number(), outputTokens: v.number() }).index("by_key", ["key"]),
  trackingOptIns: defineTable({
    email: v.string(),
    savedAt: v.string(),
    unsubscribeToken: v.optional(v.string()),
    unsubscribedAt: v.optional(v.number()),
  }).index("by_email", ["email"]).index("by_unsubscribe_token", ["unsubscribeToken"]),
  editions: defineTable(editionFields)
    .index("by_key", ["key"]).index("by_published_at", ["publishedAt"]),
  mailDeliveries: defineTable({
    subscriberId: v.id("trackingOptIns"), editionId: v.id("editions"),
    emailId: v.string(), queuedAt: v.number(),
  }).index("by_subscriber_edition", ["subscriberId", "editionId"]),
  researchRuns: defineTable({
    key: v.string(), editionDate: v.string(), windowStart: v.number(), windowEnd: v.number(),
    baselineEditionId: v.id("editions"), prompt: v.string(),
    status: v.union(v.literal("queued"), v.literal("running"), v.literal("draft"), v.literal("failed")),
    workflowId: v.optional(v.string()), threadId: v.optional(v.string()),
    startedAt: v.number(), finishedAt: v.optional(v.number()), error: v.optional(v.string()),
    text: v.optional(v.string()), editorReview: v.optional(v.string()), readerEdition: v.optional(v.string()),
    reviewState: v.optional(v.union(v.literal("READY FOR EDITOR REVIEW"), v.literal("NEEDS REVIEW"))),
    sourceUrls: v.optional(v.array(v.string())), searched: v.optional(v.boolean()),
    model: v.optional(v.string()), inputTokens: v.optional(v.number()), outputTokens: v.optional(v.number()),
  }).index("by_key", ["key"]).index("by_window_end", ["windowEnd"]),
});

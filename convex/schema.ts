import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { editionFields } from "./editionFields";

export default defineSchema({
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
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trackingOptIns: defineTable({
    email: v.string(),
    savedAt: v.string(),
  }).index("by_email", ["email"]),
});

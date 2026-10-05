import { v } from "convex/values";

export const position = v.object({
  ticker: v.string(), name: v.string(), group: v.string(), thesis: v.string(),
  status: v.union(v.literal("STRENGTHENING"), v.literal("INTACT"), v.literal("WATCH"), v.literal("WEAKENING")),
  reason: v.string(), source: v.string(),
});
export const editionFields = {
  key: v.string(), date: v.string(), publishedAt: v.number(), positions: v.array(position),
};

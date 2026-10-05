import { internalMutation, internalQuery } from "./_generated/server";
import { v, type Infer } from "convex/values";
import { editionFields, position } from "./editionFields";
import { groups, portfolio, weeklyAssessments } from "../src/portfolio.js";

const editionDocument = v.object({ ...editionFields, _id: v.id("editions"), _creationTime: v.number() });

export const latest = internalQuery({
  args: {}, returns: v.union(editionDocument, v.null()),
  handler: ctx => ctx.db.query("editions").withIndex("by_published_at").order("desc").first(),
});

// An edition is immutable: reusing its key never rewrites a sent assessment.
export const save = internalMutation({
  args: editionFields, returns: v.id("editions"),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("editions").withIndex("by_key", q => q.eq("key", args.key)).unique();
    if (existing) return existing._id;
    if (args.positions.length !== 11 || new Set(args.positions.map(p => p.ticker)).size !== 11) {
      throw new Error("An AI edition must contain the 11 distinct positions.");
    }
    for (const p of args.positions) {
      if (!portfolio.some(original => original.ticker === p.ticker)) throw new Error("Unknown position.");
      if (new URL(p.source).protocol !== "https:") throw new Error("Sources must use HTTPS.");
    }
    return ctx.db.insert("editions", args);
  },
});

export const seedCurrent = internalMutation({
  args: {}, returns: v.id("editions"),
  handler: async ctx => {
    const existing = await ctx.db.query("editions").withIndex("by_published_at").order("desc").first();
    if (existing) return existing._id;
    const positions = groups.flatMap(group => portfolio.filter(p => p.group === group)
      .sort((a, b) => a.ticker.localeCompare(b.ticker)).map(p => ({
        ticker: p.ticker, name: p.name || "ETF", group: p.group, thesis: p.thesis,
        ...weeklyAssessments[p.ticker as keyof typeof weeklyAssessments],
      }))) as Infer<typeof position>[];
    return ctx.db.insert("editions", {
      key: "ai:2026-10-04", date: "Oct 4, 2026",
      publishedAt: Date.parse("2026-10-04T00:00:00+05:30"), positions,
    });
  },
});

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { interpretation, thesisFields } from "./thesisFields";

export async function digest(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("This private link is invalid.");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, "0")).join("");
}
export const reserve = internalMutation({
  args: { tokenHash: v.string(), original: v.string(), investments: v.array(v.string()), clarifications: v.optional(v.array(v.string())) }, returns: v.id("customTheses"),
  handler: async (ctx, args) => {
    if (!args.original.trim() || args.original.length > 3000) throw new Error("Enter your belief in up to 3,000 characters.");
    if (args.clarifications && (args.clarifications.length > 2 || args.clarifications.some(x => x.length > 1500))) throw new Error("Keep your answers under 1,500 characters.");
    if (args.investments.length > 5 || args.investments.some(x => !x.trim() || x.length > 100)) throw new Error("Add up to five investments.");
    const active = await ctx.db.query("customTheses").withIndex("by_created_at").take(10);
    if (active.length >= 10) throw new Error("The first ten thesis places are filled. Please reach out to Anchit.");
    return ctx.db.insert("customTheses", { ...args, state: "interpreting", createdAt: Date.now() });
  },
});
export const finish = internalMutation({
  args: { id: v.id("customTheses"), result: interpretation }, returns: v.null(),
  handler: async (ctx, { id, result }) => { await ctx.db.patch(id, { interpretation: result, state: "draft" }); return null; },
});
export const release = internalMutation({
  args: { id: v.id("customTheses") }, returns: v.null(),
  handler: async (ctx, { id }) => { await ctx.db.delete(id); return null; },
});
const publicThesis = v.object({ original: v.string(), investments: v.array(v.string()), state: thesisFields.state,
  clarifications: v.optional(v.array(v.string())),
  interpretation: v.optional(interpretation), confirmedReflection: v.optional(v.string()) });
export const read = query({
  args: { token: v.string() }, returns: v.union(publicThesis, v.null()),
  handler: async (ctx, { token }) => {
    const tokenHash = await digest(token);
    const row = await ctx.db.query("customTheses").withIndex("by_token_hash", q => q.eq("tokenHash", tokenHash)).unique();
    if (!row) return null;
    return { original: row.original, investments: row.investments, state: row.state,
      clarifications: row.clarifications,
      interpretation: row.interpretation, confirmedReflection: row.confirmedReflection };
  },
});
export const confirm = mutation({
  args: { token: v.string(), reflection: v.string(), investments: v.optional(v.array(v.string())) }, returns: v.null(),
  handler: async (ctx, { token, reflection, investments }) => {
    if (investments && (investments.length > 5 || investments.some(x => !x.trim() || x.length > 100))) throw new Error("Add up to five investments.");
    if (!reflection.trim() || reflection.length > 2000) throw new Error("Enter a reflection in up to 2,000 characters.");
    const tokenHash = await digest(token);
    const row = await ctx.db.query("customTheses").withIndex("by_token_hash", q => q.eq("tokenHash", tokenHash)).unique();
    if (!row || !row.interpretation) throw new Error("This thesis is not ready to save.");
    await ctx.db.patch(row._id, { state: "saved", confirmedReflection: reflection.trim(), ...(investments ? { investments } : {}) });
    return null;
  },
});

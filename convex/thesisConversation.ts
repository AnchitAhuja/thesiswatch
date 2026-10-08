import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { conversation, interpretation, structuredThesis, thesisContext } from "./thesisFields";
import { digest } from "./theses";

export const claim = internalMutation({
  args: { token: v.string(), requestId: v.string(), message: v.optional(v.string()) },
  returns: v.object({ id: v.id("customTheses"), conversation, cached: v.boolean(), result: v.union(interpretation, v.null()), thesis: v.union(structuredThesis, v.null()), context: v.union(thesisContext, v.null()), missingFields: v.array(v.string()), needsConfirmation: v.boolean() }),
  handler: async (ctx, { token, requestId, message }) => {
    const tokenHash = await digest(token);
    const row = await ctx.db.query("customTheses").withIndex("by_token_hash", q => q.eq("tokenHash", tokenHash)).unique();
    if (!row) throw Error("Invalid conversation.");
    const chat = row.conversation || { messages: [{ role: "user" as const, content: row.original }], calls: 0, turns: 0 };
    const metadata = { thesis: row.thesis || null, context: row.context || null, missingFields: row.missingFields || [], needsConfirmation: row.needsConfirmation || false };
    if (chat.lastRequestId === requestId && !chat.busySince && chat.messages.at(-1)?.role === "assistant")
      return { ...metadata, id: row._id, conversation: chat, cached: true, result: row.interpretation || null };
    if (row.interpretation || chat.turns >= 4) throw Error("Conversation complete.");
    if (chat.busySince && Date.now() - chat.busySince < 120000) throw Error("A reply is already in progress.");
    if (chat.calls >= 6) throw Error("Six-call limit reached.");
    if (message !== undefined) {
      if (!message.trim() || message.length > 1500) throw Error("Keep your answer under 1,500 characters.");
      if (chat.messages.at(-1)?.role === "user") {
        if (chat.messages.at(-1)?.content !== message.trim()) throw Error("Retry the unanswered message first.");
      } else chat.messages.push({ role: "user", content: message.trim() });
    }
    if (chat.messages.at(-1)?.role !== "user") throw Error("An answer is needed before the next turn.");
    chat.calls++; chat.busySince = Date.now(); chat.lastRequestId = requestId;
    await ctx.db.patch(row._id, { conversation: chat });
    return { ...metadata, id: row._id, conversation: chat, cached: false, result: null };
  },
});

export const finish = internalMutation({
  args: { id: v.id("customTheses"), requestId: v.string(), reply: v.optional(v.string()), result: v.optional(interpretation), threadId: v.optional(v.string()), thesis: v.optional(structuredThesis), context: v.optional(thesisContext), missingFields: v.optional(v.array(v.string())), needsConfirmation: v.optional(v.boolean()) },
  returns: v.null(),
  handler: async (ctx, { id, requestId, reply, result, threadId, ...metadata }) => {
    const row = await ctx.db.get(id); const chat = row?.conversation;
    if (!row || !chat || chat.lastRequestId !== requestId) throw Error("Conversation changed.");
    if (!chat.busySince) throw Error("This model call has already finished.");
    delete chat.busySince;
    if (threadId) chat.threadId = threadId;
    if (reply) { chat.messages.push({ role: "assistant", content: reply }); chat.turns++; }
    await ctx.db.patch(id, { ...metadata, conversation: chat, ...(result ? { interpretation: result, state: "draft" as const } : {}) });
    return null;
  },
});

"use node";
import { randomBytes, createHash } from "node:crypto";
import { Agent, createThread } from "@convex-dev/agent";
import { jsonSchema } from "ai";
import { meteredClaude } from "./meteredClaude";
import { anthropic } from "@ai-sdk/anthropic";
import { v, type Infer } from "convex/values";
import { action } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { interpretation, structuredThesis, thesisContext } from "./thesisFields";
import { parseChatResponse, legacyInterpretation } from "../shared/chat.mjs";
import { chatSystemPrompt } from "./prompts";

export const reply = action({
  args: { token: v.optional(v.string()), original: v.optional(v.string()), message: v.optional(v.string()), requestId: v.string() },
  returns: v.object({ thesis: v.union(structuredThesis, v.null()), context: v.union(thesisContext, v.null()), missingFields: v.array(v.string()), needsConfirmation: v.boolean(), token: v.string(), reply: v.union(v.string(), v.null()), result: v.union(interpretation, v.null()), calls: v.number(), turns: v.number(), retry: v.boolean(), error: v.union(v.string(), v.null()) }),
  handler: async (ctx, args): Promise<{ thesis: Infer<typeof structuredThesis> | null; context: Infer<typeof thesisContext> | null; missingFields: string[]; needsConfirmation: boolean; token: string; reply: string | null; result: Infer<typeof interpretation> | null; calls: number; turns: number; retry: boolean; error: string | null }> => {
    const token = args.token || randomBytes(32).toString("hex");
    if (!args.token || args.original !== undefined) await ctx.runMutation(internal.theses.reserve, { tokenHash: createHash("sha256").update(token).digest("hex"), original: args.original || "Help me put an investment idea into words.", investments: [] });
    const claim = await ctx.runMutation(internal.thesisConversation.claim, { token, requestId: args.requestId, ...(args.message !== undefined ? { message: args.message } : {}) });
    const { id, conversation: chat } = claim;
    if (claim.cached) return { thesis: claim.thesis, context: claim.context, missingFields: claim.missingFields, needsConfirmation: claim.needsConfirmation, token, reply: chat.messages.at(-1)!.content, result: claim.result, calls: chat.calls, turns: chat.turns, retry: false, error: null };
    const turn = chat.turns + 1, final = turn === 4;
    const trace = JSON.stringify({ conversationId: id, turn, call: chat.calls, messages: chat.messages.length, model: "claude-sonnet-4-5", maxOutputTokens: final ? 1200 : 650, maxRetries: 0 });
    let threadId = chat.threadId;
    let rawModelResponse: string | null = null;
    try {
      if (!process.env.ANTHROPIC_API_KEY) throw Error("AI key unavailable.");
      threadId ||= await createThread(ctx, components.agent, { title: "Private Lookout conversation" });
      const agent = new Agent(components.agent, { name: "Lookout conversation", languageModel: meteredClaude(ctx, anthropic("claude-sonnet-4-5")), instructions: chatSystemPrompt, contextOptions: { recentMessages: 0 } });
      const finalInstructions = final ? 'This is the fourth and last turn: return type thesis. Your reply MUST contain only statements and ZERO question marks. Do NOT ask which company fits or request confirmation; the conversation is finished. Missing details remain null and must be confirmed. If the latest answer is you tell me, your reply MUST give two or three connected company examples with their business connections.' : `This is turn ${turn} of four, NOT the final turn. You MUST return type question and thesis:null. Ask one short question reacting to the latest answer. If all details are established, ask for confirmation of your understanding. Do not produce a provisional thesis before the fourth turn.`;
      console.log(`LOOKOUT_MODEL_CALL_START ${trace}`);
      const response = await agent.generateObject(ctx, { threadId }, {
        schema: jsonSchema(chatReplySchema(final)),
        schemaName: "LookoutChatReply",
        prompt: `${finalInstructions}\n<conversation_state>${JSON.stringify({ lookoutTurn: turn, remainingCalls: 6 - chat.calls, confirmedContext: claim.context })}</conversation_state>\n<whole_conversation>\n${JSON.stringify(chat.messages)}\n</whole_conversation>`,
        maxOutputTokens: final ? 1200 : 650, maxRetries: 0, abortSignal: AbortSignal.timeout(60000),
      });
      rawModelResponse = JSON.stringify(response.object);
      const data = parseChatResponse(rawModelResponse, final);
      const result = data.type === "thesis" ? legacyInterpretation(data) : null;
      await ctx.runMutation(internal.thesisConversation.finish, { id, requestId: args.requestId, reply: data.reply, threadId, context: data.context, missingFields: data.missingFields, needsConfirmation: data.needsConfirmation, ...(result ? { result, thesis: data.thesis } : {}) });
      console.log(`LOOKOUT_MODEL_CALL_OK ${JSON.stringify({ conversationId: id, turn, call: chat.calls, inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens, final: Boolean(result) })}`);
      return { thesis: data.thesis, context: data.context, missingFields: data.missingFields, needsConfirmation: data.needsConfirmation, token, reply: data.reply, result, calls: chat.calls, turns: turn, retry: false, error: null };
    } catch (e) {
      const failedText = e && typeof e === "object" && "text" in e ? String(e.text) : null;
      console.log(`LOOKOUT_MODEL_RAW_RESPONSE ${JSON.stringify({ conversationId: id, turn, call: chat.calls, response: rawModelResponse ?? failedText, error: e instanceof Error ? e.message : String(e) })}`);
      await ctx.runMutation(internal.thesisConversation.finish, { id, requestId: args.requestId, ...(threadId ? { threadId } : {}) });
      const validationMessages = ["Invalid turn type.", "Reply must be short and ask one question at a time.", "Invalid context.", "Invalid thesis.", "Invalid thesis details.", "Question unexpectedly included a thesis.", "Unacceptable wording."];
      const reason = e instanceof Error && validationMessages.includes(e.message) ? e.message : "Provider or persistence error.";
      console.log(`LOOKOUT_MODEL_CALL_FAILED ${JSON.stringify({ conversationId: id, turn, call: chat.calls, retry: chat.calls < 6, reason })}`);
      return { thesis: null, context: null, missingFields: [], needsConfirmation: false, token, reply: null, result: null, calls: chat.calls, turns: chat.turns, retry: e instanceof Error && e.message.includes("thinking limit") ? false : chat.calls < 6, error: e instanceof Error && e.message.includes("thinking limit") ? "Lookout has hit today's thinking limit, try again tomorrow." : "Lookout couldn't think right now, try again" };
    }
  },
});

function chatReplySchema(final: boolean): import("ai").JSONSchema7 {
  const shortText = (maxLength: number) => ({ type: "string" as const, minLength: 1, maxLength });
  const context = {
    type: "object" as const, additionalProperties: false,
    properties: Object.fromEntries(["belief", "why", "whatWouldProveItWrong", "timeHorizon"].map(key => [key, { anyOf: [shortText(300), { type: "null" }] }])),
    required: ["belief", "why", "whatWouldProveItWrong", "timeHorizon"],
  };
  const thesis = {
    type: "object" as const, additionalProperties: false,
    properties: {
      thesis: shortText(300), sector: shortText(80),
      assumptions: { type: "array", items: shortText(200), minItems: 3, maxItems: 3 },
      watchSignals: { type: "array", items: shortText(200), minItems: 3, maxItems: 5 },
    }, required: ["thesis", "sector", "assumptions", "watchSignals"],
  };
  return {
    type: "object", additionalProperties: false,
    properties: { type: { type: "string", enum: [final ? "thesis" : "question"] }, reply: { ...shortText(500), pattern: final ? "^[^?]*$" : "^[^?]*[?]$" }, context, thesis: final ? thesis : { type: "null" } },
    required: ["type", "reply", "context", "thesis"],
  };
}

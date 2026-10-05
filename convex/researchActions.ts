"use node";
import { Agent } from "@convex-dev/agent";
import { convexGateway } from "@convex-dev/ai-sdk-provider";
import { anthropic } from "@ai-sdk/anthropic";
import { getServiceToken } from "convex/server";
import { stepCountIs } from "ai";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { components, internal } from "./_generated/api";

const MODEL = "claude-sonnet-4-5";
const GATEWAY_MODEL = "anthropic/claude-sonnet-4.5";

// Probe access without requesting a model completion or displaying credentials.
async function providerAccess(): Promise<{ gatewayAvailable: boolean; anthropicKeyConfigured: boolean }> {
  let gatewayAvailable = false;
  try {
    const token = await getServiceToken("ai-gateway");
    const response = await fetch("https://ai-gateway.convex.dev/v1/models", {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
    });
    if (response.ok) {
      const models = await response.json() as { data?: { id: string }[] };
      gatewayAvailable = Boolean(models.data?.some(model => model.id === GATEWAY_MODEL));
    }
  } catch { /* Disabled gateway is expected on a free Convex plan. */ }
  return { gatewayAvailable, anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY) };
}

export const configuration = internalAction({
  args: {}, returns: v.object({ gatewayAvailable: v.boolean(), anthropicKeyConfigured: v.boolean() }),
  handler: async (): Promise<{ gatewayAvailable: boolean; anthropicKeyConfigured: boolean }> => providerAccess(),
});

const output = {
  text: v.string(), searched: v.boolean(), sourceUrls: v.array(v.string()),
  model: v.string(), inputTokens: v.number(), outputTokens: v.number(),
};
export const generate = internalAction({
  args: { runId: v.id("researchRuns") }, returns: v.object(output),
  handler: async (ctx, { runId }): Promise<{
    text: string; searched: boolean; sourceUrls: string[]; model: string; inputTokens: number; outputTokens: number;
  }> => {
    const access = await providerAccess();
    if (!access.gatewayAvailable && !access.anthropicKeyConfigured) {
      throw new Error("Claude is not connected: configure ANTHROPIC_API_KEY in production Convex environment variables.");
    }
    const { threadId, prompt } = await ctx.runMutation(internal.research.prepareThread, { runId });
    const researcher = new Agent(components.agent, {
      name: "Lookout weekly AI thesis researcher",
      languageModel: access.gatewayAvailable ? convexGateway.messages(GATEWAY_MODEL) : anthropic(MODEL),
      instructions: "Follow the supplied Lookout research prompt. Research using the provided search and fetch tools. Return a private draft, never a published edition.",
      tools: {
        web_search: anthropic.tools.webSearch_20250305({ maxUses: 30 }),
        web_fetch: anthropic.tools.webFetch_20250910({ maxUses: 40, citations: { enabled: true }, maxContentTokens: 12000 }),
      },
    });
    const result = await researcher.generateText(ctx, { threadId }, {
      prompt, maxOutputTokens: 12000, maxRetries: 0, stopWhen: stepCountIs(4),
      abortSignal: AbortSignal.timeout(8 * 60 * 1000),
    });
    const searched = result.steps.some(step => step.toolCalls.some(call => call.toolName === "web_search"))
      && result.steps.some(step => step.toolResults.some(tool => tool.toolName === "web_search" && Array.isArray(tool.output)));
    const sourceUrls = [...new Set(result.sources.flatMap(source => source.sourceType === "url" ? [source.url] : []))];
    return {
      text: result.text, searched, sourceUrls, model: access.gatewayAvailable ? GATEWAY_MODEL : MODEL,
      inputTokens: result.totalUsage.inputTokens ?? 0, outputTokens: result.totalUsage.outputTokens ?? 0,
    };
  },
});

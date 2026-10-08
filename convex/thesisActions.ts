"use node";
import { randomBytes, createHash } from "node:crypto";
import { Agent, createThread } from "@convex-dev/agent";
import { meteredClaude } from "./meteredClaude";
import { anthropic } from "@ai-sdk/anthropic";
import { v, type Infer } from "convex/values";
import { action } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { interpretation } from "./thesisFields";
import { parseInterpretation, interpretationInstructions } from "../shared/thesis.mjs";

export const interpret = action({
  args: { original: v.string(), investments: v.array(v.string()), clarifications: v.optional(v.array(v.string())) },
  returns: v.object({ token: v.string(), result: interpretation }),
  handler: async (ctx, args): Promise<{ token: string; result: Infer<typeof interpretation> }> => {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("Thesis interpretation is not connected yet.");
    const token = randomBytes(32).toString("hex");
    const id = await ctx.runMutation(internal.theses.reserve, { ...args, tokenHash: createHash("sha256").update(token).digest("hex") });
    try {
      const threadId = await createThread(ctx, components.agent, { title: "Private thesis interpretation" });
      const agent = new Agent(components.agent, {
        name: "Lookout thesis interpretation", languageModel: meteredClaude(ctx, anthropic("claude-sonnet-4-5")),
        instructions: interpretationInstructions,
      });
      const response = await agent.generateText(ctx, { threadId }, {
        prompt: `${interpretationInstructions}\n\n<user_statement>\n${JSON.stringify(args)}\n</user_statement>`, maxOutputTokens: 2000, maxRetries: 0, abortSignal: AbortSignal.timeout(60000),
      });
      const result = parseInterpretation(response.text);
      await ctx.runMutation(internal.theses.finish, { id, result });
      return { token, result };
    } catch (e) {
      await ctx.runMutation(internal.theses.release, { id });
      if (e instanceof Error && e.message.includes("thinking limit")) throw e;
      throw new Error("We couldn't interpret your belief. Please try again.");
    }
  },
});

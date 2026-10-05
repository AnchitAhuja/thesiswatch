import { WorkflowManager, vWorkflowId, vResultValidator } from "@convex-dev/workflow";
import { createThread } from "@convex-dev/agent";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal, components } from "./_generated/api";
import { researchInstructions } from "./researchPrompt";
import { buildResearchPrompt, researchWindow, splitResearchReport } from "../shared/research.mjs";

const workflow = new WorkflowManager(components.workflow, { workpoolOptions: { maxParallelism: 1 } });

export const startWeekly = internalMutation({
  args: {}, returns: v.union(v.id("researchRuns"), v.null()),
  handler: async (ctx): Promise<Id<"researchRuns"> | null> => {
    // Enable in production only; a developer's deployment must not run a second paid job.
    if (process.env.RESEARCH_SCHEDULE_ENABLED !== "true") return null;
    const window = researchWindow(Date.now());
    if (!window) return null;
    const existing = await ctx.db.query("researchRuns").withIndex("by_key", q => q.eq("key", window.key)).unique();
    if (existing) return existing._id;
    const baseline = await ctx.db.query("editions").withIndex("by_published_at").order("desc").first();
    if (!baseline) throw new Error("Save an approved edition before starting weekly research.");
    const runId = await ctx.db.insert("researchRuns", {
      key: window.key, editionDate: window.editionDate, windowStart: window.start, windowEnd: window.end,
      baselineEditionId: baseline._id, prompt: buildResearchPrompt(researchInstructions, baseline, window),
      status: "queued", startedAt: Date.now(),
    });
    const workflowId = await workflow.start(ctx, internal.research.run, { runId }, {
      startAsync: true, onComplete: internal.research.onComplete, context: { runId },
    });
    await ctx.db.patch(runId, { workflowId });
    return runId;
  },
});

export const run = workflow.define({
  args: { runId: v.id("researchRuns") }, returns: v.null(),
}).handler(async (step, args): Promise<null> => {
  // No automatic repeat of a paid research call after an ambiguous provider failure.
  const result = await step.runAction(internal.researchActions.generate, args, { retry: false });
  await step.runMutation(internal.research.complete, { ...args, ...result });
  return null;
});

export const prepareThread = internalMutation({
  args: { runId: v.id("researchRuns") }, returns: v.object({ threadId: v.string(), prompt: v.string() }),
  handler: async (ctx, { runId }): Promise<{ threadId: string; prompt: string }> => {
    const job = await ctx.db.get(runId);
    if (!job) throw new Error("Research run not found.");
    const threadId = job.threadId || await createThread(ctx, components.agent, { title: `Lookout ${job.editionDate}` });
    await ctx.db.patch(runId, { threadId, status: "running" });
    return { threadId, prompt: job.prompt };
  },
});

export const complete = internalMutation({
  args: {
    runId: v.id("researchRuns"), text: v.string(), searched: v.boolean(), sourceUrls: v.array(v.string()),
    model: v.string(), inputTokens: v.number(), outputTokens: v.number(),
  }, returns: v.null(),
  handler: async (ctx, { runId, ...result }): Promise<null> => {
    const job = await ctx.db.get(runId);
    if (!job) throw new Error("Research run not found.");
    if (job.status === "draft") return null;
    const report = splitResearchReport(result.text, result.searched);
    await ctx.db.patch(runId, { ...result, ...report, status: "draft", finishedAt: Date.now(), error: undefined });
    // Drafts are deliberately kept outside editions; the existing mail job cannot send them.
    return null;
  },
});

export const onComplete = internalMutation({
  args: { workflowId: vWorkflowId, result: vResultValidator, context: v.object({ runId: v.id("researchRuns") }) },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    if (args.result.kind !== "success") {
      const job = await ctx.db.get(args.context.runId);
      if (job && job.status !== "draft") await ctx.db.patch(job._id, {
        status: "failed", finishedAt: Date.now(),
        error: "Research did not finish. Check researchActions.configuration and the private agent thread before retrying.",
      });
    }
    return null;
  },
});

export const latestDraft = internalQuery({
  args: {}, returns: v.any(),
  handler: async (ctx): Promise<Doc<"researchRuns"> | null> => ctx.db.query("researchRuns").withIndex("by_window_end").order("desc").first(),
});

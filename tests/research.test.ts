import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import workflowTest from "@convex-dev/workflow/test";
import agentTest from "@convex-dev/agent/test";
import schema from "../convex/schema";
import { internal } from "../convex/_generated/api";
import crons from "../convex/crons";
import { buildResearchPrompt, researchWindow, splitResearchReport } from "../shared/research.mjs";
import { readFileSync } from "node:fs";
import { researchInstructions } from "../convex/researchPrompt";
import { Agent } from "@convex-dev/agent";

const modules = import.meta.glob("../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  workflowTest.register(t);
  agentTest.register(t);
  return t;
}
beforeEach(() => { vi.useFakeTimers(); vi.stubEnv("RESEARCH_SCHEDULE_ENABLED", "true"); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Saturday Claude research", () => {
  it("starts October 10 at 9 AM IST, and advances both window bounds every week", () => {
    expect(researchWindow(Date.parse("2026-10-10T03:29:59Z"))).toBe(null);
    const first = researchWindow(Date.parse("2026-10-10T03:30:00Z"))!;
    expect(first.start).toBe(Date.parse("2026-10-03T03:30:00Z"));
    expect(first.end).toBe(Date.parse("2026-10-10T03:30:00Z"));
    expect(first.editionDate).toBe("Oct 10, 2026");
    const next = researchWindow(Date.parse("2026-10-17T03:30:00Z"))!;
    expect(next.start).toBe(first.end);
    expect(next.end).toBe(first.end + 7 * 24 * 60 * 60 * 1000);
    expect(researchWindow(Date.parse("2026-10-13T00:00:00Z"))!.key).toBe(first.key);
  });
  it("builds the actual prompt using the latest saved edition and this week's dates", async () => {
    const t = setup();
    await t.mutation(internal.editions.seedCurrent, {});
    const edition = await t.query(internal.editions.latest, {});
    const window = researchWindow(Date.parse("2026-10-17T03:30:00Z"))!;
    const text = buildResearchPrompt(researchInstructions, edition!, window);
    expect(text).toContain("2026-10-10T09:00:00+05:30");
    expect(text).toContain("2026-10-17T09:00:00+05:30");
    expect(text).toContain("Oct 17, 2026");
    expect(text).toContain(edition!.positions[0].reason);
    expect(text).toContain('"status": "WATCH"');
    expect(text).not.toContain("[EDITION_DATE_IST]");
    expect(text).toContain("Retain its previous status exactly");
    const source = readFileSync("prompts/weekly-ai-thesis.md", "utf8");
    expect(researchInstructions).toBe(source.match(/<instructions>([\s\S]*?)<\/instructions>/)![1].trim());
  });
  it("queues one durable run per week, with the baseline frozen when the job starts", async () => {
    const t = setup();
    const baseline = await t.mutation(internal.editions.seedCurrent, {});
    vi.setSystemTime(new Date("2026-10-10T03:30:00Z"));
    const first = await t.mutation(internal.research.startWeekly, {});
    const second = await t.mutation(internal.research.startWeekly, {});
    expect(first).toBe(second);
    const jobs = await t.run(ctx => ctx.db.query("researchRuns").collect());
    expect(jobs).toHaveLength(1);
    expect(jobs[0].baselineEditionId).toBe(baseline);
    expect(jobs[0].workflowId).toBeDefined();
  });
  it("skips development and dates before the first scheduled run", async () => {
    const t = setup();
    await t.mutation(internal.editions.seedCurrent, {});
    vi.setSystemTime(new Date("2026-10-03T03:30:00Z"));
    expect(await t.mutation(internal.research.startWeekly, {})).toBe(null);
    vi.setSystemTime(new Date("2026-10-10T03:30:00Z"));
    vi.stubEnv("RESEARCH_SCHEDULE_ENABLED", "false");
    expect(await t.mutation(internal.research.startWeekly, {})).toBe(null);
    expect(await t.run(ctx => ctx.db.query("researchRuns").collect())).toHaveLength(0);
  });
  it("saves a private draft, never publishes it or changes the approved edition", async () => {
    const t = setup();
    const baseline = await t.mutation(internal.editions.seedCurrent, {});
    vi.setSystemTime(new Date("2026-10-10T03:30:00Z"));
    const runId = (await t.mutation(internal.research.startWeekly, {}))!;
    const tickers = ["CEG", "GRID", "ICLN", "FLKR", "SMH", "AMZN", "GOOG", "MSFT", "QQQ", "AAPL", "TSLA"];
    const text = `---EDITOR REVIEW — NOT FOR EMAIL---\nReview state: READY FOR EDITOR REVIEW\n---READER EDITION---\nLookout\nEdition dated Oct 10, 2026\n${tickers.map(t => `${t} — WATCH\nTest draft evidence.\nGo deeper: https://example.com/${t}`).join("\n")}\nUnexpected Connections\nNo significant unexpected connections found this week.`;
    await t.mutation(internal.research.complete, { runId, text, searched: true, sourceUrls: ["https://example.com"], model: "test-only", inputTokens: 1, outputTokens: 1 });
    const draft = await t.query(internal.research.latestDraft, {});
    expect(draft!.status).toBe("draft");
    expect(draft!.reviewState).toBe("READY FOR EDITOR REVIEW");
    expect((await t.query(internal.editions.latest, {}))!._id).toBe(baseline);
    expect(await t.run(ctx => ctx.db.query("mailDeliveries").collect())).toHaveLength(0);
    expect(splitResearchReport(text, false).reviewState).toBe("NEEDS REVIEW");
    expect(splitResearchReport(text.replace("TSLA — WATCH", "UNKNOWN — WATCH"), true).reviewState).toBe("NEEDS REVIEW");
  });
  it("sets an incomplete response aside for review instead of manufacturing research", () => {
    expect(splitResearchReport("An incomplete response", true).reviewState).toBe("NEEDS REVIEW");
  });
  it("executes the durable workflow, creates an agent thread and saves the returned draft", async () => {
    const t = setup();
    vi.stubEnv("ANTHROPIC_API_KEY", "unit-test-placeholder");
    const generate = vi.spyOn(Agent.prototype, "generateText").mockResolvedValue({
      text: "---EDITOR REVIEW — NOT FOR EMAIL---\nReview state: NEEDS REVIEW\n---READER EDITION---\nA private test draft.",
      steps: [{ toolCalls: [{ toolName: "web_search" }], toolResults: [{ toolName: "web_search", output: [] }] }],
      sources: [], totalUsage: { inputTokens: 2, outputTokens: 3 },
    } as never);
    const baseline = await t.mutation(internal.editions.seedCurrent, {});
    vi.setSystemTime(new Date("2026-10-10T03:30:00Z"));
    await t.mutation(internal.research.startWeekly, {});
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    const job = await t.query(internal.research.latestDraft, {});
    expect(job!.status).toBe("draft");
    expect(job!.threadId).toBeDefined();
    expect(job!.inputTokens).toBe(2);
    expect(job!.readerEdition).toBe("A private test draft.");
    expect(job!.reviewState).toBe("NEEDS REVIEW");
    expect(generate).toHaveBeenCalledTimes(1);
    expect((await t.query(internal.editions.latest, {}))!._id).toBe(baseline);
  });
  it("registers Saturday 03:30 UTC while retaining the existing 04:30 UTC email job", () => {
    const definitions = JSON.parse(crons.export());
    expect(definitions["research weekly AI thesis"].schedule).toEqual({ type: "weekly", dayOfWeek: "saturday", hourUTC: 3, minuteUTC: 30 });
    expect(definitions["send latest AI edition"].schedule.minuteUTC).toBe(30);
    expect(definitions["send latest AI edition"].schedule.hourUTC).toBe(4);
  });
  it("checks search and fetch separately without creating an edition or scheduled research run", async () => {
    const t = setup();
    vi.stubEnv("ANTHROPIC_API_KEY", "unit-test-placeholder");
    vi.spyOn(Agent.prototype, "generateText").mockResolvedValue({
      steps: [{ toolResults: [{ toolName: "web_search", output: [] }, { toolName: "web_fetch", output: { type: "web_fetch_result" } }] }],
    } as never);
    expect(await t.action(internal.researchActions.checkConnection, {})).toEqual({ searchWorking: true, fetchWorking: true, model: "claude-sonnet-4-5" });
    expect(await t.run(ctx => ctx.db.query("researchRuns").collect())).toHaveLength(0);
    expect(await t.run(ctx => ctx.db.query("editions").collect())).toHaveLength(0);
  });
});

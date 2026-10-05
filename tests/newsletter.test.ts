import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import resendTest from "@convex-dev/resend/test";
import workpoolTest from "@convex-dev/workpool/test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import schema from "../convex/schema";
import { internal, api, components } from "../convex/_generated/api";
import { renderEdition } from "../shared/newsletter.mjs";
import { portfolio, weeklyAssessments } from "../src/portfolio.js";
import crons from "../convex/crons";

const modules = import.meta.glob("../convex/**/*.ts");
vi.hoisted(() => vi.stubEnv("RESEND_API_KEY", "unit-test-placeholder"));
function setup() {
  const t = convexTest(schema, modules);
  resendTest.register(t);
  workpoolTest.register(t, "resend/emailWorkpool");
  workpoolTest.register(t, "resend/callbackWorkpool");
  rateLimiterTest.register(t, "resend/rateLimiter");
  return t;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site");
  // Dummy value used only by the in-memory component; no provider calls run.
  vi.stubEnv("RESEND_API_KEY", "unit-test-placeholder");
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("saved edition email delivery", () => {
  it("saves the supplied edition without changing any position or assessment", async () => {
    const t = setup();
    const id = await t.mutation(internal.editions.seedCurrent, {});
    const edition = await t.run(ctx => ctx.db.get(id));
    expect(edition!.date).toBe("Oct 4, 2026");
    expect(edition!.positions).toHaveLength(11);
    for (const p of edition!.positions) {
      expect(p.thesis).toBe(portfolio.find(row => row.ticker === p.ticker)!.thesis);
      expect({ status: p.status, reason: p.reason, source: p.source }).toEqual(weeklyAssessments[p.ticker]);
    }
    expect(await t.mutation(internal.editions.seedCurrent, {})).toBe(id);
    const body = renderEdition(edition!, "https://example.convex.site/api/unsubscribe?token=private");
    expect(body).toContain("Edition dated Oct 4, 2026");
    expect(body).toContain("unsubscribe?token=private");
    for (const p of edition!.positions) expect(body).toContain(p.reason);
  });

  it("queues once per subscriber per edition, and allows a later edition", async () => {
    const t = setup();
    const editionId = await t.mutation(internal.editions.seedCurrent, {});
    const subscriberId = await t.run(ctx => ctx.db.insert("trackingOptIns", { email: "delivered+test@resend.dev", savedAt: "original date" }));
    const args = { subscriberId, editionId, token: "private-test-token" };
    await Promise.all([t.mutation(internal.mail.enqueue, args), t.mutation(internal.mail.enqueue, args)]);
    let rows = await t.run(ctx => ctx.db.query("mailDeliveries").collect());
    expect(rows).toHaveLength(1);
    const email = await t.query(components.resend.lib.get, { emailId: rows[0].emailId });
    expect(email!.text).toContain("Oct 4, 2026");
    expect(email!.text).not.toContain("delivered+test@resend.dev");
    const saved = await t.run(ctx => ctx.db.get(editionId));
    const nextId = await t.mutation(internal.editions.save, { key: "test-next", date: "test next date", publishedAt: saved!.publishedAt + 1, positions: saved!.positions });
    await t.mutation(internal.mail.enqueue, { ...args, editionId: nextId });
    rows = await t.run(ctx => ctx.db.query("mailDeliveries").collect());
    expect(rows).toHaveLength(2);
    expect((await t.run(ctx => ctx.db.get(subscriberId)))!.savedAt).toBe("original date");
  });

  it("keeps normal signup working in test mode without sending to real recipients", async () => {
    const t = setup();
    const editionId = await t.mutation(internal.editions.seedCurrent, {});
    expect(await t.mutation(api.tracking.save, { email: "person@example.com" })).toBe(null);
    const subscriber = await t.run(ctx => ctx.db.query("trackingOptIns").unique());
    expect(await t.mutation(internal.mail.enqueue, { subscriberId: subscriber!._id, editionId, token: "unused" })).toBe(null);
    expect(await t.run(ctx => ctx.db.query("mailDeliveries").collect())).toHaveLength(0);
    expect((await t.run(ctx => ctx.db.get(subscriber!._id)))!.unsubscribeToken).toBeUndefined();
  });

  it("waits for a saved edition and sends the latest edition through the signup task", async () => {
    const t = setup();
    await t.mutation(api.tracking.save, { email: "delivered+test@resend.dev" });
    const subscriber = await t.run(ctx => ctx.db.query("trackingOptIns").unique());
    expect(await t.action(internal.mailActions.prepare, { subscriberId: subscriber!._id })).toBe(null);
    const editionId = await t.mutation(internal.editions.seedCurrent, {});
    await t.action(internal.mailActions.prepare, { subscriberId: subscriber!._id });
    const delivery = await t.run(ctx => ctx.db.query("mailDeliveries").unique());
    expect(delivery!.editionId).toBe(editionId);
    const token = (await t.run(ctx => ctx.db.get(subscriber!._id)))!.unsubscribeToken;
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("does not unsubscribe on GET; private POST cancels queued mail and blocks future sends", async () => {
    const t = setup();
    const editionId = await t.mutation(internal.editions.seedCurrent, {});
    const subscriberId = await t.run(ctx => ctx.db.insert("trackingOptIns", { email: "delivered+test@resend.dev", savedAt: "original date" }));
    const args = { subscriberId, editionId, token: "private-test-token" };
    await t.mutation(internal.mail.enqueue, args);
    expect((await t.fetch("/unsubscribe?token=private-test-token")).status).toBe(200);
    expect((await t.run(ctx => ctx.db.get(subscriberId)))!.unsubscribedAt).toBeUndefined();
    expect((await t.fetch("/unsubscribe?token=wrong", { method: "POST" })).status).toBe(404);
    expect((await t.fetch("/unsubscribe?token=private-test-token", { method: "POST" })).status).toBe(200);
    expect((await t.run(ctx => ctx.db.get(subscriberId)))!.unsubscribedAt).toBeDefined();
    const delivery = await t.run(ctx => ctx.db.query("mailDeliveries").unique());
    expect((await t.query(components.resend.lib.get, { emailId: delivery!.emailId }))!.status).toBe("cancelled");
    expect(await t.mutation(internal.mail.enqueue, args)).toBe(null);
  });

  it("pins a weekly run to the newest saved edition and schedules subscriber batches", async () => {
    const t = setup();
    await t.mutation(internal.editions.seedCurrent, {});
    const original = await t.query(internal.editions.latest, {});
    const latestId = await t.mutation(internal.editions.save, { key: "newest-test", date: "test date", publishedAt: original!.publishedAt + 1, positions: original!.positions });
    for (let i = 0; i < 51; i++) await t.run(ctx => ctx.db.insert("trackingOptIns", { email: `delivered+unit${i}@resend.dev`, savedAt: "test" }));
    await t.mutation(internal.mail.sendWeekly, {});
    const scheduled = await t.run(ctx => ctx.db.system.query("_scheduled_functions").collect());
    expect(scheduled.filter(job => job.name === "mailActions:prepare")).toHaveLength(50);
    expect(scheduled.find(job => job.name === "mail:fanout")!.args[0].editionId).toBe(latestId);
    expect(scheduled.filter(job => job.name === "mailActions:prepare").every(job => job.args[0].editionId === latestId)).toBe(true);
  });

  it("uses Saturday 04:30 UTC, which is 10:00 AM IST", () => {
    const definition = JSON.parse(crons.export());
    expect(definition["send latest AI edition"].schedule).toEqual({ type: "weekly", dayOfWeek: "saturday", hourUTC: 4, minuteUTC: 30 });
  });
});

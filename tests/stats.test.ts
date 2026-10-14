import { expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { internal } from '../convex/_generated/api';
import { summary } from '../convex/stats';

const modules = import.meta.glob('../convex/**/*.ts');
it('reports saved checks without exposing emails or changing data', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-14T20:00:00Z'));
  try {
    const t = convexTest(schema, modules);
    await t.run(async ctx => {
      const id = await ctx.db.insert('customTheses', {
        tokenHash: 'private', original: 'test', investments: ['TEST'], state: 'draft',
        createdAt: Date.parse('2026-10-14T19:00:00Z'), standingKey: 'checked',
        standingEmail: 'anna@gmail.com',
        standingProgress: { step: 'Stopped', updatedAt: Date.parse('2026-10-14T19:00:00Z') },
        interpretation: { belief: '', reflection: '', statedReasons: ['ask anna@gmail.com'],
          inferredAssumptions: ['ask anna@gmail.com'], unverifiedClaims: [], risks: [],
          strengtheningEvidence: [], weakeningEvidence: [] },
      });
      await ctx.db.insert('holdingSessions', { tokenHash: 'session-secret', original: '',
        createdAt: Date.now(), email: 'ANNA@gmail.com',
        lines: [{ stock: 'TEST', reasons: ['ask anna@gmail.com'], match: null, thesisId: id }] });
      await ctx.db.insert('trackingOptIns', { email: 'anna@gmail.com', savedAt: 'today' });
    });
    const snapshot = () => t.run(async ctx => JSON.stringify(await Promise.all([
      ctx.db.query('customTheses').collect(), ctx.db.query('holdingSessions').collect(),
      ctx.db.query('trackingOptIns').collect(),
    ])));
    const before = await snapshot();
    const { report } = await t.query(internal.stats.summary, {});
    expect(report).toContain('Total checks: 1');
    expect(report).toContain('2026-10-15: 1');
    expect(report).toContain('2026-10-15 00:30:00 | TEST | ask an***@gmail.com | Stopped | 0 | not stored');
    expect(report).toContain('Unique emails saved: 1');
    expect(report).toMatch(/Unique users .*: 1/);
    expect(report).not.toContain('anna@gmail.com');
    expect(report).not.toContain('session-secret');
    expect(await snapshot()).toBe(before);
    expect((summary as unknown as { isInternal: boolean }).isInternal).toBe(true);
  } finally { vi.useRealTimers(); }
});

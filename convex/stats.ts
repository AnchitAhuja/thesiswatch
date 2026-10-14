import { internalQuery } from './_generated/server';
import { v } from 'convex/values';

const DAY = 86400000;
const IST = 19800000;
const LIMIT = 10000;
const day = (time: number) => new Date(time + IST).toISOString().slice(0, 10);
const timeIST = (time: number) => new Date(time + IST).toISOString().replace('T', ' ').slice(0, 19);
// User-entered stock names and reasons can also contain email addresses.
const safe = (text: string) => text.replace(/([^\s@]+)@([^\s@]+\.[^\s@]+)/g,
  (_match, local: string, domain: string) => `${local.slice(0, 2)}***@${domain}`)
  .replace(/[\r\n\t|]/g, ' ');

export const summary = internalQuery({
  args: {},
  returns: v.object({ report: v.string() }),
  handler: async (ctx) => {
    // Bounded reads: refuse to report partial totals if a table outgrows this report.
    const theses = await ctx.db.query('customTheses').withIndex('by_created_at').take(LIMIT + 1);
    const sessions = await ctx.db.query('holdingSessions').withIndex('by_token_hash').take(LIMIT + 1);
    const subscribers = await ctx.db.query('trackingOptIns').withIndex('by_email').take(LIMIT + 1);
    if ([theses, sessions, subscribers].some(rows => rows.length > LIMIT)) {
      throw new Error('Stats exceeded the 10,000-row limit for a table; no partial totals returned.');
    }
    const emails = new Set<string>();
    const saveEmail = (email?: string) => { if (email?.trim()) emails.add(email.trim().toLowerCase()); };
    subscribers.forEach(row => saveEmail(row.email));
    const owners = new Map<string, string>();
    sessions.forEach(session => {
      saveEmail(session.email);
      session.lines.forEach(line => { if (line.thesisId) owners.set(line.thesisId, session._id); });
    });
    const users = new Set<string>();
    const checks: { time: number; stock: string; reason: string; status: string; sources: number }[] = [];
    for (const thesis of theses) {
      saveEmail(thesis.email);
      saveEmail(thesis.standingEmail);
      if (!thesis.standingKey && !thesis.standingResult && !thesis.standingProgress && !thesis.standingBusySince) continue;
      users.add(owners.get(thesis._id) ?? thesis.tokenHash);
      const result = thesis.standingResult;
      const time = thesis.standingBusySince ?? thesis.standingProgress?.updatedAt ?? result?.checkedAt ?? thesis.createdAt;
      const reasons = result?.assumptions.map(row => row.assumption)
        ?? thesis.thesis?.assumptions ?? thesis.interpretation?.inferredAssumptions ?? [];
      reasons.forEach((reason, index) => {
        const row = result?.assumptions[index];
        const status = thesis.standingBusySince
          ? (Date.now() - thesis.standingBusySince >= 600000 ? 'Stopped' : 'Running')
          : row?.status ?? thesis.standingProgress?.step ?? 'Stopped';
        checks.push({ time, stock: thesis.investments.join(', ') || thesis.standingStockId || 'Unknown',
          reason, status, sources: row?.sources.length ?? 0 });
      });
    }
    const today = day(Date.now());
    const days = Array.from({ length: 7 }, (_, i) => day(Date.parse(today + 'T00:00:00Z') - (6 - i) * DAY - IST));
    const lines = [
      'PRODUCTION stats (IST)',
      'Checks = saved reason checks; latest state per reason. Repeat runs are not stored as history.',
      `Total checks: ${checks.length}`,
      'Checks per day (last 7 IST calendar days, including today):',
      ...days.map(date => `${date}: ${checks.filter(check => day(check.time) === date).length}`),
      `Unique users (session id; standalone checks use private token hash): ${users.size}`,
      `Unique emails saved: ${emails.size}`,
      'Emails are counted only; addresses and user/session ids are not listed.',
      'Total ms: not stored in the database (available only in runtime logs).',
      'Last 50 saved reason checks (latest first):',
      'Time (IST) | Stock | Reason | Final status | Sources kept | Total ms',
      ...checks.sort((a, b) => b.time - a.time).slice(0, 50).map(check =>
        `${timeIST(check.time)} | ${safe(check.stock)} | ${safe(check.reason)} | ${safe(check.status)} | ${check.sources} | not stored`),
    ];
    if (!checks.length) lines.push('(no saved checks)');
    return { report: lines.join('\n') };
  },
});

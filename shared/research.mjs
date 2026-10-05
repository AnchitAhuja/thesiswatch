import { groups, portfolio } from '../src/portfolio.js';

export const FIRST_RESEARCH_AT = Date.parse('2026-10-10T03:30:00Z');
const WEEK = 7 * 24 * 60 * 60 * 1000;
const TICKERS = ['CEG', 'GRID', 'ICLN', 'FLKR', 'SMH', 'AMZN', 'GOOG', 'MSFT', 'QQQ', 'AAPL', 'TSLA'];

export function researchWindow(now) {
  if (now < FIRST_RESEARCH_AT) return null;
  const end = FIRST_RESEARCH_AT + Math.floor((now - FIRST_RESEARCH_AT) / WEEK) * WEEK;
  const calendar = new Date(end + 5.5 * 60 * 60 * 1000);
  const day = calendar.toISOString().slice(0, 10);
  const editionDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(end);
  return { key: `ai:${day}`, editionDate, start: end - WEEK, end };
}
const ist = timestamp => `${new Date(timestamp + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 19)}+05:30`;

export function buildResearchPrompt(instructions, previousEdition, window) {
  const tracked = groups.flatMap(group => portfolio.filter(p => p.group === group).sort((a, b) => a.ticker.localeCompare(b.ticker)));
  const previous = { date: previousEdition.date, positions: previousEdition.positions };
  return `<instructions>\n${instructions}\n</instructions>\n\n<reporting_period>\nEdition date: ${window.editionDate}\nResearch window start, exclusive (after): ${ist(window.start)}\nResearch window end, inclusive (through): ${ist(window.end)}\nTimezone: Asia/Kolkata (IST, UTC+05:30)\nPublication schedule: Saturday 10:00 AM IST\n</reporting_period>\n\n<tracked_positions>\n${JSON.stringify(tracked, null, 2)}\n</tracked_positions>\n\n<previous_edition>\n${JSON.stringify(previous, null, 2)}\n</previous_edition>\n\nResearch this period yourself using web_search and web_fetch. Return the two exact output sections specified above, with every ticker row in plain text in the fixed order. This is a private draft for human review: do not publish it or send email. Stop and flag any unresolved search limitations rather than claiming the research was completed.`;
}

/** @returns {{ editorReview: string, readerEdition: string, reviewState: 'READY FOR EDITOR REVIEW' | 'NEEDS REVIEW' }} */
export function splitResearchReport(text, searched) {
  const editorHeader = '---EDITOR REVIEW — NOT FOR EMAIL---';
  const readerHeader = '---READER EDITION---';
  const editorStart = text.indexOf(editorHeader);
  const readerStart = text.indexOf(readerHeader);
  const editorReview = editorStart >= 0 && readerStart > editorStart
    ? text.slice(editorStart + editorHeader.length, readerStart).trim() : text;
  const readerEdition = readerStart >= 0 ? text.slice(readerStart + readerHeader.length).trim() : '';
  const rows = [...readerEdition.matchAll(/^([A-Z]{2,5})\s*[—–-]\s*(STRENGTHENING|INTACT|WATCH|WEAKENING)\s*$/gm)];
  const validRows = rows.length === 11 && rows.every((row, i) => row[1] === TICKERS[i]);
  const ready = searched && editorStart >= 0 && readerStart > editorStart && validRows
    && /^Review state:\s*READY FOR EDITOR REVIEW\s*$/m.test(editorReview);
  return { editorReview, readerEdition, reviewState: ready ? 'READY FOR EDITOR REVIEW' : 'NEEDS REVIEW' };
}

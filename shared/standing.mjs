export const NO_EVIDENCE = 'no clear evidence in the last 30 days';
export function publication(html) {
  const dates = [];
  for (const match of html.matchAll(/"datePublished"\s*:\s*"([^"]+)"/g)) dates.push(match[1]);
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (/\b(?:property|name)\s*=\s*["'](?:article:published_time|datePublished|pubdate|publish-date)["']/i.test(tag)) {
      const value = tag.match(/\bcontent\s*=\s*["']([^"']+)/i)?.[1]; if (value) dates.push(value);
    }
  }
  const days = [...new Set(dates.filter(x => /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(x)).map(x => x.slice(0,10)))];
  return days.length === 1 && Number.isFinite(Date.parse(days[0])) ? days[0] : null;
}
export function withinWindow(date, start, end) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= start && date <= end;
}
export function validateStanding(data, assumptions, sources) {
  if (!data || typeof data.takeaway !== 'string' || data.takeaway.length > 500 || data.assumptions?.length !== 3) throw Error('Invalid evidence result.');
  const known = new Map(sources.map(s => [s.url, s]));
  const rows = data.assumptions.map((row, i) => {
    if (!['STRENGTHENING','INTACT','WATCH','WEAKENING','No new evidence'].includes(row.status) || !['soft','hard'].includes(row.signalStrength) || typeof row.reason !== 'string' || row.reason.length > 500 || !Array.isArray(row.sourceUrls) || row.sourceUrls.length > 2) throw Error('Invalid assumption result.');
    const selected = [...new Set(row.sourceUrls)].map(url => { if (!known.has(url)) throw Error('Source was not verified.'); return known.get(url); });
    if (selected.length && row.status === 'No new evidence') throw Error('No new evidence cannot cite sources.');
    return { assumption: assumptions[i], status: selected.length ? row.status : 'No new evidence', signalStrength: selected.length ? row.signalStrength : 'soft', reason: selected.length ? row.reason : NO_EVIDENCE, sources: selected };
  });
  const takeaway = rows.every(r => !r.sources.length) ? 'There is no clear evidence in the last 30 days to judge whether this thesis still holds.' : data.takeaway;
  if (/\b(buy|sell|hold|recommend\w*)\b/i.test([takeaway,...rows.map(r=>r.reason)].join(' '))) throw Error('Unacceptable recommendation wording.');
  return { takeaway, assumptions: rows };
}

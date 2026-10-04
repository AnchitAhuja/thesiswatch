import { groups, portfolio, weeklyAssessments } from './portfolio.js';

const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const id = (group) => group.toLowerCase().replaceAll(' ', '-');
const statuses = ['STRENGTHENING', 'INTACT', 'WATCH', 'WEAKENING'];
export const currentEdition = { date: 'Oct 4, 2026', assessments: weeklyAssessments };

export function rowsMarkup(edition) {
  return groups.map(group => `<section id="${id(group)}" aria-labelledby="heading-${id(group)}">
    <h2 id="heading-${id(group)}">${group}</h2>
    <div class="positions">${portfolio.filter(position => position.group === group).sort((a, b) => a.ticker.localeCompare(b.ticker)).map(position => {
      const assessment = edition?.assessments[position.ticker];
      if (edition && (!assessment || !statuses.includes(assessment.status))) throw new Error(`Missing valid assessment for ${position.ticker}`);
      if (assessment && new URL(assessment.source).protocol !== 'https:') throw new Error(`Invalid source for ${position.ticker}`);
      return `<article aria-labelledby="position-${position.ticker}">
        <div class="identity"><p>${escape(position.name || 'ETF')}</p><h3 id="position-${position.ticker}">${position.ticker}</h3></div>
        <div class="thesis"><p>${escape(position.thesis)}</p></div>
        ${assessment ? `<div class="assessment"><p>${escape(assessment.reason)}</p><a href="${escape(assessment.source)}" target="_blank" rel="noopener noreferrer" aria-label="Go deeper into ${position.ticker} (opens in a new tab)">Go deeper</a><span class="status ${assessment.status.toLowerCase()}">${assessment.status}<span class="status-dot" aria-hidden="true"></span></span></div>` : ''}
      </article>`;
    }).join('')}</div></section>`).join('');
}

export function loadingMarkup() {
  return `<div class="loading" role="status" aria-label="Loading positions" aria-busy="true">${groups.map(group => `<section><h2>${group}</h2><div class="positions">${portfolio.filter(position => position.group === group).map(() => '<div class="skeleton-row" aria-hidden="true"><div></div><div></div><div></div></div>').join('')}</div></section>`).join('')}</div>`;
}

export async function bindEdition(root, loadEdition = async () => currentEdition, storage = null) {
  const rows = root.querySelector('#positions');
  const date = root.querySelector('#edition-date');
  const note = root.querySelector('#edition-note');
  let cached = null;
  let returning = false;
  try { returning = storage?.getItem('thesis-visited') === 'yes'; cached = JSON.parse(storage?.getItem('thesis-latest') || 'null'); } catch {}
  async function refresh() {
    rows.innerHTML = loadingMarkup();
    try {
      const latest = await loadEdition();
      const edition = latest || (returning ? cached : null);
      rows.innerHTML = rowsMarkup(edition);
      date.textContent = edition ? `Edition dated ${edition.date}` : '';
      date.hidden = !edition;
      note.textContent = returning && edition ? 'The next edition lands Saturday 10 AM IST.' : '';
      try { storage?.setItem('thesis-visited', 'yes'); if (edition) storage?.setItem('thesis-latest', JSON.stringify(edition)); } catch {}
    } catch {
      rows.innerHTML = '<div class="rows-error" role="alert"><p>Rows failed to load.</p><button type="button" id="refresh-rows">Refresh</button></div>';
      rows.querySelector('button').addEventListener('click', refresh);
    }
  }
  await refresh();
}

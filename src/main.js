import { groups, portfolio, weeklyAssessments } from './portfolio.js';
import './style.css';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { trackingMarkup, bindTracking } from './tracking.mjs';

const escape = (text) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const id = (group) => group.toLowerCase().replaceAll(' ', '-');
const statuses = ['STRENGTHENING', 'INTACT', 'WATCH', 'WEAKENING'];

document.querySelector('#app').innerHTML = `
  <header class="intro">
    <h1>AI thesis</h1>
    <p class="lead">The positions this thesis rests on.</p>
    <p>Energy, chips, AI platforms and AI adopters — the thesis behind each position, the drivers to follow, and this week’s assessment.</p>
    <div class="edition"><h2>Portfolio Status · Oct 4, 2026</h2><p>Status set manually, 4 Oct</p></div>
  </header>
  <nav aria-label="Thesis areas">${groups.map((group) => `<a href="#${id(group)}">${group}</a>`).join('')}</nav>
  <aside class="legend" aria-label="Status key">${statuses.map((status) => `<span class="status ${status.toLowerCase()}">${status}</span>`).join('')}</aside>
  <div id="positions">${groups.map((group) => `
    <section id="${id(group)}" aria-labelledby="heading-${id(group)}">
      <h2 id="heading-${id(group)}">${group}</h2>
      <div class="positions">${portfolio.filter((position) => position.group === group).map((position) => {
        const assessment = weeklyAssessments[position.ticker];
        if (!assessment || !statuses.includes(assessment.status)) throw new Error(`Missing valid assessment for ${position.ticker}`);
        const source = new URL(assessment.source);
        if (source.protocol !== 'https:') throw new Error(`Invalid source for ${position.ticker}`);
        return `<article aria-labelledby="position-${position.ticker}">
          <div class="identity"><h3 id="position-${position.ticker}">${position.ticker}</h3><p>${position.name ? escape(position.name) : 'ETF'}</p>${position.name ? '<span class="type">Stock</span>' : ''}</div>
          <div class="thesis"><h4>Thesis</h4><p>${escape(position.thesis)}</p><h4>Drivers to follow</h4><ul>${position.drivers.map((driver) => `<li>${escape(driver)}</li>`).join('')}</ul></div>
          <div class="assessment"><span class="status ${assessment.status.toLowerCase()}">${assessment.status}</span><h4>Signal this week</h4><p>${escape(assessment.reason)}</p><a href="${escape(assessment.source)}" target="_blank" rel="noopener noreferrer" aria-label="Read ${position.ticker} source at ${escape(source.hostname)} (opens in new tab)">Read source <span>${escape(source.hostname.replace(/^www\./, ''))}</span></a></div>
        </article>`;
      }).join('')}</div>
    </section>`).join('')}</div>
  <footer>Weekly assessments supplied by the founder. Source links open in a new tab.</footer>
  ${trackingMarkup}
`;

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;
bindTracking(document.querySelector('#app'), async (email) => {
  if (!convex) throw new Error('Convex URL is not configured');
  await convex.mutation(api.tracking.save, { email });
});

import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './style.css';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { trackingMarkup, bindTracking } from './tracking.mjs';
import { bindEdition } from './edition.mjs';
import { groups, portfolio, weeklyAssessments } from './portfolio.js';
import { bindCustomThesis } from './thesis.mjs';

const app = document.querySelector('#app');
const isThesis = new URLSearchParams(window.location.search).get('thesis') === 'ai';
const skip = document.querySelector('.skip');
if (new URLSearchParams(window.location.search).get('create') === 'thesis') {
  document.title = 'Your thesis · Lookout';
  skip.href = '#app'; skip.textContent = 'Skip to your thesis';
  void bindCustomThesis(app);
} else if (!isThesis) {
  const ordered = groups.flatMap(group => portfolio.filter(position => position.group === group).sort((a, b) => a.ticker.localeCompare(b.ticker)));
  const preview = [...new Set(ordered.map(position => weeklyAssessments[position.ticker].status))].slice(0, 3).map(status => ordered.find(position => weeklyAssessments[position.ticker].status === status));
  document.title = 'Lookout';
  skip.href = '#theses';
  skip.textContent = 'Skip to theses';
  app.innerHTML = `
    <div class="landing-page">
      <header class="product-header"><span class="product-name">Lookout</span></header>
      <div class="landing-intro"><h1>Stay on top of your investment thesis without drowning in 50 tabs</h1><p class="lead">Every Saturday, get an email on the AI thesis, stock by stock. 5 minutes is all it takes.</p></div>
      <div class="thesis-choices" id="theses">
        <a class="ai-thesis-card" href="/?thesis=ai" aria-labelledby="ai-card-title">
          <h2 id="ai-card-title">AI thesis</h2>
          <div class="card-chain" aria-label="Energy to Chips to AI Platforms to AI Adopters">
            <span>Energy</span><span>Chips</span><span>AI Platforms</span><span>AI Adopters</span>
          </div>
          <div class="position-preview">${preview.map(position => {
            const assessment = weeklyAssessments[position.ticker];
            return `<div class="preview-row"><span class="preview-ticker">${position.ticker}</span><span class="status ${assessment.status.toLowerCase()}">${assessment.status}<span class="status-dot" aria-hidden="true"></span></span></div>`;
          }).join('')}</div>
          <p class="preview-more">and ${portfolio.length - preview.length} more</p>
          <span class="card-action">Open the AI thesis</span>
        </a>
        <section class="coming-soon-card" aria-labelledby="create-card-title">
          <h2 id="create-card-title">Create your own thesis</h2>
          <a class="create-thesis-link" href="/?create=thesis">Start with your belief</a>
        </section>
      </div>
    </div>`;
} else {
  document.title = 'AI thesis · Lookout';
  app.innerHTML = `
    <header class="product-header"><a class="product-name" href="/">Lookout</a></header>
    <header class="intro">
      <h1>Stay on top of your investment thesis without drowning in 50 tabs</h1>
      <p class="lead">Every Saturday, get an email on the AI thesis, stock by stock. 5 minutes is all it takes.</p>
      <div class="edition"><p id="edition-date"></p><p id="edition-note"></p></div>
    </header>
    <div class="thesis-page">
      <div class="page-content">
        <nav aria-label="Thesis chain"><a href="#energy">Energy</a><span aria-hidden="true">→</span><a href="#chips">Chips</a><span aria-hidden="true">→</span><a href="#ai-platforms">AI Platforms</a><span aria-hidden="true">→</span><a href="#ai-adopters">AI Adopters</a></nav>
        <div id="positions"></div>
        <footer><a class="contact" href="mailto:anchitgh71@gmail.com">Reach out to Anchit</a></footer>
      </div>
      ${trackingMarkup}
    </div>`;
  let storage = null;
  try { storage = window.localStorage; } catch {}
  void bindEdition(app, undefined, storage);
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;
  bindTracking(app, async email => {
    if (!convex) throw new Error('Convex URL is not configured');
    await convex.mutation(api.tracking.save, { email });
  });
}

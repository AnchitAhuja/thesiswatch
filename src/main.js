import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './style.css';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { trackingMarkup, bindTracking } from './tracking.mjs';
import { bindEdition } from './edition.mjs';
import { bindLanding } from './landing.mjs';
import { bindCustomThesis } from './thesis.mjs';
import { bindPrebuiltThesis } from './prebuilt-thesis.mjs';

const app = document.querySelector('#app');
const isThesis = new URLSearchParams(window.location.search).get('thesis') === 'ai';
const skip = document.querySelector('.skip');
window.addEventListener('popstate', () => window.location.reload());
if (new URLSearchParams(window.location.search).get('create') === 'thesis') {
  document.title = 'Your thesis · Lookout';
  skip.href = '#app'; skip.textContent = 'Skip to your thesis';
  void bindCustomThesis(app);
} else if (new URLSearchParams(window.location.search).get('thesis') === 'ai-infrastructure') {
  document.title = 'AI Infrastructure · Lookout';
  skip.href = '#app'; skip.textContent = 'Skip to the thesis';
  void bindPrebuiltThesis(app);
} else if (!isThesis) {
  document.title = 'Lookout';
  skip.href = '#capture-box';
  skip.textContent = 'Skip to your investment belief';
  bindLanding(app);
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

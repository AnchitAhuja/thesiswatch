import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './style.css';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { trackingMarkup, bindTracking } from './tracking.mjs';
import { bindEdition } from './edition.mjs';

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="thesis-page">
    <div class="page-content">
      <header class="intro">
        <h1>Stay on top of your investment thesis without drowning in 50 tabs</h1>
        <p class="lead">Every Saturday, get an email on the AI thesis, stock by stock. 5 minutes is all it takes.</p>
        <div class="edition"><p id="edition-date"></p><p id="edition-note"></p></div>
      </header>
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

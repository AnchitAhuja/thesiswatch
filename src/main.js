import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './style.css';

// The same upload-first home is served by DEV and production.
document.title = 'Portfolio health card · Lookout';
const skip = document.querySelector('.skip');
skip.href = '#ph-report'; skip.textContent = 'Skip to portfolio facts';
const [{bindPortfolioHealth}] = await Promise.all([import('./portfolio-health.mjs'), import('./portfolio-health.css')]);
bindPortfolioHealth(document.querySelector('#app'));

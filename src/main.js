import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './style.css';

// Keep the upload-first experience and its code exclusive to DEV.
if (import.meta.env.VITE_CONVEX_URL === 'https://fearless-ferret-257.convex.cloud') {
  document.title = 'Portfolio health card · Lookout';
  const skip = document.querySelector('.skip');
  skip.href = '#ph-report'; skip.textContent = 'Skip to portfolio facts';
  const [{bindPortfolioHealth}] = await Promise.all([import('./portfolio-health.mjs'), import('./portfolio-health.css')]);
  bindPortfolioHealth(document.querySelector('#app'));
} else {
  await import('./production-main.js');
}

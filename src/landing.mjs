import { captureComposerMarkup } from './ui-fragments.mjs';
import { bindCustomThesis } from './thesis.mjs';
import { howItWorksMarkup, animateHowItWorks } from './how-it-works.mjs';

export function bindLanding(root) {
  document.body.classList.add('lookout-dark');
  document.body.classList.add('lookout-photo');
  root.innerHTML = `<div class="dark-landing">
    <div class="photo-hero">
    <img class="family-photo" src="/hero-family.webp" alt="A family enjoying time together at home" fetchpriority="high" width="1021" height="614">
    <header class="dark-header"><a class="dark-brand" href="/">LOOKOUT<span>By Vantage</span></a><a class="build-idea" href="#capture-box">Build my idea</a></header>
    <div class="dark-hero">
      <div class="dark-hero-left"><h1>Invest.<span>Then move on with your life.</span></h1>
        <p class="dark-intro">Add your investment ideas. Lookout tracks the evidence behind each belief and flags what changes, so you know when to revisit your reasoning.</p>
        <div class="landing-capture" id="capture-box">
          ${captureComposerMarkup()}
          <div class="landing-prebuilt"><a class="landing-thesis-pill" href="/?thesis=ai-infrastructure">AI Infrastructure</a></div>
          <button class="landing-ask" type="button">I can't put it into words, ask me</button>
        </div>
      </div>
    </div>
    </div>
    ${howItWorksMarkup}
    <footer class="dark-footer"><p>Your life is bigger<br>than your portfolio.</p><a class="build-idea" href="#capture-box">Build my idea</a></footer>
  </div>`;
  animateHowItWorks(root);
  const input = root.querySelector('#landing-belief');
  root.querySelectorAll('.build-idea').forEach(link => link.addEventListener('click', event => { event.preventDefault(); input.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); input.focus({ preventScroll: true }); }));
  const start = entry => {
    document.body.classList.remove('lookout-dark');
    document.body.classList.remove('lookout-photo');
    history.pushState(null, '', '/?create=thesis');
    document.title = 'Your thesis · Lookout';
    const skip = document.querySelector('.skip');
    skip.href = '#app'; skip.textContent = 'Skip to your thesis';
    void bindCustomThesis(root, entry);
  };
  root.querySelector('form').addEventListener('submit', event => { event.preventDefault(); if (input.value.trim()) start({ original: input.value, guided: false }); });
  root.querySelector('.landing-ask').onclick = () => start({ original: '', guided: true });
}

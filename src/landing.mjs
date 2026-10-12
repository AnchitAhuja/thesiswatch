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
  if(import.meta.env.VITE_CONVEX_URL === 'https://fearless-ferret-257.convex.cloud') {
    const target='/?create=holdings';
    root.querySelector('.dark-brand').textContent='Lookout';
    root.querySelector('h1').innerHTML='Invest. <span>Then move on with your life.</span>';
    root.querySelector('.dark-intro').textContent="You don't need to follow every headline to stay on top of your investments. Lookout watches the reasons behind your decisions and lets you know when they're worth revisiting.";
    const how=root.querySelector('.how-it-works');
    how.id='how-it-works';
    how.innerHTML=`<header class="how-header"><h2 id="how-heading">How It Works</h2></header><ol class="how-steps"><li class="how-step"><h3><span class="step-number">1</span>Pick a stock you hold</h3><p>Choose from our saved Nifty 500 and US stock lists.</p></li><li class="how-step"><h3><span class="step-number">2</span>Write why you hold it in your own words</h3><p>Lookout checks your reasons against recent evidence.</p></li><li class="how-step"><h3><span class="step-number">3</span>Get a Saturday email when a reason is worth revisiting</h3><p>Save your email after checking your reasons.</p></li></ol>`;
    root.querySelectorAll('.build-idea').forEach(link=>{link.href=target;link.textContent='My holdings';});
    const howLink=root.querySelector('.dark-header .build-idea');
    howLink.textContent='How It Works';howLink.href='#how-it-works';
    howLink.addEventListener('click',event=>{event.preventDefault();history.replaceState(null,'','#how-it-works');how.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
    root.querySelector('.landing-ask').hidden=true;
    root.querySelector('.landing-prebuilt').hidden=true;
    input.hidden=true;input.required=false;
    const form=root.querySelector('.landing-capture form');
    const button=form.querySelector('button');button.textContent='Get started';
    form.action=target;
    form.addEventListener('submit',event=>{event.preventDefault();window.location.assign(target);});
    return;
  }
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

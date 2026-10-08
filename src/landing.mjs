import { bindCustomThesis, thesisStarters } from './thesis.mjs';
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export function bindLanding(root) {
  document.body.classList.add('lookout-dark');
  document.body.classList.add('lookout-photo');
  root.innerHTML = `<div class="dark-landing">
    <div class="photo-hero">
    <img class="family-photo" src="/hero-family.webp" alt="A family enjoying time together at home" fetchpriority="high" width="1021" height="614">
    <header class="dark-header"><a class="dark-brand" href="/">LOOKOUT<span>VANTAGE / A CLEARER VIEW</span></a><a class="build-idea" href="#capture-box">Build my idea</a></header>
    <div class="dark-hero">
      <div class="dark-hero-left"><h1>Invest.<span>Then move on with your life.</span></h1>
        <p class="dark-intro">Put your belief into words, connect your investments, and save your reasoning.</p>
        <div class="landing-capture" id="capture-box">
          <form class="landing-composer"><label class="visually-hidden" for="landing-belief">Your investment belief</label><input id="landing-belief" type="text" maxlength="3000" required placeholder="What's your investment idea?"><button type="submit">Build</button></form>
          <div class="landing-starters" aria-label="Ideas to start from">${thesisStarters.map(x => `<button type="button">${esc(x)}</button>`).join('')}</div>
          <button class="landing-ask" type="button">I can't put it into words, ask me</button>
        </div>
      </div>
    </div>
    </div>
      <aside class="journal-example" aria-labelledby="journal-title"><div class="journal-meta"><span id="journal-title">The Conviction Journal</span><span>Demo / MSFT</span></div>
        <blockquote>“AI will make Microsoft's cloud business more valuable over time.”</blockquote>
        <dl><div><dt>Belief</dt><dd>Cloud demand grows</dd></div><div><dt>Evidence</dt><dd>Azure revenue +29% YoY</dd></div></dl>
        <h2>A signal, not a conclusion.</h2><p>FY24 Q4 cloud growth supports demand. One quarter alone cannot establish the long-term returns from AI investment.</p>
        <a href="https://www.microsoft.com/en-us/Investor/earnings/FY-2024-Q4/press-release-webcast" target="_blank" rel="noopener noreferrer">Read Microsoft's release · July 30, 2024</a><p class="journal-caption">Historical evidence. Illustrative interpretation.</p>
      </aside>
    <div class="dark-principles"><div><p>Write it down</p><h2>Make conviction explicit.</h2><span>A belief is easier to revisit when you know what it rests on.</span></div><div><p>Follow the thread</p><h2>Evidence over headlines.</h2><span>See the source, the context and the connection to your reasoning.</span></div><div><p>Keep perspective</p><h2>Leave room to change your mind.</h2><span>Look for the evidence that challenges your story, too.</span></div></div>
    <footer class="dark-footer"><p>Your life is bigger<br>than your portfolio.</p><a class="build-idea" href="#capture-box">Build my idea</a></footer>
    <a class="shared-thesis-link" href="/?thesis=ai">Explore the AI thesis</a>
  </div>`;
  const input = root.querySelector('#landing-belief');
  root.querySelectorAll('.landing-starters button').forEach(button => button.onclick = () => { input.value = button.textContent; input.focus(); });
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

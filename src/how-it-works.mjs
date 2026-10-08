const belief = "I think people in India will spend more as they earn more. Shops seem busier, but I don't know which news actually matters to that idea.";
const escape = text => text.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let character = 0;
const typed = belief.split(' ').map(word => `<span class="typed-word">${[...word].map(c => `<span style="--character:${character++}">${escape(c)}</span>`).join('')}</span><span style="--character:${character++}"> </span>`).join('');
const reflection = "You're betting that rising incomes will lead Indian households to spend more, helping retailers grow.";
const reflectedWords = reflection.split(' ').map((word, i) => `<span style="--word:${i}">${escape(word)}</span>`).join(' ');
export const howItWorksMarkup = `<section class="how-it-works" aria-labelledby="how-heading">
  <header class="how-header"><h2 id="how-heading">How it works</h2><span class="example-label">Example</span></header>
  <ol class="how-steps">
    <li class="how-step"><h3><span class="step-number">1</span>Start with your belief</h3><div class="how-example belief-example"><p class="typed-belief" aria-label="${escape(belief)}"><span aria-hidden="true">${typed}</span></p></div></li>
    <li class="how-step"><h3><span class="step-number">2</span>Make your reasoning clear</h3><div class="how-example reflection-example"><p aria-label="${escape(reflection)}"><span aria-hidden="true">${reflectedWords}</span></p></div></li>
    <li class="how-step"><h3><span class="step-number">3</span>Know what to revisit</h3><div class="how-example saturday-example"><div class="example-update-header"><span>Saturday update</span><span class="status intact">INTACT</span></div><p>Reliance reports grocery growth driven by store expansion and deliveries; that alone doesn't prove incomes are rising.</p><a href="https://www.ril.com/ar2024-25/retail.html" target="_blank" rel="noopener noreferrer">Source: Reliance annual report, FY 2024–25</a></div></li>
  </ol>
  <p class="how-caption">Illustrative assessment using historical evidence. Custom weekly monitoring isn't active yet.</p>
  <a class="build-idea" href="#capture-box">Build my idea</a>
</section>`;

export function animateHowItWorks(root) {
  const section = root.querySelector('.how-it-works');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window)) return;
  section.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      section.classList.add('has-played');
      observer.disconnect();
    }
  }, { threshold: 0.18 });
  observer.observe(section);
  preference.addEventListener('change', event => {
    if (event.matches) { section.classList.remove('motion-ready'); observer.disconnect(); }
  }, { once: true });
}

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export async function bindCustomThesis(root) {
  const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
  let token = window.location.hash.startsWith('#private=') ? window.location.hash.slice(9) : null;
  let record = null;
  const shell = body => {
    root.innerHTML = `<div class="capture-page"><header class="product-header"><a class="product-name" href="/">Lookout</a><a href="/?thesis=ai">Explore the AI thesis</a></header><div class="capture-body">${body}</div></div>`;
    window.scrollTo(0, 0);
    const heading = root.querySelector('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  };
  const error = message => { const box = root.querySelector('[role="alert"]'); if (box) { box.textContent = message; box.hidden = false; } };
  const details = result => `<details class="thesis-details"><summary>Look closer at the reasoning</summary>${[
    ['Your stated reasons', result.statedReasons], ['Assumptions suggested by Lookout', result.inferredAssumptions],
    ['Claims not yet verified', result.unverifiedClaims], ['Risks and uncertainties', result.risks],
    ['Evidence that could strengthen it', result.strengtheningEvidence], ['Evidence that could weaken it', result.weakeningEvidence],
  ].map(([title, entries]) => `<div><h3>${title}</h3>${entries.length ? `<ul>${entries.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>None identified in your statement.</p>'}</div>`).join('')}</details>`;
  function capture() {
    shell(`<h1>What's an investment belief you want to keep an eye on?</h1><p class="capture-lead">Tell us what you believe and why, in your own words. You don't need to have it all figured out.</p>
      <form id="belief-form"><label for="belief">Your belief and why</label><textarea id="belief" maxlength="3000" required placeholder="I think AI infrastructure will continue growing because companies are spending billions on AI…"></textarea>
      <label for="investments">Investments connected to it <span>(optional)</span></label><input id="investments" maxlength="504" placeholder="Nvidia, Microsoft, or an ETF"><p class="field-note">You can start with one holding. Add up to five, separated by commas.</p>
      <p role="alert" hidden></p><button type="submit">Help me put it into words</button><p class="field-note">Your words stay yours. You'll review the interpretation before saving.</p></form>`);
    root.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const original = root.querySelector('#belief').value;
      const investments = root.querySelector('#investments').value.split(',').map(x => x.trim()).filter(Boolean);
      if (!original.trim()) return error('Tell us what you believe first.');
      if (investments.length > 5 || investments.some(x => x.length > 100)) return error('Add up to five investments, with each name under 100 characters.');
      const button = root.querySelector('button'); button.disabled = true; button.textContent = 'Putting your belief into words…';
      root.querySelector('form').setAttribute('aria-busy', 'true');
      try {
        const response = await client.action(api.thesisActions.interpret, { original, investments });
        token = response.token; record = { original, investments, interpretation: response.result, state: 'draft' };
        history.replaceState(null, '', `/?create=thesis#private=${token}`);
        reflection();
      } catch (e) { error(e.message.includes('ten thesis') ? 'The first ten thesis places are filled. Please reach out to Anchit.' : "We couldn't interpret your belief. Your words are still here. Please try again.");
        button.disabled = false; button.textContent = 'Help me put it into words'; root.querySelector('form').removeAttribute('aria-busy'); }
    });
  }
  function reflection(edit = false) {
    const result = record.interpretation;
    const text = record.confirmedReflection || result.reflection;
    shell(`<h1>Here's what I think you're betting on.</h1><div class="reflection-paper">${edit ? `<label for="reflection">Put it in your words</label><textarea id="reflection" maxlength="2000">${esc(text)}</textarea>` : `<p class="reflection-text">${esc(text)}</p>`}
      ${record.investments.length ? `<p class="linked-investments">Connected investments: ${record.investments.map(esc).join(', ')}</p>` : ''}</div>
      <p class="capture-question">Does that sound right?</p><div class="capture-actions"><button id="confirm">${edit ? 'Save these words' : 'Yes, save my thesis'}</button>${edit ? '' : '<button class="secondary-action" id="edit">Edit the interpretation</button>'}</div><p role="alert" hidden></p>
      ${details(result)}<details class="original-statement"><summary>Your original words</summary><p>${esc(record.original)}</p></details>`);
    root.querySelector('#edit')?.addEventListener('click', () => reflection(true));
    root.querySelector('#confirm').addEventListener('click', async () => {
      const text = edit ? root.querySelector('#reflection').value : (record.confirmedReflection || result.reflection);
      if (!text.trim()) return error('Keep a few words describing your belief.');
      const button = root.querySelector('#confirm'); button.disabled = true; button.textContent = 'Saving…';
      try { await client.mutation(api.theses.confirm, { token, reflection: text }); record.confirmedReflection = text.trim(); record.state = 'saved'; saved(); }
      catch { error("We couldn't save your thesis. Please try again."); button.disabled = false; button.textContent = 'Save my thesis'; }
    });
  }
  function saved() {
    shell(`<h1>Your thesis, in your words.</h1><p class="capture-lead" role="status">Saved privately.</p><div class="reflection-paper"><p class="reflection-text">${esc(record.confirmedReflection)}</p>${record.investments.length ? `<p class="linked-investments">Connected investments: ${record.investments.map(esc).join(', ')}</p>` : ''}</div>
      <div class="private-link-box"><h2>Keep your private link</h2><p>Bookmark this page to return. Anyone with this link can view and edit your thesis. Keep it private.</p><button id="copy-link">Copy private link</button><p id="copy-note" role="status"></p></div>
      <p class="monitoring-note">Weekly monitoring isn't active for this thesis yet.</p><button class="secondary-action" id="edit-saved">Edit my words</button>
      ${details(record.interpretation)}<details class="original-statement"><summary>Your original words</summary><p>${esc(record.original)}</p></details>`);
    root.querySelector('#edit-saved').addEventListener('click', () => reflection(true));
    root.querySelector('#copy-link').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(window.location.href); root.querySelector('#copy-note').textContent = 'Private link copied.'; }
      catch { root.querySelector('#copy-note').textContent = 'Copy the address from your browser to keep your link.'; }
    });
  }
  if (!token) return capture();
  shell('<p role="status">Opening your private thesis…</p>');
  try { record = await client.query(api.theses.read, { token });
    if (!record?.interpretation) throw new Error('Missing thesis');
    record.state === 'saved' ? saved() : reflection();
  } catch { shell('<h1>This private link could not be opened.</h1><p class="capture-lead">Check that you copied the complete link, or try again.</p><button id="retry">Try again</button>'); root.querySelector('#retry').onclick = () => bindCustomThesis(root); }
}

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
  const starters = ["AI's bottleneck is power, not chips", 'GLP-1s reshape food and healthcare', 'A weaker dollar: I want real assets', 'Nuclear answers baseload demand', 'US reshoring is an industrial boom', 'Aging drives a healthcare bull market'];
  function capture() {
    shell(`<h1>What do you believe?</h1><p class="capture-lead">Describe an investment idea in plain language. I'll ask a couple of questions, then help you put your thesis into words.</p>
      <form id="belief-form" class="chat-composer"><label class="visually-hidden" for="belief">Your belief and why</label><textarea id="belief" rows="2" maxlength="3000" required placeholder="AI's real bottleneck is power and grid equipment&#8230;"></textarea><button type="submit">Send</button></form>
      <p role="alert" hidden></p><div class="starter-chips" aria-label="Ideas to start from">${starters.map(x => `<button type="button" class="starter-chip">${esc(x)}</button>`).join('')}</div>
      <button type="button" class="ask-me">I can't put it into words, ask me</button>`);
    root.querySelectorAll('.starter-chip').forEach(button => button.onclick = () => { root.querySelector('#belief').value = button.textContent; root.querySelector('#belief').focus(); });
    root.querySelector('.ask-me').onclick = () => questions('', [], true);
    root.querySelector('form').addEventListener('submit', event => { event.preventDefault(); const original = root.querySelector('#belief').value; if (!original.trim()) return error('Tell us what you believe first.'); questions(original, [], false); });
  }
  function questions(original, answers, guided) {
    const question = guided && !original ? "What's one company, industry or change you're interested in?" : !answers.length ? 'Why does that interest you, or why do you believe it?' : 'What would make you rethink that belief?';
    shell(`<h1>${question}</h1>${original ? `<p class="conversation-context">${esc(original)}</p>` : '<p class="capture-lead">Start with something you have noticed. A few words are enough.</p>'}
      <form class="chat-composer"><label class="visually-hidden" for="answer">Your answer</label><textarea id="answer" rows="2" maxlength="1500" required placeholder="In your own words&#8230;"></textarea><button type="submit">Send</button></form><p role="alert" hidden></p><p class="field-note">${!original ? 'We can work out the belief together.' : 'A short answer is enough. Saying you are not sure yet is fine.'}</p>`);
    root.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault(); const answer = root.querySelector('#answer').value; if (!answer.trim()) return error('Add a few words to continue.');
      if (!original) return questions(answer, [], true);
      const next = [...answers, answer];
      // The guided route asks two questions in total; a stated belief gets two clarifications.
      if (next.length < (guided ? 1 : 2)) return questions(original, next, guided);
      const button = root.querySelector('form button'); button.disabled = true; button.textContent = 'Thinking…';
      try {
        const response = await client.action(api.thesisActions.interpret, { original, investments: [], clarifications: next });
        token = response.token; record = { original, investments: [], clarifications: next, interpretation: response.result, state: 'draft' };
        history.replaceState(null, '', `/?create=thesis#private=${token}`); reflection();
      } catch (e) { error(e.message.includes('ten thesis') ? 'The first ten thesis places are filled. Please reach out to Anchit.' : "We couldn't interpret your belief. Your answers are still here. Please try again."); button.disabled = false; button.textContent = 'Send'; }
    });
  }
  function reflection(edit = false) {
    const result = record.interpretation;
    const text = record.confirmedReflection || result.reflection;
    shell(`<h1>Here's what I think you're betting on.</h1><div class="reflection-paper">${edit ? `<label for="reflection">Put it in your words</label><textarea id="reflection" maxlength="2000">${esc(text)}</textarea>` : `<p class="reflection-text">${esc(text)}</p>`}
      ${record.investments.length ? `<p class="linked-investments">Connected investments: ${record.investments.map(esc).join(', ')}</p>` : ''}</div>
      <label for="investments">Investments connected to it <span>(optional)</span></label><input id="investments" maxlength="504" value="${esc(record.investments.join(', '))}" placeholder="Nvidia, Microsoft, or an ETF"><p class="field-note">Add up to five, separated by commas. You can leave this blank.</p><p class="capture-question">Does that sound right?</p><div class="capture-actions"><button id="confirm">${edit ? 'Save these words' : 'Yes, save my thesis'}</button>${edit ? '' : '<button class="secondary-action" id="edit">Edit the interpretation</button>'}</div><p role="alert" hidden></p>
      ${details(result)}<details class="original-statement"><summary>Your original words</summary><p>${esc(record.original)}</p></details>`);
    root.querySelector('#edit')?.addEventListener('click', () => { record.investments = root.querySelector('#investments').value.split(',').map(x => x.trim()).filter(Boolean); reflection(true); });
    root.querySelector('#confirm').addEventListener('click', async () => {
      const text = edit ? root.querySelector('#reflection').value : (record.confirmedReflection || result.reflection);
      if (!text.trim()) return error('Keep a few words describing your belief.');
      const investments = root.querySelector('#investments').value.split(',').map(x => x.trim()).filter(Boolean);
      if (investments.length > 5 || investments.some(x => x.length > 100)) return error('Add up to five investments, with each name under 100 characters.');
      const button = root.querySelector('#confirm'); button.disabled = true; button.textContent = 'Saving…';
      try { await client.mutation(api.theses.confirm, { token, reflection: text, investments }); record.investments = investments; record.confirmedReflection = text.trim(); record.state = 'saved'; saved(); }
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

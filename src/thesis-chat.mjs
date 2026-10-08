import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const questions = ['Why do you believe it?', 'What would prove you wrong?', 'Which companies or funds are connected to this idea?'];
const namesFrom = text => text.trim().toLowerCase() === 'none' ? [] : text.split(',').map(x => x.trim()).filter(Boolean);
const validNames = names => names.length <= 5 && names.every(x => x.length <= 100);

export async function bindThesisChat(root, entry = null) {
  const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
  let token = location.hash.startsWith('#private=') ? location.hash.slice(9) : null;
  let original = entry?.original?.trim() || '', answers = [], investments = [], record = null, busy = false, editing = false;
  const guided = !original && !token;
  document.body.classList.remove('lookout-photo');
  document.body.classList.add('lookout-dark', 'lookout-chat');
  root.innerHTML = `<div class="thesis-chat"><header class="chat-header"><a class="dark-brand" href="/">LOOKOUT<span>By Vantage</span></a><a href="/?thesis=ai">AI thesis</a></header><div class="chat-thread" role="log" aria-label="Your conversation with Lookout" aria-live="polite" aria-relevant="additions"></div><div class="chat-input-area"><form class="thread-composer"><label class="visually-hidden" for="chat-answer">Your answer</label><textarea id="chat-answer" rows="2" maxlength="1500" required placeholder="In your own words…"></textarea><button type="submit" aria-label="Send answer"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></form><p class="chat-note"></p><p class="chat-error" role="alert" hidden></p></div></div>`;
  const thread = root.querySelector('.chat-thread'), composer = root.querySelector('.thread-composer'), input = root.querySelector('#chat-answer'), note = root.querySelector('.chat-note'), errorBox = root.querySelector('.chat-error');
  const scroll = () => thread.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  const message = (role, text) => {
    const el = document.createElement('div'); el.className = `chat-message chat-${role}`;
    el.innerHTML = `${role === 'lookout' ? '<span class="chat-speaker">Lookout</span>' : '<span class="visually-hidden">You</span>'}<p>${esc(text)}</p>`;
    thread.append(el); scroll(); return el;
  };
  const error = text => { errorBox.textContent = text; errorBox.hidden = false; };
  const setBusy = value => { busy = value; input.disabled = value; composer.querySelector('button').disabled = value; };
  const ask = () => {
    message('lookout', original ? questions[answers.length] : 'What is the investment idea you want to put into words?');
    input.maxLength = !original ? 3000 : answers.length === 2 ? 504 : 1500;
    note.textContent = !guided && answers.length === 2 ? 'Up to five, separated by commas. Say “none” or skip if there are none.' : 'A short answer is enough. You can say you’re not sure.';
    root.querySelector('.chat-skip')?.remove();
    if (!guided && answers.length === 2) {
      const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'chat-skip'; skip.textContent = 'Skip';
      skip.onclick = () => submitAnswer('None'); root.querySelector('.chat-input-area').append(skip);
    }
    input.focus({ preventScroll: true });
  };
  const showCard = () => {
    root.querySelector('.thread-thesis')?.remove();
    const result = record.interpretation, text = record.confirmedReflection || result.reflection;
    const card = document.createElement('div'); card.className = 'chat-message chat-lookout thread-thesis';
    card.innerHTML = `<span class="chat-speaker">Lookout</span><div class="thread-thesis-paper"><h1>Your thesis</h1>${editing ? `<label for="chat-reflection">Your thesis in your words</label><textarea id="chat-reflection" rows="3" maxlength="2000">${esc(text)}</textarea>` : `<p class="thread-thesis-line">${esc(text)}</p>`}<h2>Three assumptions to check</h2><ol>${result.inferredAssumptions.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('')}</ol><h2>What to watch</h2><ul>${[...result.strengtheningEvidence.slice(0, 2), ...result.weakeningEvidence.slice(0, 2)].map(x => `<li>${esc(x)}</li>`).join('')}</ul>${result.unverifiedClaims.length ? `<details><summary>Claims to verify</summary><ul>${result.unverifiedClaims.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}${editing ? `<label for="chat-investments">Connected companies or funds (optional)</label><input id="chat-investments" maxlength="504" value="${esc(investments.join(', '))}"><p class="chat-card-note">Up to five, separated by commas.</p>` : investments.length ? `<p class="chat-card-note">Connected investments: ${investments.map(esc).join(', ')}</p>` : ''}<div class="thread-card-actions"><button class="chat-save">${record.state === 'saved' && !editing ? 'Saved' : 'Save'}</button><button class="chat-edit">${editing ? 'Cancel' : 'Edit'}</button></div><p class="chat-card-note">Assumptions are interpretations of your idea, not verified facts.</p>${record.state === 'saved' ? '<div class="thread-saved"><p role="status">Saved privately.</p><p>Bookmark your private link. Anyone with it can view and edit this thesis.</p><button class="chat-copy">Copy private link</button><p class="chat-copy-note" role="status"></p><p>Weekly monitoring isn’t active for this thesis yet.</p></div>' : ''}</div>`;
    thread.append(card); composer.hidden = true; root.querySelector('.chat-skip')?.remove(); note.textContent = '';
    const save = card.querySelector('.chat-save'); save.disabled = record.state === 'saved' && !editing;
    card.querySelector('.chat-edit').onclick = () => { editing = !editing; errorBox.hidden = true; showCard(); };
    card.querySelector('.chat-copy')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); card.querySelector('.chat-copy-note').textContent = 'Private link copied.'; }
      catch { card.querySelector('.chat-copy-note').textContent = 'Copy the address from your browser.'; }
    });
    save.onclick = async () => {
      if (busy) return;
      const text = editing ? card.querySelector('#chat-reflection').value : (record.confirmedReflection || result.reflection);
      const names = editing ? namesFrom(card.querySelector('#chat-investments').value) : investments;
      if (!text.trim()) return error('Keep a few words describing your thesis.');
      if (!validNames(names)) return error('Add up to five investments, each under 100 characters.');
      busy = true; save.disabled = true; save.textContent = 'Saving…'; errorBox.hidden = true; card.querySelector('.chat-edit').disabled = true;
      try {
        await client.mutation(api.theses.confirm, { token, reflection: text, investments: names });
        investments = names; record.investments = names; record.confirmedReflection = text.trim(); record.state = 'saved'; editing = false; busy = false; showCard();
      } catch { busy = false; save.disabled = false; save.textContent = 'Save'; card.querySelector('.chat-edit').disabled = false; error('Your thesis wasn’t saved. Your words are still here. Try Save again.'); }
    };
    scroll();
  };
  const interpret = async () => {
    if (busy || token) return;
    setBusy(true); root.querySelector('.chat-skip')?.remove();
    const pending = message('lookout', 'Putting your thesis into words…'); pending.setAttribute('role', 'status'); note.textContent = ''; errorBox.hidden = true;
    try {
      const response = await client.action(api.thesisActions.interpret, { original, investments, clarifications: answers.slice(0, 2) });
      token = response.token; record = { original, investments, clarifications: answers.slice(0, 2), interpretation: response.result, state: 'draft' };
      history.replaceState(null, '', `/?create=thesis#private=${token}`); pending.remove(); setBusy(false); showCard();
    } catch (e) {
      pending.querySelector('p').textContent = 'Your answers are still here.'; setBusy(false); composer.hidden = true;
      error(e.message.includes('ten thesis') ? 'The first ten thesis places are filled. Please reach out to Anchit.' : 'We couldn’t put your thesis into words. You can try again.');
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'chat-retry'; retry.textContent = 'Try again'; retry.onclick = () => { pending.remove(); void interpret(); }; pending.append(retry);
    }
  };
  const submitAnswer = text => {
    if (busy) return; errorBox.hidden = true;
    if (original && answers.length === 2) { const names = namesFrom(text); if (!validNames(names)) return error('Add up to five investments, each under 100 characters.'); investments = names; }
    message('you', text); input.value = '';
    if (!original) { original = text; ask(); return; }
    answers.push(text); if (answers.length < (guided ? 2 : 3)) ask(); else void interpret();
  };
  composer.addEventListener('submit', event => { event.preventDefault(); const text = input.value.trim(); if (text) submitAnswer(text); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); composer.requestSubmit(); } });
  window.scrollTo(0, 0);
  if (!token) { if (original) message('you', original); ask(); return; }
  composer.hidden = true; const pending = message('lookout', 'Opening your private thesis…');
  try {
    record = await client.query(api.theses.read, { token }); if (!record?.interpretation) throw Error('Missing thesis');
    original = record.original; investments = record.investments; answers = record.clarifications || [];
    pending.remove(); message('you', original); answers.forEach((answer, i) => { message('lookout', questions[i]); message('you', answer); });
    message('lookout', questions[2]); message('you', investments.length ? investments.join(', ') : 'None'); showCard();
  } catch {
    pending.querySelector('p').textContent = 'This private link could not be opened. Check the complete link or try again.';
    const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.onclick = () => bindThesisChat(root); pending.append(retry);
  }
}

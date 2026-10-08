import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const namesFrom = text => text.trim().toLowerCase() === 'none' ? [] : text.split(',').map(x => x.trim()).filter(Boolean);
const contextLabels = { belief: 'What you believe', why: 'Why you believe it', whatWouldProveItWrong: 'What would prove it wrong', timeHorizon: 'Time horizon' };
const validNames = names => names.length <= 5 && names.every(x => x.length <= 100);

export async function bindThesisChat(root, entry = null) {
  const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
  let token = location.hash.startsWith('#private=') ? location.hash.slice(9) : null;
  let started = Boolean(token);
  let original = entry?.original?.trim() || '', investments = [], record = null, busy = false, editing = false;
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
  const showCard = () => {
    root.querySelector('.thread-thesis')?.remove();
    const result = record.interpretation, text = record.confirmedReflection || result.reflection;
    const card = document.createElement('div'); card.className = 'chat-message chat-lookout thread-thesis';
    card.innerHTML = `<span class="chat-speaker">Lookout</span><div class="thread-thesis-paper"><h1>Your thesis</h1>${editing ? `<label for="chat-reflection">Your thesis in your words</label><textarea id="chat-reflection" rows="3" maxlength="2000">${esc(text)}</textarea>` : `<p class="thread-thesis-line">${esc(text)}</p>`}<h2>Three assumptions to check</h2><ol>${result.inferredAssumptions.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('')}</ol><h2>What to watch</h2><ul>${(record.thesis?.watchSignals || [...result.strengtheningEvidence.slice(0, 2), ...result.weakeningEvidence.slice(0, 2)]).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${result.unverifiedClaims.length ? `<details><summary>Claims to verify</summary><ul>${result.unverifiedClaims.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}${record.needsConfirmation && !editing ? `<p class="chat-card-note">Provisional: please add ${record.missingFields.map(key => contextLabels[key]).join(', ')} in Edit before saving.</p>` : ''}${editing && record.context ? Object.entries(contextLabels).map(([key, label]) => `<label for="context-${key}">${label}</label><input id="context-${key}" maxlength="300" value="${esc(record.context[key] || '')}" required>`).join('') : ''}${editing ? `<label for="chat-investments">Connected companies or funds (optional)</label><input id="chat-investments" maxlength="504" value="${esc(investments.join(', '))}"><p class="chat-card-note">Up to five, separated by commas.</p>` : investments.length ? `<p class="chat-card-note">Connected investments: ${investments.map(esc).join(', ')}</p>` : ''}${record.state !== 'saved' || editing ? `<label for="chat-email">Email</label><input id="chat-email" type="email" maxlength="254" required value="${esc(record.email || '')}" autocomplete="email">` : ''}<div class="thread-card-actions"><button class="chat-save">${record.state === 'saved' && !editing ? 'Saved' : 'Save'}</button><button class="chat-edit">${editing ? 'Cancel' : 'Edit'}</button></div><p class="chat-card-note">Assumptions are interpretations of your idea, not verified facts.</p>${record.state === 'saved' ? '<div class="thread-saved"><p role="status">Saved privately.</p><p>Bookmark your private link. Anyone with it can view and edit this thesis.</p><button class="chat-copy">Copy private link</button><p class="chat-copy-note" role="status"></p><p>Weekly monitoring isn’t active for this thesis yet.</p></div>' : ''}</div>`;
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
      const context = editing && record.context ? Object.fromEntries(Object.keys(contextLabels).map(key => [key, card.querySelector('#context-' + key).value.trim()])) : record.context;
      if (record.thesis && (!context || Object.values(context).some(value => !value))) return error('Add the missing details in Edit before saving.');
      const names = editing ? namesFrom(card.querySelector('#chat-investments').value) : investments;
      if (!text.trim()) return error('Keep a few words describing your thesis.');
      if (!validNames(names)) return error('Add up to five investments, each under 100 characters.');
      const email = (card.querySelector('#chat-email')?.value || record.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Enter a valid email address.');
      busy = true; save.disabled = true; save.textContent = 'Saving…'; errorBox.hidden = true; card.querySelector('.chat-edit').disabled = true;
      try {
        await client.mutation(api.theses.confirm, { token, email, reflection: text, investments: names, ...(context ? { context } : {}) });
        record.email = email; investments = names; record.investments = names; if (context) { record.context = context; record.missingFields = []; record.needsConfirmation = false; } record.confirmedReflection = text.trim(); record.state = 'saved'; editing = false; busy = false; showCard();
      } catch (e) { busy = false; save.disabled = false; save.textContent = 'Save'; card.querySelector('.chat-edit').disabled = false; error('Your thesis wasn’t saved. Your words are still here. Try Save again.'); }
    };
    scroll();
  };
  const nextTurn = async (answer, requestId = crypto.randomUUID()) => {
    if (busy || record?.interpretation) return;
    if (!token) token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
    setBusy(true); composer.hidden = false; errorBox.hidden = true;
    const pending = document.createElement('p'); pending.className = 'chat-note chat-thinking'; pending.setAttribute('role', 'status'); pending.textContent = 'Thinking?'; thread.append(pending); scroll();
    try {
      const response = await client.action(api.thesisChatActions.reply, { token, ...(!started ? { original: original || 'Help me put an investment idea into words.' } : {}), ...(answer !== undefined ? { message: answer } : {}), requestId });
      token = response.token; started = true; history.replaceState(null, '', `/?create=thesis#private=${token}`);
      pending.remove(); setBusy(false);
      if (response.error) { failedTurn(response.retry, undefined, undefined, response.error); return; }
      message('lookout', response.reply);
      if (response.result) { record = { original, investments, interpretation: response.result, thesis: response.thesis, context: response.context, missingFields: response.missingFields, needsConfirmation: response.needsConfirmation, state: 'draft' }; showCard(); }
      else { note.textContent = ''; input.focus({ preventScroll: true }); }
    } catch {
      pending.remove(); setBusy(false); failedTurn(true, answer, requestId);
    }
  };
  const failedTurn = (retry, answer, requestId, failure = "Lookout couldn't think right now, try again") => {
    composer.hidden = true;
    const failed = message('lookout', failure); failed.classList.add('chat-turn-error');
    if (retry) { const button = document.createElement('button'); button.type = 'button'; button.className = 'chat-retry'; button.textContent = 'Try again'; button.onclick = () => { failed.remove(); void nextTurn(answer, requestId); }; failed.append(button); }
    else note.textContent = failure.includes('thinking limit') ? '' : 'This conversation has reached its six-call limit.';
  };
  const submitAnswer = text => {
    if (busy || record?.interpretation) return;
    message('you', text); input.value = ''; void nextTurn(text);
  };
  composer.addEventListener('submit', event => { event.preventDefault(); const text = input.value.trim(); if (text) submitAnswer(text); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); composer.requestSubmit(); } });
  window.scrollTo(0, 0);
  if (!token) { if (original) message('you', original); void nextTurn(); return; }
  composer.hidden = true; const pending = document.createElement('p'); pending.setAttribute('role', 'status'); pending.textContent = 'Opening your private thesis?'; thread.append(pending);
  try {
    record = await client.query(api.theses.read, { token }); if (!record) throw Error('Missing thesis');
    original = record.original; investments = record.investments; pending.remove();
    if (record.conversation) record.conversation.messages.forEach(item => message(item.role === 'assistant' ? 'lookout' : 'you', item.content));
    else { message('you', original); (record.clarifications || []).forEach(answer => message('you', answer)); }
    if (record.interpretation) showCard();
    else {
      const chat = record.conversation;
      if (chat?.messages.at(-1)?.role === 'assistant') { composer.hidden = false; input.focus({ preventScroll: true }); }
      else failedTurn((chat?.calls || 0) < 6);
    }
  } catch {
    pending.textContent = 'This private link could not be opened. Check the complete link or try again.';
    const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.onclick = () => bindThesisChat(root); pending.append(retry);
  }
}

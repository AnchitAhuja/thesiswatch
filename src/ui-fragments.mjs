const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export function captureComposerMarkup({ demo = false, typed = '', belief = '' } = {}) {
  const id = demo ? 'example-belief' : 'landing-belief';
  return `<form class="landing-composer${demo ? ' demo-composer' : ''}" ${demo ? 'inert' : ''}><label class="visually-hidden" for="${id}">Your investment belief</label><input id="${id}" type="text" maxlength="3000" required placeholder="What's your investment idea?" ${demo ? `readonly value="${esc(belief)}"` : ''}>${demo ? `<p class="typed-belief" aria-hidden="true"><span>${typed}</span></p>` : ''}<button type="${demo ? 'button' : 'submit'}">Build</button></form>`;
}

export function reflectionMarkup({ text, investments = [], edit = false, demo = false }) {
  const prefix = demo ? 'example-' : '';
  const heading = demo ? 'h4' : 'h1';
  return `<${heading}>Here's what I think you're betting on.</${heading}><div class="reflection-paper">${edit ? `<label for="${prefix}reflection">Put it in your words</label><textarea id="${prefix}reflection" maxlength="2000">${esc(text)}</textarea>` : `<p class="reflection-text">${esc(text)}</p>`}
    ${investments.length ? `<p class="linked-investments">Connected investments: ${investments.map(esc).join(', ')}</p>` : ''}</div>
    <label for="${prefix}investments">Investments connected to it <span>(optional)</span></label><input id="${prefix}investments" maxlength="504" value="${esc(investments.join(', '))}" placeholder="Nvidia, Microsoft, or an ETF"><p class="field-note">Add up to five, separated by commas. You can leave this blank.</p><p class="capture-question">Does that sound right?</p><div class="capture-actions"><button id="${prefix}confirm">${edit ? 'Save these words' : 'Yes, save my thesis'}</button>${edit ? '' : `<button class="secondary-action" id="${prefix}edit">Edit the interpretation</button>`}</div><p role="alert" hidden></p>`;
}

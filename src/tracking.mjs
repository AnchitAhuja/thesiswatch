import { validateEmail } from '../shared/email.mjs';

export const trackingMarkup = `
  <section class="tracking" aria-labelledby="tracking-heading">
    <h2 id="tracking-heading">Subscribe to this thesis</h2>
    <form id="tracking-form" novalidate>
      <label for="tracking-email">Email address</label>
      <div class="tracking-fields">
        <input id="tracking-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="Enter email" required aria-describedby="tracking-error" />
        <button type="submit">Subscribe to this thesis</button>
      </div>
      <p id="tracking-error" class="tracking-error" role="alert"></p>
    </form>
    <p id="tracking-success" class="tracking-success" role="status" hidden>You're on the list</p>
  </section>`;

export function bindTracking(root, saveEmail) {
  const form = root.querySelector('#tracking-form');
  const input = root.querySelector('#tracking-email');
  const button = form.querySelector('button');
  const error = root.querySelector('#tracking-error');
  const success = root.querySelector('#tracking-success');
  let saving = false;

  input.addEventListener('input', () => {
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving || form.hidden) return;
    error.textContent = '';
    const validation = validateEmail(input.value);
    if (validation.error) {
      error.textContent = validation.error;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    saving = true;
    button.disabled = true;
    input.disabled = true;
    button.textContent = 'Savingâ€¦';
    form.setAttribute('aria-busy', 'true');
    try {
      await saveEmail(validation.email);
      form.hidden = true;
      success.hidden = false;
    } catch {
      error.textContent = "We couldn't save your email. Please try again.";
    } finally {
      saving = false;
      button.disabled = false;
      input.disabled = false;
      button.textContent = 'Subscribe to this thesis';
      form.removeAttribute('aria-busy');
    }
  });
}


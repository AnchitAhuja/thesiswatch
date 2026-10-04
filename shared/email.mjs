/** Validate and normalize the same way in the form and in Convex. */
export function validateEmail(value) {
  const email = value.trim().toLowerCase();
  if (!email) return { email, error: 'Enter your email address.' };
  const parts = email.split('@');
  const local = parts[0];
  const domain = parts[1];
  const valid = parts.length === 2 && email.length <= 254 && local.length <= 64
    && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)
    && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..')
    && domain?.includes('.') && domain.split('.').every(label =>
      label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
  return { email, error: valid ? null : 'Enter a valid email address, such as name@example.com.' };
}

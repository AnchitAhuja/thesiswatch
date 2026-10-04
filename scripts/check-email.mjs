import assert from 'node:assert/strict';
import { validateEmail } from '../shared/email.mjs';

assert.equal(validateEmail('').error, 'Enter your email address.');
for (const email of ['bad', 'name@', '@example.com', 'name@localhost', 'name@@example.com', 'name@-example.com', 'name..test@example.com', 'name@exa mple.com']) {
  assert.ok(validateEmail(email).error, `${email} must be rejected`);
}
assert.deepEqual(validateEmail('  Test.Thesis+AI@Example.COM  '), { email: 'test.thesis+ai@example.com', error: null });
console.log('PASS: empty and invalid email addresses rejected; valid email trimmed and lowercased.');

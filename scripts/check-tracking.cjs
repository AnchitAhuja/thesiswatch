const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const { execFileSync } = require('node:child_process');
const { ConvexHttpClient } = require('convex/browser');
const fs = require('node:fs');

const localUrl = process.env.TEST_LOCAL_URL || 'http://127.0.0.1:5174/';
const testEmail = 'thesis-tracking-test-20261004@example.com';
const convexUrl = fs.readFileSync('.env.local', 'utf8').match(/^VITE_CONVEX_URL=(.+)$/m)[1].trim();
const queryRows = () => JSON.parse(execFileSync(process.execPath, ['node_modules/convex/bin/main.js', 'run', '--inline-query',
  `await ctx.db.query("trackingOptIns").withIndex("by_email", q => q.eq("email", "${testEmail}")).take(2)`], { encoding: 'utf8' }));

async function loadPage() {
  const htmlResponse = await fetch(localUrl);
  assert.equal(htmlResponse.status, 200);
  const dom = new JSDOM(await htmlResponse.text(), { url: localUrl, runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  dom.window.fetch = fetch;
  // Execute the exact built page served locally, including its Convex client.
  const script = dom.window.document.querySelector('script[type="module"]');
  const response = await fetch(new URL(script.src, localUrl));
  assert.equal(response.status, 200);
  dom.window.eval(await response.text());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(dom.window.document.querySelectorAll('article').length, 11);
  assert.ok(dom.window.document.body.textContent.includes('Edition dated Oct 4, 2026'));
  return dom;
}

function submit(dom, email) {
  const form = dom.window.document.querySelector('#tracking-form');
  const input = dom.window.document.querySelector('#tracking-email');
  input.value = email;
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function waitForSaved(dom) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { observer.disconnect(); reject(new Error('Timed out waiting for save')); }, 20000);
    const observer = new dom.window.MutationObserver(() => {
      const error = dom.window.document.querySelector('#tracking-error').textContent;
      if (error) { clearTimeout(timer); observer.disconnect(); reject(new Error(error)); }
      else if (!dom.window.document.querySelector('#tracking-success').hidden) {
        clearTimeout(timer); observer.disconnect(); resolve();
      }
    });
    observer.observe(dom.window.document.querySelector('.tracking'), { attributes: true, childList: true, subtree: true });
  });
}

(async () => {
  const before = queryRows();
  const dom = await loadPage();
  submit(dom, '');
  assert.equal(dom.window.document.querySelector('#tracking-error').textContent, 'Enter your email address.');
  submit(dom, 'invalid-email');
  assert.equal(dom.window.document.querySelector('#tracking-error').textContent, 'Enter a valid email address, such as name@example.com.');
  console.log('PASS: local form rejects empty and invalid email with clear messages.');

  const pending = waitForSaved(dom);
  submit(dom, testEmail);
  assert.equal(dom.window.document.querySelector('button').disabled, true);
  await pending;
  assert.equal(dom.window.document.querySelector('#tracking-success').textContent, "You're on the list");
  assert.equal(dom.window.document.querySelector('#tracking-form').hidden, true);
  console.log(`PASS: submitted ${testEmail} through the local page; displayed "You're on the list" after saving.`);
  const first = queryRows();
  assert.equal(first.length, 1);
  assert.equal(first[0].email, testEmail);
  assert.equal(new Date(first[0].savedAt).toISOString(), first[0].savedAt);
  if (before.length) assert.deepEqual(first, before);

  const duplicatePage = await loadPage();
  const duplicatePending = waitForSaved(duplicatePage);
  submit(duplicatePage, `  ${testEmail.toUpperCase()}  `);
  await duplicatePending;

  const client = new ConvexHttpClient(convexUrl, { logger: false });
  await Promise.all([
    client.mutation('tracking:save', { email: testEmail }),
    client.mutation('tracking:save', { email: ` ${testEmail.toUpperCase()} ` }),
  ]);
  assert.deepEqual(queryRows(), first);
  console.log('PASS: repeat, mixed-case, space-padded and concurrent submissions keep one row and the original date.');
  for (const email of ['', 'invalid-email']) {
    await assert.rejects(client.mutation('tracking:save', { email }), /Enter (your email address|a valid email address)/);
  }
  console.log('PASS: Convex independently rejects empty and invalid email.');

  const failurePage = await loadPage();
  failurePage.window.fetch = async () => { throw new Error('Test connection failure'); };
  const failurePromise = waitForSaved(failurePage);
  submit(failurePage, testEmail);
  await assert.rejects(failurePromise, /We couldn't save your email. Please try again./);
  assert.equal(failurePage.window.document.querySelector('button').disabled, false);
  assert.equal(failurePage.window.document.querySelector('#tracking-success').hidden, true);
  console.log('PASS: failed save shows a retry message, re-enables the button, and does not claim success.');
  assert.deepEqual(queryRows(), first);
  console.log('Saved row read directly from Convex:');
  console.log(JSON.stringify(first[0], null, 2));
  console.log(`Local URL: ${localUrl}`);
  console.log('Checked the served page with a DOM test; visual browser check unavailable (no connected browser).');
  dom.window.close(); duplicatePage.window.close(); failurePage.window.close();
})().catch(error => { console.error(error); process.exit(1); });

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

// Exercise the actual TypeScript handlers without introducing a test dependency.
function load(file, overrides = {}, globals = {}) {
  const filename = path.resolve(file);
  const realRequire = createRequire(filename);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, require: name => overrides[name] ?? realRequire(name),
    Request, Response, Date, AbortSignal, console: { log() { throw new Error('Do not log inquiry details'); } },
    ...globals,
  }, { filename });
  return exports;
}

const { POST } = load('app/api/booking/request/route.ts');
const inquiry = { name: 'Test Person', email: 'test@example.com', phone: '555-0100',
  requestedDate: '2026-10-20', sessionIntent: 'Synthetic test', acknowledgement: 'accepted' };
const request = body => new Request('http://localhost/api/booking/request', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

for (const body of [null, [], 'text', 42, {}, { ...inquiry, email: 'bad' },
  { ...inquiry, acknowledgement: '' }, { ...inquiry, requestedDate: '2026-02-30' },
  { ...inquiry, requestedDate: '2026-13-01' }]) {
  test(`reject invalid inquiry: ${JSON.stringify(body)}`, async () => {
    assert.equal((await POST(request(body))).status, 400);
  });
}
test('malformed JSON returns 400', async () => {
  assert.equal((await POST(new Request('http://localhost', { method: 'POST', body: '{' }))).status, 400);
});
test('valid inquiry fails closed without logging personal details', async () => {
  const response = await POST(request(inquiry));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const body = await response.json();
  assert.equal(body.success, false);
  assert.match(body.error, /has not been saved/);
});

for (const [name, fetchImpl, expected] of [
  ['network rejection', async () => { throw new TypeError('offline'); }, 'error'],
  ['timeout', async () => { throw new DOMException('timeout', 'TimeoutError'); }, 'error'],
  ['unavailable backend', async () => new Response(JSON.stringify({ error: 'Not saved' }), { status: 503 }), 'error'],
  ['invalid response JSON', async () => new Response('invalid'), 'error'],
  ['null response', async () => new Response('null'), 'error'],
  ['missing success flag', async () => new Response('{}'), 'error'],
  ['explicit saved acknowledgement', async () => new Response('{"success":true}'), 'success'],
]) {
  test(`form handles ${name}`, async () => {
    const states = []; let resetCount = 0; let hook = 0;
    const { BespokeBookingForm } = load('app/book/bespoke-booking-form.tsx', {
      react: { useState(initial) { const index = hook++; return [initial, value => { if (index === 0) states.push(value); }]; } },
    }, { fetch: fetchImpl, FormData: class { entries() { return Object.entries(inquiry); } } });
    const form = BespokeBookingForm();
    await form.props.onSubmit({ preventDefault() {}, currentTarget: { reset() { resetCount++; } } });
    assert.deepEqual(states, ['submitting', expected]);
    assert.equal(resetCount, expected === 'success' ? 1 : 0, 'retain inputs on failure');
  });
}

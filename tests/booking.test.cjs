const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');

const { POST } = load('app/api/booking/request/route.ts');
const inquiry = { name: 'Test Person', email: 'test@example.com', phone: '555-0100',
  requestedDate: '2026-10-20', sessionIntent: 'Synthetic test', acknowledgement: 'accepted' };
const request = body => new Request('http://localhost/api/booking/request', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'bb4194b4-7f93-4cb6-9c63-554c257d162b' }, body: JSON.stringify(body),
});

for (const body of [null, [], 'text', 42, {}, { ...inquiry, email: 'bad' },
  { ...inquiry, acknowledgement: '' }, { ...inquiry, requestedDate: '2026-02-30' },
  { ...inquiry, requestedDate: '2026-13-01' }]) {
  test(`reject invalid inquiry: ${JSON.stringify(body)}`, async () => {
    assert.equal((await POST(request(body))).status, 400);
  });
}

test('double click is ignored and unchanged retries reuse their key across reloads', async () => {
  const memory=new Map();const keys=[];
  const globals={
    fetch:async(_,options)=>{keys.push(options.headers['Idempotency-Key']);throw Error('offline');},
    FormData:class {entries(){return Object.entries(inquiry);}},
    sessionStorage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)},
  };
  const react={useRef:current=>({current}),useState:initial=>[initial,()=>{}]};
  const makeForm=()=>load('app/book/bespoke-booking-form.tsx',{react},globals).BespokeBookingForm();
  const event={preventDefault(){},currentTarget:{reset(){throw Error('must retain failed input');}}};
  const form=makeForm();
  await Promise.all([form.props.onSubmit(event),form.props.onSubmit(event)]);
  assert.equal(keys.length,1);
  await makeForm().props.onSubmit(event);
  assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
  assert.ok(![...memory.values()][0].includes(inquiry.email));
});
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
  ['success without reference', async () => new Response('{"success":true}'), 'error'],
  ['explicit saved acknowledgement', async (_, options) => new Response(JSON.stringify({success:true,inquiryId:options.headers['Idempotency-Key']})), 'success'],
]) {
  test(`form handles ${name}`, async () => {
    const states = []; let resetCount = 0; let hook = 0;
    const { BespokeBookingForm } = load('app/book/bespoke-booking-form.tsx', {
      react: { useRef(value) { return {current:value}; }, useState(initial) { const index = hook++; return [initial, value => { if (index === 0) states.push(value); }]; } },
    }, { fetch: fetchImpl, FormData: class { entries() { return Object.entries(inquiry); } } });
    const form = BespokeBookingForm();
    await form.props.onSubmit({ preventDefault() {}, currentTarget: { reset() { resetCount++; } } });
    assert.deepEqual(states, ['submitting', expected]);
    assert.equal(resetCount, expected === 'success' ? 1 : 0, 'retain inputs on failure');
  });
}

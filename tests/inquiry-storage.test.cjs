const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const load = require('./load-ts.cjs');
const service = load('lib/booking/inquiries.ts');
const inquiry = { name: 'Test Person', email: 'test@example.com', phone: '555-0100', requestedDate: '2026-10-20',
  sessionIntent: 'Synthetic test', comfortNotes: 'Test only', acknowledgement: 'accepted' };

test('durable inquiry and notification lifecycle using real PostgreSQL SQL', async () => {
  const directory=mkdtempSync(join(tmpdir(),'pf2p-db-'));
  let db = new PGlite(directory);
  const query = async (sql, params) => (await db.query(sql, params)).rows;
  try {
    await db.exec(readFileSync('db/migrations/001_booking_inquiries.sql','utf8'));
    const id = randomUUID();
    await service.saveInquiry(query,id,inquiry,'PF2P <booking@example.com>','bucket');
    await db.close();db=new PGlite(directory);
    await service.saveInquiry(query,id,inquiry,'PF2P <booking@example.com>','bucket');
    assert.equal((await query('SELECT * FROM pf2p_inquiries')).length,1,'retry does not duplicate inquiry');
    await assert.rejects(service.saveInquiry(query,id,{...inquiry,name:'Changed'},'sender','bucket'), service.InquiryConflict);
    let row=(await query('SELECT * FROM pf2p_inquiries WHERE id=$1',[id]))[0];
    assert.equal(row.payload.comfortNotes,'Test only');
    assert.equal(row.booking_status,'INQUIRY'); assert.equal(row.payment_status,'UNPAID');
    assert.equal(row.notification_status,'pending');
    const keys=[];
    await service.deliverNotification(query,async (message,key)=>{
      keys.push(key);assert.deepEqual(message.to,['johng@phfit2print.com']);throw Error('offline');
    },id);
    row=(await query('SELECT * FROM pf2p_inquiries WHERE id=$1',[id]))[0];
    assert.equal(row.notification_status,'pending');
    assert.equal(row.last_error,'notification_attempt_failed');
    await query("UPDATE pf2p_inquiries SET next_attempt_at=now() WHERE id=$1",[id]);
    await service.retryNotifications(query,async (message,key)=>{keys.push(key);return 'provider-id';});
    assert.equal(keys.length,2);assert.equal(keys[0],keys[1],'provider retry deduplicates');
    row=(await query('SELECT * FROM pf2p_inquiries WHERE id=$1',[id]))[0];
    assert.equal(row.notification_status,'accepted');assert.equal(row.provider_message_id,'provider-id');
    await service.deliverNotification(query,async ()=>{throw Error('must not resend');},id);
    assert.equal((await query('SELECT notification_attempts FROM pf2p_inquiries WHERE id=$1',[id]))[0].notification_attempts,2);

    const interrupted=randomUUID();
    await service.saveInquiry(query,interrupted,inquiry,'sender','other');
    await query("UPDATE pf2p_inquiries SET notification_status='sending',lease_until=now()-interval '1 minute',first_attempt_at=now() WHERE id=$1",[interrupted]);
    let recovered=0;
    await service.deliverNotification(query,async ()=>{recovered++;return 'recovered';},interrupted);
    assert.equal(recovered,1,'expired worker lease is recoverable');

    const old=randomUUID();await service.saveInquiry(query,old,inquiry,'sender','third');
    await query("UPDATE pf2p_inquiries SET first_attempt_at=now()-interval '24 hours' WHERE id=$1",[old]);
    await service.deliverNotification(query,async ()=>{throw Error('do not retry after dedup window');},old);
    assert.equal((await query('SELECT notification_status FROM pf2p_inquiries WHERE id=$1',[old]))[0].notification_status,'review');

    for(let i=0;i<5;i++) await service.saveInquiry(query,randomUUID(),inquiry,'sender','limited');
    await assert.rejects(service.saveInquiry(query,randomUUID(),inquiry,'sender','limited'),service.InquiryRateLimit);
  } finally { await db.close();rmSync(directory,{recursive:true,force:true}); }
});

test('provider adapter requires activation and validates Resend acceptance', async () => {
  const env={BOOKING_INQUIRIES_ENABLED:'true',BOOKING_DATABASE_URL:'postgres://test',RESEND_API_KEY:'test-key',
    BOOKING_EMAIL_FROM:'sender@example.com',BOOKING_RATE_LIMIT_SECRET:'test-rate',BOOKING_WORKER_SECRET:'test-worker'};
  let sent;
  const providers=load('lib/booking/providers.ts',{
    '@neondatabase/serverless':{neon:()=>({query:async()=>[]})},
  }, {process:{env},fetch:async(url,options)=>{
    sent={url,options};return new Response('{"id":"test-provider-id"}');
  }}).getBookingProviders();
  const message=service.ownerMessage(randomUUID(),inquiry,'sender@example.com');
  assert.equal(await providers.send(message,'stable-key'),'test-provider-id');
  assert.equal(sent.url,'https://api.resend.com/emails');
  assert.equal(sent.options.headers['Idempotency-Key'],'stable-key');
  assert.deepEqual(JSON.parse(sent.options.body).to,['johng@phfit2print.com']);
  assert.equal(load('lib/booking/providers.ts').getBookingProviders(),null);
  const broken=load('lib/booking/providers.ts',{'@neondatabase/serverless':{neon:()=>({query:async()=>[]})}},
    {process:{env},fetch:async()=>new Response('{}')}).getBookingProviders();
  await assert.rejects(broken.send(message,'stable-key'));
});

test('API acknowledges committed storage even if email is down; never acknowledges failed storage', async () => {
  const db=new PGlite();const query=async (sql,params)=>(await db.query(sql,params)).rows;
  await db.exec(readFileSync('db/migrations/001_booking_inquiries.sql','utf8'));
  const makeRoute=query=>load('app/api/booking/request/route.ts',{
    '@/lib/booking/providers':{getBookingProviders:()=>({query,send:async()=>{throw Error('mail down');},from:'sender',rateSecret:'test-secret'})},
  });
  const request=id=>new Request('http://localhost/api/booking/request',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify(inquiry)});
  try {
    const id=randomUUID();const result=await makeRoute(query).POST(request(id));
    assert.equal(result.status,200);assert.equal((await result.json()).inquiryId,id);
    assert.equal((await query('SELECT * FROM pf2p_inquiries')).length,1);
    const failed=await makeRoute(async()=>{throw Error('DB down');}).POST(request(randomUUID()));
    assert.equal(failed.status,503);assert.equal((await failed.json()).success,false);
    const retry=load('app/api/booking/notifications/retry/route.ts');
    assert.equal((await retry.POST(new Request('http://localhost',{method:'POST'}))).status,401);
    const oversized=await makeRoute(query).POST(new Request('http://localhost',{method:'POST',body:'x'.repeat(17000)}));
    assert.equal(oversized.status,413);
    const origin=await makeRoute(query).POST(new Request('http://localhost',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'}));
    assert.equal(origin.status,403);
  } finally {await db.close();}
});

const base = process.env.BOOKING_PREVIEW_URL;
const secret = process.env.BOOKING_WORKER_SECRET;
if (!base || !secret || new URL(base).protocol !== 'https:' || !new URL(base).hostname.endsWith('.vercel.app')) {
  console.error('Set BOOKING_PREVIEW_URL to the protected Vercel preview and BOOKING_WORKER_SECRET.');
  process.exit(1);
}
const headers = { Authorization: `Bearer ${secret}` };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}
fetch(new URL('/api/booking/notifications/retry',base), {
  method:'POST', headers, redirect:'error', signal:AbortSignal.timeout(120000),
}).then(async response => {
  if (!response.ok) throw new Error('retry_failed');
  const body = await response.json();
  console.log(JSON.stringify(body.counts));
}).catch(() => { console.error('Retry failed. Check preview access and service configuration.'); process.exitCode=1; });

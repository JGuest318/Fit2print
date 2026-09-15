# Bespoke inquiry saving and owner notification

## Current boundary

This change belongs to draft PR #13 and its preview only. Production remains on hold.
The implementation does not reserve dates, collect the retainer or balance, sign
agreements, or change the $995 / $300 / $695 package. John retains intake review and
final publication authority. Package image count and policy wording remain open.

## Implemented behavior

- Commit the inquiry and notification outbox together in one PostgreSQL row.
- Acknowledge receipt only after that write succeeds; return a reference number.
- Reuse an idempotency key after a timeout or reload with unchanged form details.
  Browser session storage contains only a random key and SHA-256 digest, not the
  customer's answers. Restricted browser storage falls back to an in-memory key.
- Send a plain-text notification to **johng@phfit2print.com** with the inquiry,
  reply-to customer address, reference, and INQUIRY / UNPAID status. No customer
  acknowledgement email is sent by this slice.
- Email failures do not undo a saved inquiry. The row remains queued, with a
  five-minute delay and a worker lease recoverable after interruption.
- Retry with the same Resend idempotency key and the exact saved email payload.
  After 23 hours from the first send attempt, stop automatic sends and mark the
  row `review` to avoid sending duplicates after the provider's 24-hour window.
- `accepted` means the email provider accepted the message. It does not prove
  inbox delivery; confirm the synthetic notification in John's mailbox before activation.
- No inquiry contents, credentials, or provider error bodies go to application logs.
- Reject cross-origin requests, invalid dates, oversized bodies, and more than
  five new inquiries per email address per UTC hour. This is baseline abuse
  control, not a complete public-launch anti-spam system.

## Preview service activation

Use an isolated Neon PostgreSQL database and Resend with a verified sender.
Reuse suitable existing services if present; do not connect the production database.
The available Vercel connector did not expose integrations or environment settings,
and the implementation workspace had no storage/email credentials. These services
and the scheduled worker have **not** been provisioned or verified by this change.

Configure server-only environment variables scoped to the PR preview branch:

| Variable | Value |
| --- | --- |
| `BOOKING_DATABASE_URL` | Neon connection string for the isolated preview database |
| `RESEND_API_KEY` | Sending key for the verified sender domain |
| `BOOKING_EMAIL_FROM` | Verified PF2P sender, such as `PF2P <booking@phfit2print.com>` only if verified |
| `BOOKING_RATE_LIMIT_SECRET` | Random secret of at least 32 bytes |
| `BOOKING_WORKER_SECRET` | Separate random secret of at least 32 bytes |
| `BOOKING_INQUIRIES_ENABLED` | Keep `false` until the schema and retry worker are ready; then `true` |

Do not put secret values in GitHub, logs, or chat. The notification destination is
fixed in server code. A Resend test sender may restrict recipients to the account
owner; do not assume it can send to John's business address without verification.

1. Apply `db/migrations/001_booking_inquiries.sql` to the preview database using
   `BOOKING_MIGRATION_CONFIRM=preview npm run booking:migrate` with credentials
   securely loaded into the process environment. It adds dedicated `pf2p_` tables
   transactionally and does not touch existing tables. Runtime requests do not run DDL.
2. Connect an authenticated scheduler to POST `/api/booking/notifications/retry`
   every five minutes with `Authorization: Bearer <BOOKING_WORKER_SECRET>`.
   Keep Vercel preview protection enabled; give the worker authorized automation
   access. This PR does not create a scheduler or weaken preview protection.
   The worker processes up to three due rows per run and returns status counts only.
3. `npm run booking:retry` can perform the same bounded retry on demand. It requires
   `BOOKING_PREVIEW_URL` and the worker secret, plus the existing Vercel automation
   bypass credential if that project uses one. It will not follow redirects carrying
   the worker authorization header.
4. Enable the preview feature and redeploy the current PR head.
5. One synthetic inquiry must produce a database row, a browser reference, and an
   email accepted by Resend and observed in John's mailbox. Retry unchanged details
   and verify there is one inquiry and one email. Stop after this focused check.

The route returns 503 without claiming receipt while the feature is disabled or
required service settings are missing. Schema/connectivity failures likewise do not
produce a false confirmation.

## Operational recovery

Authorized operators can inspect the database directly; there is no public read API
or new unprotected admin page. Use least-privilege database credentials server-side.

```sql
SELECT id, created_at, notification_status, notification_attempts,
       provider_message_id, last_error
FROM pf2p_inquiries
WHERE notification_status <> 'accepted'
ORDER BY created_at;
```

Rows in `review` need the provider's send history checked before a manual follow-up.
If Resend accepted a message but the DB status write failed, the next worker retries
with the same key inside the deduplication window. No automatic retry is made after
that window. Confirm delivery/bounces in Resend; inbox-delivery tracking via signed
webhooks is not part of this slice. Agree on inquiry retention before public launch.

## Validation

`npm test` covers actual PostgreSQL schema/query behavior with PGlite, duplicate
requests, payload conflicts, persistence through database restart, queued email
failure, retry keys, expired leases, retry-window cutoff, rate limits, route failure
semantics, request-size/origin guards, worker authentication, and client error recovery.
The provider adapter is checked with mocked network responses. These are local tests,
not proof of a provisioned Neon service or delivered email. `npm run build` checks
the production bundle without requiring live service credentials.

Provider references: [Neon driver](https://github.com/neondatabase/serverless),
[Resend send API](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

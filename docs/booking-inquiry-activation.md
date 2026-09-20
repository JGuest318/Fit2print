# PF2P Bespoke Booking V1 — activation guide

## Current boundary

This change belongs to draft PR #13 and its preview only. **Production remains on hold.**
John retains agreement/experience review and final publication authority. Nothing in
this document authorizes a production deployment, a real charge, or a real refund.

## What is actually implemented (current state)

This supersedes the earlier inquiry-only version of this document. The feature set now
includes:

- Inquiry intake, storage, and owner-notification retry (original slice, unchanged).
- Owner-approved availability calendar and a held → confirmed → paid_in_full booking
  state machine, with hard double-booking protection (a partial unique index — not
  just an application check).
- 30-minute holds with expiry enforced at every stage that reads a booking (approval,
  agreement acceptance, payment), not only at approval time.
- Stripe Checkout in **TEST MODE ONLY**, with a database-level mutex (partial unique
  index) plus a Stripe `Idempotency-Key` so concurrent pay-link visits cannot create
  duplicate Checkout sessions.
- A client agreement with a separate, explicit promotional-use-permission checkbox,
  and the accepted agreement's version and SHA-256 text hash recorded on the booking
  for provenance.
- Atomic, row-locked payment confirmation (a single CTE with `FOR UPDATE`) so a
  webhook confirming payment cannot race with a concurrent cancellation or reschedule.
- Reschedule-with-credit-transfer as one atomic, row-locked SQL statement: the original
  booking is locked, the target date's eligibility is checked, and the original is
  cancelled and replaced only if that succeeds — proven to allow exactly one winner
  under real concurrent requests.
- Return pages (`/book/confirmed`, `/book/paid-in-full`, `/book/payment-cancelled`)
  that verify payment type and the booking's live status before rendering a success or
  failure message, and treat an unreachable Stripe status check as "unknown," never as
  an asserted negative.
- A manual refund ledger (`pf2p_refund_records`) with `status` (`pending` /
  `completed` / `failed`) and a `reference` back to the original payment attempt.
- Package wording and pricing: **unchanged from John's approved wording** — this
  document does not alter it.

## What is reported versus independently verified

This distinction matters and is kept explicit throughout this document and the PR:

- **Independently verified by Magica in this environment**: the concurrency proofs
  (simultaneous Checkout-session creation, simultaneous reschedule, payment-vs-
  cancellation race), the migration-sequence fix (below), the app-level auth checks
  against the deployed preview build (401 without a valid worker/cron token, 200 with
  one), and the Vercel deployment/build state.
- **Reported by an external review, not independently replayed by Magica**: the
  specific claim that `accepted: 18` in an earlier response proves a particular GET
  request "recovered 18 messages." That number is the **total count of inquiry rows
  currently in `accepted` status in the database** — it reflects the cumulative state
  of the table, not the delta caused by that one request. No claim to the contrary
  should be read into that earlier report.
- **Not yet verified by anyone**: live, scheduled (as opposed to manually invoked)
  execution of the cron routes. Vercel's native Cron only invokes **Production**
  deployments, so this cannot be demonstrated on a preview branch. It is a named
  post-approval release check (below), not something this document claims is done.

## Database migrations

Three versioned, uniquely-numbered files, applied in order and tracked in a
`pf2p_schema_migrations` table so the runner is idempotent and safe to re-run:

1. `db/migrations/001_booking_inquiries.sql` — inquiry intake and notification outbox.
2. `db/migrations/002_booking_availability.sql` — availability calendar and the base
   `pf2p_bookings` / `pf2p_stripe_events` tables (retainer/balance columns, no
   agreement provenance or payment-attempt ledger yet).
3. `db/migrations/003_booking_payments_and_refunds.sql` — adds `agreement_version`,
   `agreement_text_hash`, `rescheduled_from_booking_id`, and `needs_resolution` to
   `pf2p_bookings` using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (not
   `CREATE TABLE IF NOT EXISTS`, which is what caused the earlier defect — see below),
   plus `pf2p_payment_attempts` and `pf2p_refund_records`.

**Defect found and fixed:** an earlier duplicate-numbered `002_booking_availability_and_payments.sql`
used `CREATE TABLE IF NOT EXISTS` for `pf2p_bookings`, which silently no-ops against an
already-existing table — it would never have added the new columns to a database that
had already run the original `002`. Separately, running that file alone against an
empty database would fail because it references `pf2p_inquiries`, which only `001`
creates. That file has been deleted and replaced by `003` above.

**Runner fix:** `scripts/booking-migrate.cjs` no longer hardcodes a single file. It now
creates a `pf2p_schema_migrations` tracking table, reads every `*.sql` file in
`db/migrations/` in filename order, and applies only the ones not yet recorded as
applied — each migration's DDL and its tracking row commit together in one transaction.

**Independently verified (sandbox, PGlite, not the production database):**
- Applying `001` → `002` → `003` to an **empty database** and applying `001` → `002`
  (representing a database that already had the earlier, pre-`003` schema) → `003`
  alone produce **byte-identical final schemas** (same columns, types, nullability,
  defaults, and indexes across every `pf2p_*` table).
- Replaying the **old, defective** duplicate-numbered file against a database that
  already had the base `pf2p_bookings` table reproduces the reported bug exactly: zero
  of the new columns are added, confirming this was a real defect and not a
  hypothetical one.

This does not touch the actual preview or production database — it is a schema-only
verification. Applying these migrations to the real preview database, and to a fresh,
isolated production database at release time, remains a manual step with credentials
loaded server-side.

## Scheduler

- **Primary**: Vercel native Cron, `*/5 * * * *`, both
  `/api/booking/notifications/retry` and `/api/booking/admin/expire-holds`, authenticated
  via `CRON_SECRET` (which Vercel injects automatically as a bearer token on its own
  cron invocations). This requires a Pro-or-higher Vercel plan, now in place. Native
  Cron **only fires against Production deployments** — it cannot be demonstrated on
  this preview branch. Scheduled execution is a named post-approval release check.
- **Defense in depth**: every inquiry submission opportunistically triggers a retry of
  pending notifications as a side effect of ordinary traffic, independent of any
  scheduler.
- **Retired in this PR**: `.github/workflows/booking-notification-retry.yml` — merged
  into this branch specifically so its removal takes effect when this PR merges. It
  was empirically unreliable (7 runs total observed, gaps of several hours) and is
  fully superseded by native Cron.
- **cron-job.org**: retirement could not be completed by Magica. There is no connected
  API/integration available for that service in this environment, and reaching its
  dashboard would require signing into an account Magica has no credentials for —
  which is explicitly outside what Magica will attempt (no password entry, no
  credential requests). This is a specific access block, not a task left for John to
  troubleshoot: if John wants that job deleted, it requires him (or someone with
  dashboard access) to remove it; otherwise it can simply be left disabled/idle, since
  it is no longer referenced by anything in this codebase.

## Preview service activation (unchanged from original inquiry-only scope, still accurate)

Use an isolated Neon PostgreSQL database and Resend with a verified sender. Do not
connect the production database. Configure server-only environment variables scoped
to the PR preview branch as before (`BOOKING_DATABASE_URL`, `RESEND_API_KEY`,
`BOOKING_EMAIL_FROM`, `BOOKING_RATE_LIMIT_SECRET`, `BOOKING_WORKER_SECRET`,
`BOOKING_INQUIRIES_ENABLED`), plus (added in this slice) `STRIPE_SECRET_KEY` (test
mode), `STRIPE_WEBHOOK_SECRET`, and `CRON_SECRET`.

1. Apply all pending files in `db/migrations/` to the preview database using
   `BOOKING_MIGRATION_CONFIRM=preview npm run booking:migrate` with credentials
   securely loaded into the process environment. Safe to re-run; it only applies
   migrations not already recorded in `pf2p_schema_migrations`.
2. Vercel native Cron now handles the 5-minute retry/expiry schedule once this reaches
   Production. Until then, rely on the on-traffic opportunistic retry described above.
3. `npm run booking:retry` remains available for an authenticated, on-demand bounded
   retry against the preview deployment.

## Release check (post-approval only — not part of this document's current scope)

After John's publish approval and production credential provisioning (a fresh,
isolated production database and fresh secrets — never copied from preview):

1. Deploy to Production and confirm both cron routes actually fire on schedule using
   Vercel's own cron invocation log.
2. Demonstrate notification recovery from a real backlog **without generating new
   visitor traffic** — i.e., confirm the scheduled job alone drains a pending
   notification, using the `pf2p_inquiries` / outbox records and Resend's delivery
   history as evidence, not just an accepted-count snapshot.

## Operational recovery

Unchanged from the original inquiry-only version of this document — authorized
operators can inspect the database directly; there is no public read API or new
unprotected admin page.

## Validation

`npm test` covers local, mocked-network behavior (PGlite, duplicate requests, payload
conflicts, persistence through restart, queued email failure, retry keys, expired
leases, rate limits, worker authentication). These are local tests, not proof of a
live provisioned service. Separately, sandbox concurrency tests (documented in the PR)
independently exercised real simultaneous requests against the deployed preview
build for the payment/reschedule concurrency guarantees described above.

Provider references: [Neon driver](https://github.com/neondatabase/serverless),
[Resend send API](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[Stripe idempotent requests](https://stripe.com/docs/api/idempotent_requests),
[Vercel Cron Jobs](https://vercel.com/docs/cron-jobs).

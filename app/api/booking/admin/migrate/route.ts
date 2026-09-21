import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { runPendingMigrations } from "@/lib/booking/migrations";

export const runtime = "nodejs";
export const maxDuration = 60;

// One-time, idempotent, authenticated migration trigger. Mirrors the same
// worker/cron bearer-token pattern already used by expire-holds and
// notifications/retry. Safe to call repeatedly; each migration is applied at
// most once, tracked in pf2p_schema_migrations. Runs against whichever
// database BOOKING_DATABASE_URL resolves to in the environment that receives
// the request (preview token only works on preview, production token only on
// production) -- there is no separate confirmation parameter because the
// worker secret itself scopes the target.
function authorized(request: Request): boolean {
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const workerSecret = process.env.BOOKING_WORKER_SECRET;
  if (workerSecret) {
    const expectedWorker = Buffer.from(`Bearer ${workerSecret}`);
    if (provided.length === expectedWorker.length && timingSafeEqual(provided, expectedWorker)) return true;
  }
  return false;
}

async function run() {
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const results = await runPendingMigrations(providers.query);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

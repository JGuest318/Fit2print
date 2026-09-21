import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { expireStaleHolds } from "@/lib/booking/bookings";

export const runtime = "nodejs";
export const maxDuration = 30;

function authorized(request: Request): boolean {
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const workerSecret = process.env.BOOKING_WORKER_SECRET;
  if (workerSecret) {
    const expectedWorker = Buffer.from(`Bearer ${workerSecret}`);
    if (provided.length === expectedWorker.length && timingSafeEqual(provided, expectedWorker)) return true;
  }
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const expectedCron = Buffer.from(`Bearer ${cronSecret}`);
    if (provided.length === expectedCron.length && timingSafeEqual(provided, expectedCron)) return true;
  }
  return false;
}

async function run() {
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const expired = await expireStaleHolds(providers.query);
  return NextResponse.json({ expiredCount: expired.length }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

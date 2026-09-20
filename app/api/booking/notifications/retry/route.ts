import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { retryNotifications } from "@/lib/booking/inquiries";

export const runtime = "nodejs";
export const maxDuration = 120;

function authorized(request: Request): boolean {
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const workerSecret = process.env.BOOKING_WORKER_SECRET;
  if (workerSecret) {
    const expectedWorker = Buffer.from(`Bearer ${workerSecret}`);
    if (provided.length === expectedWorker.length && timingSafeEqual(provided, expectedWorker)) return true;
  }
  // Vercel's native Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
  // and only invokes GET, and only for production deployments — this is the reliable
  // scheduled path once production is activated.
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
  try {
    const counts = await retryNotifications(providers.query, providers.send);
    return NextResponse.json({ counts }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Retry failed" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

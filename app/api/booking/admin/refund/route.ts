import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { recordRefund, listRefunds, RefundStatus } from "@/lib/booking/payments";

export const runtime = "nodejs";
export const maxDuration = 30;

const VALID_STATUSES: RefundStatus[] = ["pending", "completed", "failed"];

function authorized(request: Request) {
  const secret = process.env.BOOKING_WORKER_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return Boolean(secret) && provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { bookingId?: string; amountCents?: number; reason?: string; status?: string; reference?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const status = (body.status || "pending") as RefundStatus;
  if (!body.bookingId || typeof body.amountCents !== "number" || body.amountCents <= 0 || !body.reason || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "bookingId, amountCents (positive integer cents), reason, and status ('pending'|'completed'|'failed') are required" }, { status: 400 });
  }
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  await recordRefund(providers.query, body.bookingId, body.amountCents, body.reason, status, body.reference || null);
  const history = await listRefunds(providers.query, body.bookingId);
  return NextResponse.json({ success: true, refundHistory: history }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bookingId = new URL(request.url).searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ error: "bookingId query param is required" }, { status: 400 });
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const history = await listRefunds(providers.query, bookingId);
  return NextResponse.json({ refundHistory: history }, { headers: { "Cache-Control": "no-store" } });
}

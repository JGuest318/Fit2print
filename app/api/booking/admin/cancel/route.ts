import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { cancelBooking } from "@/lib/booking/bookings";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const secret = process.env.BOOKING_WORKER_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { bookingId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.bookingId) return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  await cancelBooking(providers.query, body.bookingId, body.reason || "owner_cancelled");
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}

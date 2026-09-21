import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { rescheduleBooking, RescheduleTargetUnavailable } from "@/lib/booking/bookings";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const secret = process.env.BOOKING_WORKER_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { bookingId?: string; newSessionDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.bookingId || !body.newSessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.newSessionDate)) {
    return NextResponse.json({ error: "bookingId and newSessionDate (YYYY-MM-DD) are required" }, { status: 400 });
  }
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  try {
    const result = await rescheduleBooking(providers.query, body.bookingId, body.newSessionDate);
    return NextResponse.json({ success: true, newBookingId: result.newBookingId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RescheduleTargetUnavailable) {
      return NextResponse.json({ error: "The original booking isn't eligible to reschedule, or the new date isn't open/available." }, { status: 409 });
    }
    return NextResponse.json({ error: "Reschedule failed" }, { status: 500 });
  }
}

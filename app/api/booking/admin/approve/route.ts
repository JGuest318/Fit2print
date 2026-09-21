import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { approveBooking, DateUnavailable } from "@/lib/booking/bookings";

export const runtime = "nodejs";
export const maxDuration = 30;

function authorized(request: Request) {
  const secret = process.env.BOOKING_WORKER_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return Boolean(secret) && provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { inquiryId?: string; sessionDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { inquiryId, sessionDate } = body;
  if (!inquiryId || !sessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    return NextResponse.json({ error: "inquiryId and sessionDate (YYYY-MM-DD) are required" }, { status: 400 });
  }
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  try {
    const booking = await approveBooking(providers.query, inquiryId, sessionDate);
    return NextResponse.json(
      {
        success: true,
        bookingId: booking.id,
        holdExpiresAt: booking.hold_expires_at,
        retainerPayLink: `/api/booking/pay/retainer/${booking.id}`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof DateUnavailable) {
      return NextResponse.json({ error: "Date is not open or is already held/booked" }, { status: 409 });
    }
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}

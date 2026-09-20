import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { recordAgreementAcceptance, AgreementNotAcceptable, getBooking, BookingNotFound } from "@/lib/booking/bookings";
import { AGREEMENT_VERSION, agreementTextHash } from "@/lib/booking/agreement";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  let body: { agree?: boolean; promoUsePermission?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  try {
    await getBooking(providers.query, bookingId);
  } catch (error) {
    if (error instanceof BookingNotFound) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  try {
    await recordAgreementAcceptance(
      providers.query,
      bookingId,
      body.agree === true,
      body.promoUsePermission === true,
      AGREEMENT_VERSION,
      agreementTextHash(),
    );
    return NextResponse.json({ success: true, retainerPayLink: `/api/booking/pay/retainer/${bookingId}` }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AgreementNotAcceptable) {
      return NextResponse.json(
        { error: "You must check 'I agree to the terms above' to continue, and this reservation must still be active and not already accepted." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not record agreement" }, { status: 500 });
  }
}

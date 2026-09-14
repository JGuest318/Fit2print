import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const phone = clean(body.phone, 40);
  const requestedDate = clean(body.requestedDate, 20);
  const sessionIntent = clean(body.sessionIntent, 1000);
  const comfortNotes = clean(body.comfortNotes, 1000);
  const acknowledgement = body.acknowledgement === "accepted";

  if (!name || !email || !phone || !requestedDate || !sessionIntent || !acknowledgement) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    return NextResponse.json({ error: "Please choose a valid session date." }, { status: 400 });
  }

  // V1 safety boundary: this endpoint records an inquiry event only. It deliberately
  // does not create a CONFIRMED booking, reserve calendar inventory, or take payment.
  // Persistence + owner notification are connected before this branch can be production-ready.
  console.log("Bespoke booking request", {
    event: "booking.requested",
    service: "PF2P_BESPOKE_EXPERIENCE",
    price: 99500,
    reservationRetainer: 30000,
    balanceDueOnSessionDate: 69500,
    bookingStatus: "INQUIRY",
    paymentStatus: "UNPAID",
    customer: { name, email, phone },
    requestedSessionDate: requestedDate,
    sessionIntent,
    comfortNotes,
    termsAcknowledged: true,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, bookingStatus: "INQUIRY", paymentStatus: "UNPAID" });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

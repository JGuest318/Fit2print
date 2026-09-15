import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const phone = clean(body.phone, 40);
  const requestedDate = clean(body.requestedDate, 20);
  const sessionIntent = clean(body.sessionIntent, 1000);
  const acknowledgement = body.acknowledgement === "accepted";

  if (!name || !email || !phone || !requestedDate || !sessionIntent || !acknowledgement) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const date = new Date(`${requestedDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ||
      !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== requestedDate) {
    return NextResponse.json({ error: "Please choose a valid session date." }, { status: 400 });
  }

  // Fail closed until durable inquiry storage and owner notification are connected.
  // Logging personal details is neither persistence nor delivery to the owner.
  // Do not acknowledge receipt, reserve a date, or take payment here.
  return NextResponse.json(
    { success: false, error: "Online inquiries are not available yet. Your request has not been saved, no date is reserved, and no payment has been taken." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

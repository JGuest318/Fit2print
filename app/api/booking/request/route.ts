import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getBookingProviders } from "@/lib/booking/providers";
import { deliverNotification, InquiryConflict, InquiryRateLimit, saveInquiry } from "@/lib/booking/inquiries";

export const runtime = "nodejs";
export const maxDuration = 60;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16384) {
        await reader.cancel();
        return NextResponse.json({ error: "Request is too large." }, { status: 413 });
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
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
  const comfortNotes = clean(body.comfortNotes, 1000);
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

  const id = request.headers.get("idempotency-key") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Please refresh the page and try again." }, { status: 400 });
  }
  try {
    const providers = getBookingProviders();
    if (!providers) return NextResponse.json(
      { success: false, error: "Online inquiries are not available yet. Your request has not been saved, no date is reserved, and no payment has been taken." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
    const bucket = createHmac("sha256", providers.rateSecret)
      .update(`${email.toLowerCase()}:${Math.floor(Date.now() / 3600000)}`).digest("hex");
    await saveInquiry(providers.query, id, {
      name, email, phone, requestedDate, sessionIntent, comfortNotes, acknowledgement: "accepted",
    }, providers.from, bucket);
    // Storage has committed. Email failure must not undo receipt or cause a new inquiry.
    try { await deliverNotification(providers.query, providers.send, id); } catch { /* durable outbox retries */ }
    return NextResponse.json({ success: true, inquiryId: id, bookingStatus: "INQUIRY", paymentStatus: "UNPAID" },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof InquiryConflict) return NextResponse.json(
      { error: "This request reference was already used for different details. Refresh the page before sending a new inquiry." }, { status: 409 });
    if (error instanceof InquiryRateLimit) return NextResponse.json(
      { error: "Too many inquiries. Please try again later." }, { status: 429, headers: { "Retry-After": "3600" } });
    return NextResponse.json({ success: false, error: "We could not confirm your request was saved. Please retry with the same details." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

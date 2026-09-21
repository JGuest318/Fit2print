import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { openAvailability, closeAvailability, listAvailability } from "@/lib/booking/bookings";

export const runtime = "nodejs";
export const maxDuration = 30;

function authorized(request: Request) {
  const secret = process.env.BOOKING_WORKER_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return Boolean(secret) && provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const rows = await listAvailability(providers.query);
  return NextResponse.json({ dates: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { sessionDate?: string; status?: "open" | "closed" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { sessionDate, status } = body;
  if (!sessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || (status !== "open" && status !== "closed")) {
    return NextResponse.json({ error: "sessionDate (YYYY-MM-DD) and status ('open'|'closed') are required" }, { status: 400 });
  }
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  if (status === "open") await openAvailability(providers.query, sessionDate);
  else await closeAvailability(providers.query, sessionDate);
  return NextResponse.json({ success: true, sessionDate, status }, { headers: { "Cache-Control": "no-store" } });
}

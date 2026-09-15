import { neon } from "@neondatabase/serverless";
import type { Query, Sender } from "./inquiries";

export function getBookingProviders() {
  const { BOOKING_DATABASE_URL, RESEND_API_KEY, BOOKING_EMAIL_FROM, BOOKING_RATE_LIMIT_SECRET,
    BOOKING_WORKER_SECRET, BOOKING_INQUIRIES_ENABLED } = process.env;
  if (BOOKING_INQUIRIES_ENABLED !== "true" || !BOOKING_DATABASE_URL || !RESEND_API_KEY ||
      !BOOKING_EMAIL_FROM || !BOOKING_RATE_LIMIT_SECRET || !BOOKING_WORKER_SECRET) return null;
  // Lazy initialization allows preview builds before service activation.
  const sql = neon(BOOKING_DATABASE_URL);
  const query: Query = async (text, params = []) => sql.query(text, params,
    { fetchOptions: { signal: AbortSignal.timeout(10000) } });
  const send: Sender = async (message, key) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    if (!response.ok || typeof result?.id !== "string" || !result.id) throw new Error("notification_failed");
    return result.id;
  };
  return { query, send, from: BOOKING_EMAIL_FROM, rateSecret: BOOKING_RATE_LIMIT_SECRET };
}

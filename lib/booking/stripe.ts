import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";

function formEncode(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.append(key, String(value));
  }
  return search.toString();
}

// Determines whether the configured Stripe secret key is a live or test key.
// Used to reject any webhook event whose livemode doesn't match our own
// environment (e.g. a stray live event should never touch preview data).
export function currentEnvironmentIsLive(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return key.startsWith("sk_live_");
}

export type CheckoutSession = { id: string; url: string; expiresAt: string; livemode: boolean; currency: string };

export async function createCheckoutSession(opts: {
  amountCents: number;
  productName: string;
  bookingId: string;
  paymentType: "retainer" | "balance";
  successUrl: string;
  cancelUrl: string;
  expiresInSeconds?: number;
}): Promise<CheckoutSession> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("stripe_not_configured");
  const body = formEncode({
    mode: "payment",
    // 'card' is the only method type requested. Apple Pay (and Google Pay) render
    // automatically as a wallet option within 'card' on supporting devices/browsers
    // — no separate parameter is needed or accepted by Checkout Sessions for this.
    "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": opts.amountCents,
    "line_items[0][price_data][product_data][name]": opts.productName,
    "line_items[0][quantity]": 1,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "metadata[booking_id]": opts.bookingId,
    "metadata[payment_type]": opts.paymentType,
    expires_at: Math.floor(Date.now() / 1000) + (opts.expiresInSeconds ?? 1800),
  });
  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || typeof result?.id !== "string" || typeof result?.url !== "string") {
    throw new Error("checkout_session_failed");
  }
  return {
    id: result.id,
    url: result.url,
    expiresAt: new Date(result.expires_at * 1000).toISOString(),
    livemode: Boolean(result.livemode),
    currency: String(result.currency || "usd"),
  };
}

export async function retrieveCheckoutSession(sessionId: string): Promise<{ id: string; payment_status: string; amount_total: number | null; currency: string | null; livemode: boolean } | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;
  const result = await response.json();
  return {
    id: result.id,
    payment_status: result.payment_status,
    amount_total: typeof result.amount_total === "number" ? result.amount_total : null,
    currency: result.currency ?? null,
    livemode: Boolean(result.livemode),
  };
}

// Verifies Stripe's webhook signature per their documented scheme, without the SDK.
// https://docs.stripe.com/webhooks#verify-manually
export function verifyStripeSignature(rawBody: string, signatureHeader: string | null, secret: string, toleranceSeconds = 300): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((pair) => {
      const [key, value] = pair.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(v1);
  return expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);
}

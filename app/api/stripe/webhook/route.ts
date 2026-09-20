import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { verifyStripeSignature } from "@/lib/booking/stripe";
import { confirmPaymentEvent } from "@/lib/booking/payments";

export const runtime = "nodejs";
export const maxDuration = 30;

type StripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
  data: {
    object: {
      id: string;
      payment_status?: string;
      amount_total?: number;
      currency?: string;
      metadata?: Record<string, string>;
    };
  };
};

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const providers = getBookingProviders();
  if (!webhookSecret || !providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;
  const paymentType = session.metadata?.payment_type;
  if (session.payment_status !== "paid" || (paymentType !== "retainer" && paymentType !== "balance")) {
    return NextResponse.json({ received: true, ignored: "not_a_completed_payment" });
  }

  // Atomic: the event-idempotency record and the booking/attempt credit rise or fall
  // together as ONE statement, and the full amount/currency/livemode/booking-state
  // validation happens inside that same statement before anything is credited.
  const outcome = await confirmPaymentEvent(providers.query, {
    eventId: event.id,
    eventType: event.type,
    checkoutSessionId: session.id,
    amountCents: session.amount_total ?? -1,
    currency: (session.currency ?? "").toLowerCase(),
    livemode: event.livemode,
    paymentType,
  });

  return NextResponse.json({ received: true, outcome });
}

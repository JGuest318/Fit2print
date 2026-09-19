import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { verifyStripeSignature } from "@/lib/booking/stripe";
import { recordStripeEventOnce, markRetainerPaid, markBalancePaid } from "@/lib/booking/bookings";

export const runtime = "nodejs";
export const maxDuration = 30;

type StripeEvent = {
  id: string;
  type: string;
  data: { object: { id: string; payment_status?: string; metadata?: Record<string, string> } };
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

  // Never process the same Stripe event twice, even across retried deliveries.
  const isNew = await recordStripeEventOnce(providers.query, event.id, event.type);
  if (!isNew) return NextResponse.json({ received: true, duplicate: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      const paymentType = session.metadata?.payment_type;
      if (paymentType === "retainer") await markRetainerPaid(providers.query, session.id);
      else if (paymentType === "balance") await markBalancePaid(providers.query, session.id);
    }
  }

  return NextResponse.json({ received: true });
}

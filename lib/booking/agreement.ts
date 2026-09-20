import { createHash } from "node:crypto";

// DRAFT WORDING — pending John's final review before production activation.
// Bump AGREEMENT_VERSION any time AGREEMENT_TEXT changes. The exact text hash is
// stored on the booking at acceptance time, so a later wording change can never
// retroactively alter what a past client is understood to have agreed to.
export const AGREEMENT_VERSION = "2026-09-20-draft-v1";

export const AGREEMENT_TEXT = `Photography Fit 2 Print — Bespoke Experience Agreement (${AGREEMENT_VERSION})

1. THE EXPERIENCE
The Bespoke Experience is a single intentionally prepared portrait session: a consultation, three distinct looks, and a carefully curated digital collection of 60 professionally finished, high-resolution JPEG files, along with three Platinum Edition numbered signature digital editions.

2. PRICE AND PAYMENT SCHEDULE
Total price: $995.
- $300 reservation retainer is due now to confirm this session date. Your date is held for a limited time and is not confirmed until this retainer is received.
- $695 remaining balance is due on the session date, before the session begins.
No card information is stored by Photography Fit 2 Print. Payments are processed by Stripe.

3. CANCELLATION AND RESCHEDULING (DRAFT — subject to owner confirmation)
- Rescheduling: one complimentary reschedule is permitted with at least 7 days' notice before the session date, subject to availability.
- Cancellation more than 7 days before the session date: the $300 retainer may be refunded at Photography Fit 2 Print's discretion, less any processing fees already incurred.
- Cancellation within 7 days of the session date, or a no-show: the $300 retainer is non-refundable.
- Photography Fit 2 Print reserves the right to reschedule due to illness, emergency, or conditions outside its control, in which case any retainer paid remains fully credited toward a new date.

4. PROMOTIONAL USE PERMISSION (SEPARATE, OPTIONAL)
Granting promotional use permission is entirely optional and is not required to book or complete this session. If granted, Photography Fit 2 Print may use resulting images from this session in its portfolio, website, and social media for promotional purposes. You may withdraw this permission at any time by written request; withdrawal does not affect any use that already occurred before the request.

5. ACKNOWLEDGEMENT
By checking "I agree to the terms above," you confirm you have read and agree to Sections 1–3 of this Agreement. Promotional use permission (Section 4) is a separate, independent choice recorded alongside this Agreement.`;

export function agreementTextHash(): string {
  return createHash("sha256").update(AGREEMENT_TEXT).digest("hex");
}

import { createHash, randomUUID } from "node:crypto";

export type Inquiry = {
  name: string; email: string; phone: string; requestedDate: string;
  sessionIntent: string; comfortNotes: string;
  acknowledgement: "accepted";
};
export type Query = (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
export type Notification = { from: string; to: string[]; subject: string; text: string; reply_to: string };
export type Sender = (message: Notification, key: string) => Promise<string>;

export class InquiryConflict extends Error {}
export class InquiryRateLimit extends Error {}

export function ownerMessage(id: string, inquiry: Inquiry, from: string): Notification {
  return {
    from, to: ["johng@phfit2print.com"], reply_to: inquiry.email,
    subject: `PF2P Bespoke inquiry ${id}`,
    text: [
      `Inquiry reference: ${id}`, "Status: INQUIRY / UNPAID. No date reserved or payment taken.",
      "Bespoke Experience: $995; $300 reservation retainer; $695 due on the session date.",
      "", `Name: ${inquiry.name}`, `Email: ${inquiry.email}`, `Phone: ${inquiry.phone}`,
      `Requested date (not confirmed): ${inquiry.requestedDate}`, "",
      "Creative intent:", inquiry.sessionIntent, "", "Comfort notes:", inquiry.comfortNotes || "None provided",
      "", "Next step: John reviews the inquiry and contacts the client about availability and the consultation.",
    ].join("\n"),
  };
}

// One row contains both the durable inquiry and its notification outbox.
// Repeated keys never overwrite previously accepted customer details.
export async function saveInquiry(query: Query, id: string, inquiry: Inquiry, from: string, bucket: string) {
  const payload = JSON.stringify(inquiry);
  const hash = createHash("sha256").update(payload).digest("hex");
  const existing = await query("SELECT payload_hash FROM pf2p_inquiries WHERE id = $1", [id]);
  if (existing.length) {
    if (existing[0].payload_hash !== hash) throw new InquiryConflict();
    return id;
  }
  const limit = await query(`INSERT INTO pf2p_inquiry_limits (bucket, expires_at)
    VALUES ($1, now() + interval '2 hours')
    ON CONFLICT (bucket) DO UPDATE SET attempts = pf2p_inquiry_limits.attempts + 1
    RETURNING attempts`, [bucket]);
  if (Number(limit[0].attempts) > 5) throw new InquiryRateLimit();
  const saved = await query(`INSERT INTO pf2p_inquiries (id, payload_hash, payload, notification)
    VALUES ($1, $2, $3::jsonb, $4::jsonb)
    ON CONFLICT (id) DO UPDATE SET id = pf2p_inquiries.id
    WHERE pf2p_inquiries.payload_hash = EXCLUDED.payload_hash
    RETURNING id`, [id, hash, payload, JSON.stringify(ownerMessage(id, inquiry, from))]);
  if (!saved.length) throw new InquiryConflict();
  return id;
}

export async function deliverNotification(query: Query, send: Sender, id: string) {
  // Stop before Resend's 24h deduplication window expires: uncertain sends need
  // owner review, not an automatic send that could duplicate a delivered email.
  await query(`UPDATE pf2p_inquiries SET notification_status = 'review', last_error = 'retry_window_expired'
    WHERE id = $1 AND notification_status IN ('pending', 'sending')
    AND first_attempt_at < now() - interval '23 hours'`, [id]);
  const token = randomUUID();
  const rows = await query(`UPDATE pf2p_inquiries SET notification_status = 'sending',
    lease_token = $2, lease_until = now() + interval '2 minutes',
    first_attempt_at = COALESCE(first_attempt_at, now()), notification_attempts = notification_attempts + 1
    WHERE id = $1 AND next_attempt_at <= now() AND
    (notification_status = 'pending' OR (notification_status = 'sending' AND lease_until < now()))
    RETURNING notification`, [id, token]);
  if (!rows.length) return;
  try {
    const messageId = await send(rows[0].notification as Notification, `pf2p-inquiry-${id}`);
    await query(`UPDATE pf2p_inquiries SET notification_status = 'accepted',
      provider_message_id = $3, lease_until = NULL, last_error = NULL
      WHERE id = $1 AND lease_token = $2`, [id, token, messageId]);
  } catch {
    // Do not log provider responses or customer data. If this update also fails,
    // the expired lease makes the saved outbox row available to the next worker.
    await query(`UPDATE pf2p_inquiries SET notification_status = 'pending',
      next_attempt_at = now() + interval '5 minutes', lease_until = NULL,
      last_error = 'notification_attempt_failed' WHERE id = $1 AND lease_token = $2`, [id, token]);
  }
}

export async function retryNotifications(query: Query, send: Sender) {
  const rows = await query(`SELECT id FROM pf2p_inquiries
    WHERE (notification_status = 'pending' OR (notification_status = 'sending' AND lease_until < now()))
    AND next_attempt_at <= now() ORDER BY created_at LIMIT 3`);
  for (const row of rows) await deliverNotification(query, send, String(row.id));
  await query("DELETE FROM pf2p_inquiry_limits WHERE expires_at < now()");
  const counts = await query(`SELECT notification_status AS status, count(*)::int AS count
    FROM pf2p_inquiries GROUP BY notification_status`);
  return counts;
}

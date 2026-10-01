import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getLandingDb } from "@/lib/server/landing-firestore";

/**
 * A daily cap on outbound waitlist email, shared by every server instance.
 *
 * The signup form is public and each signup sends mail from one Gmail account,
 * which Google throttles or suspends if it sends too much. So the number of
 * messages per UTC day is counted in one Firestore document in the landing
 * database (`mailQuota/{day}`) and checked inside a transaction. An instance
 * cannot send without reserving first, and two instances cannot both take the
 * last slot.
 *
 * Reserved before sending, whether or not the SMTP call then succeeds: Gmail
 * counts attempts too.
 *
 * The landing database only. Never `(default)` — getLandingDb refuses it.
 */

export const MAIL_QUOTA_COLLECTION = "mailQuota";

/** Gmail allows roughly 500 a day; stay well under it. Two messages per signup. */
const DEFAULT_DAILY_CAP = 300;

export type MailReservation =
  | { status: "reserved"; sentToday: number; cap: number }
  | { status: "cap-reached"; sentToday: number; cap: number }
  | { status: "unavailable" };

function dailyCap(): number {
  const configured = Number(process.env.WAITLIST_MAIL_DAILY_CAP);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DAILY_CAP;
}

/**
 * The counter's document ID: the UTC date. `WAITLIST_MAIL_QUOTA_SCOPE` prefixes
 * it so a test can use its own counter instead of today's real one; it is
 * never set in production.
 */
function counterId(now: Date): string {
  const scope = process.env.WAITLIST_MAIL_QUOTA_SCOPE?.trim();
  const day = now.toISOString().slice(0, 10);
  return scope ? `${scope}-${day}` : day;
}

/** Take `count` messages from today's allowance, or report that it is spent. */
export async function reserveMail(count: number, now = new Date()): Promise<MailReservation> {
  const landing = getLandingDb();
  if (!landing.ok) {
    if (landing.reason === "refused") throw new Error(landing.detail);
    return { status: "unavailable" };
  }

  const cap = dailyCap();
  const ref = landing.db.collection(MAIL_QUOTA_COLLECTION).doc(counterId(now));

  return landing.db.runTransaction(async (tx): Promise<MailReservation> => {
    const snap = await tx.get(ref);
    const sentToday = Number(snap.data()?.sent ?? 0);

    if (sentToday + count > cap) return { status: "cap-reached", sentToday, cap };

    tx.set(
      ref,
      { sent: FieldValue.increment(count), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return { status: "reserved", sentToday: sentToday + count, cap };
  });
}

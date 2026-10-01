import type { NextRequest } from "next/server";

import { clientKey, createRateLimiter } from "@/lib/server/rate-limit";
import { addWaitlistPhone } from "@/lib/server/waitlist-store";
import {
  PHONE_CONSENT_MESSAGE,
  PHONE_INVALID_MESSAGE,
  normalizeEmail,
  normalizePhone,
  type WaitlistPhoneResponse,
} from "@/lib/waitlist";

/**
 * POST /api/waitlist/phone — { email, phoneNumber, smsConsent } -> { ok } | { ok, error }
 *
 * Step 2 of the waitlist: the visitor who has just signed up may add a mobile
 * number and agree to texts. Collects and stores them on the existing
 * `waitlist/{email}` record, nothing more — no text is sent from here and no
 * SMS provider is involved.
 *
 * Writes go through the Admin SDK on the server, like the signup; the browser
 * still has no Firestore access. Whether the record exists, is too old or
 * already has a number is never revealed: all of it answers the same way.
 */

const MAX_BODY_BYTES = 2_000;

/* Five attempts per visitor per ten minutes, separate from the signup's. */
const isRateLimited = createRateLimiter(5, 10 * 60 * 1000);

function reply(body: WaitlistPhoneResponse, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request), Date.now())) {
    return reply(
      { ok: false, error: "Too many attempts. Please try again in a few minutes." },
      429,
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return reply({ ok: false, error: "That request was too large." }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return reply({ ok: false, error: "Something went wrong. Please try again." }, 400);
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return reply({ ok: false, error: "Something went wrong. Please try again." }, 400);
  }

  const phoneNumber = normalizePhone(body.phoneNumber);
  if (!phoneNumber) {
    return reply({ ok: false, error: PHONE_INVALID_MESSAGE }, 400);
  }

  if (body.smsConsent !== true) {
    return reply({ ok: false, error: PHONE_CONSENT_MESSAGE }, 400);
  }

  let result;
  try {
    result = await addWaitlistPhone({ email, phoneNumber });
  } catch (error) {
    console.error(`[waitlist] Phone update failed for ${email}.`, error);
    return reply(
      { ok: false, error: "We couldn't save your number just now. Please try again." },
      502,
    );
  }

  if (result !== "saved") {
    // Same words whatever the reason, and a reassurance, because the visitor
    // is on the list either way.
    return reply(
      { ok: false, error: "We couldn't add that number. You're still on the list." },
      409,
    );
  }

  return reply({ ok: true });
}

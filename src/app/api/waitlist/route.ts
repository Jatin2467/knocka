import type { NextRequest } from "next/server";

import { reserveMail } from "@/lib/server/mail-quota";
import { clientKey, createRateLimiter } from "@/lib/server/rate-limit";
import {
  describeMailError,
  getMailConfig,
  sendWaitlistEmails,
} from "@/lib/server/waitlist-mail";
import { saveWaitlistSignup } from "@/lib/server/waitlist-store";
import {
  isWaitlistSource,
  normalizeEmail,
  type WaitlistResponse,
} from "@/lib/waitlist";

/**
 * POST /api/waitlist — { email, source, company? } -> { ok, offerPhone? } | { ok, error }
 *
 * Checks run cheapest first: rate limit, body size, honeypot, address, mail
 * settings, then the record, and only then any email. Error messages are
 * written for the visitor, because the form shows them as they are; the detail
 * a developer needs goes to the server log instead.
 *
 *  - new address: the record is created, then the owner is notified and the
 *    visitor is sent a confirmation (two messages, taken from the shared daily
 *    cap first). `offerPhone` lets the form go on to step 2.
 *  - address already on the list: `{ ok: true }`, nothing written, no email.
 *  - daily mail cap spent: the record is still saved, no email goes out.
 *
 * Runs on the Node.js runtime, the default — Nodemailer needs raw sockets.
 */

const MAX_BODY_BYTES = 2_000;

/** Owner notification + visitor confirmation. */
const MESSAGES_PER_SIGNUP = 2;

const PAUSED: WaitlistResponse = {
  ok: false,
  error: "Signups are paused for a moment. Please try again later.",
};

/* Five attempts per visitor per ten minutes (see lib/server/rate-limit.ts). */
const isRateLimited = createRateLimiter(5, 10 * 60 * 1000);

/*
  A ceiling on the whole route, whoever is asking. The per-visitor limit is only
  as good as the identity behind it, so this bounds the damage if an identity
  ever turns out to be forgeable. Per instance, and far above real traffic.
*/
const isOverloaded = createRateLimiter(300, 10 * 60 * 1000);

function reply(body: WaitlistResponse, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: NextRequest) {
  const now = Date.now();
  if (isRateLimited(clientKey(request), now) || isOverloaded("all", now)) {
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

  // Honeypot filled: answer exactly like a success so the bot learns
  // nothing, and send nothing.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return reply({ ok: true });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return reply({ ok: false, error: "Please enter a valid email address." }, 400);
  }
  const source = isWaitlistSource(body.source) ? body.source : "newsletter";

  const settings = getMailConfig();
  if (!settings.ok) {
    console.error(
      `[waitlist] Not configured — missing ${settings.missing.join(", ")}. See .env.example.`,
    );
    return reply(PAUSED, 503);
  }

  const userAgent = request.headers.get("user-agent");
  const signup = { email, source, userAgent, at: new Date() };

  // The record comes first, because it decides everything after it: a repeat
  // of an address on the list must not cost another email.
  let stored: Awaited<ReturnType<typeof saveWaitlistSignup>>;
  try {
    stored = await saveWaitlistSignup({ email, source, userAgent });
  } catch (error) {
    console.error(`[waitlist] Firestore write failed for ${email}.`, error);
    return reply(
      { ok: false, error: "We couldn't add you just now. Please try again in a minute." },
      502,
    );
  }

  // Already on the list: same friendly answer, no record, no email at all.
  if (stored === "duplicate") return reply({ ok: true });

  if (stored === "skipped") {
    // No database configured. Fine on a laptop, where the email is the only
    // record; in production it means a misconfiguration, and without the
    // database there is no duplicate check and no shared mail cap, so send
    // nothing rather than open the form up.
    if (process.env.NODE_ENV === "production") {
      console.error("[waitlist] FIRESTORE_DATABASE_ID is not set; signups are paused.");
      return reply(PAUSED, 503);
    }
    try {
      await sendWaitlistEmails(settings.config, signup);
    } catch (error) {
      console.error(`[waitlist] Email failed for ${email}. ${describeMailError(error)}`);
      return reply(
        { ok: false, error: "We couldn't add you just now. Please try again in a minute." },
        502,
      );
    }
    return reply({ ok: true });
  }

  // A new record. It is saved whatever happens to the mail, so from here on
  // the visitor succeeds; mail trouble is logged, not shown.
  try {
    const slot = await reserveMail(MESSAGES_PER_SIGNUP);
    if (slot.status === "reserved") {
      await sendWaitlistEmails(settings.config, signup);
    } else {
      console.error(
        slot.status === "cap-reached"
          ? `[waitlist] Daily mail cap reached (${slot.sentToday}/${slot.cap}); no email sent for ${email}. The signup is saved.`
          : `[waitlist] Mail quota unavailable; no email sent for ${email}. The signup is saved.`,
      );
    }
  } catch (error) {
    console.error(`[waitlist] Email failed for ${email}. ${describeMailError(error)}`);
  }

  return reply({ ok: true, offerPhone: true });
}

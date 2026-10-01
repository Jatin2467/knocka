import type { NextRequest } from "next/server";

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
 * POST /api/waitlist — { email, source, company? } -> { ok } | { ok, error }
 *
 * Checks run cheapest first: rate limit, body size, honeypot, address, mail
 * settings, and only then the SMTP round trip. Error messages are written for
 * the visitor, because the form shows them as they are; the detail a
 * developer needs goes to the server log instead.
 *
 * Runs on the Node.js runtime, the default — Nodemailer needs raw sockets.
 */

const MAX_BODY_BYTES = 2_000;

/* Five attempts per visitor per ten minutes (see lib/server/rate-limit.ts). */
const isRateLimited = createRateLimiter(5, 10 * 60 * 1000);

function reply(body: WaitlistResponse, status = 200) {
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
    return reply(
      { ok: false, error: "Signups are paused for a moment. Please try again later." },
      503,
    );
  }

  const userAgent = request.headers.get("user-agent");

  // Email and database in parallel. The signup counts if EITHER recorded it:
  // the owner's email and the Firestore document are each a complete record.
  // Only when both fail is the visitor asked to try again.
  const [mail, store] = await Promise.allSettled([
    sendWaitlistEmails(settings.config, { email, source, userAgent, at: new Date() }),
    saveWaitlistSignup({ email, source, userAgent }),
  ]);

  // Each message's own outcome is logged by the mailer; this is the owner
  // notification failing, which is the one that fails the whole send.
  if (mail.status === "rejected") {
    console.error(`[waitlist] Email failed for ${email}. ${describeMailError(mail.reason)}`);
  }
  if (store.status === "rejected") {
    console.error(`[waitlist] Firestore write failed for ${email}.`, store.reason);
  }

  const emailed = mail.status === "fulfilled";
  const stored = store.status === "fulfilled" && store.value !== "skipped";

  if (!emailed && !stored) {
    return reply(
      { ok: false, error: "We couldn't add you just now. Please try again in a minute." },
      502,
    );
  }

  // Only a brand-new record may go on to add a mobile number (step 2).
  const isNew = store.status === "fulfilled" && store.value === "saved";
  return reply(isNew ? { ok: true, offerPhone: true } : { ok: true });
}

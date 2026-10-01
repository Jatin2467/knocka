/**
 * The waitlist contract, shared by the form (client) and the route handler
 * (server). Nothing in here touches the environment or sends anything, so it
 * is safe on both sides; the mailer lives in lib/server/waitlist-mail.ts.
 */

/** Where on the page the signup came from. Shown in the owner's email. */
export const WAITLIST_SOURCES = ["newsletter", "footer"] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export interface WaitlistRequest {
  email: string;
  source: WaitlistSource;
  /**
   * Honeypot. Rendered off-screen, so people never fill it and form-filling
   * bots usually do. Anything in it and the request is quietly dropped.
   */
  company?: string;
}

export type WaitlistResponse =
  | {
      ok: true;
      /**
       * True only for a brand-new signup, which is the only one that may add
       * a mobile number (step 2). A repeat of an address already on the list
       * answers plain `{ ok: true }`.
       */
      offerPhone?: boolean;
    }
  | { ok: false; error: string };

/** Step 2: add a mobile number and SMS consent to the signup just made. */
export interface WaitlistPhoneRequest {
  email: string;
  /** As typed, in the picked country's own format (or with its own + code). */
  phoneNumber: string;
  /** ISO 3166-1 alpha-2 code of the picked country, e.g. "US". */
  phoneCountry: string;
  /** The checkbox. Must be exactly `true`. */
  smsConsent: boolean;
}

export type WaitlistPhoneResponse = { ok: true } | { ok: false; error: string };

export const PHONE_INVALID_MESSAGE =
  "That doesn't look like a valid mobile number for the country you picked. Check it and try again.";
export const PHONE_CONSENT_MESSAGE =
  "Please tick the box to agree to receive texts.";

/** RFC 5321's limit on a whole address. */
const EMAIL_MAX_LENGTH = 254;

/*
  Deliberately permissive: one @, no whitespace, a dot in the domain. Stricter
  patterns reject real addresses; the real test of an address is whether the
  confirmation email arrives. The browser's own type="email" check runs first.
*/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** ASCII control characters (0-31 and DEL), which have no place in an address. */
function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

/**
 * Trim and lowercase an address, or return null if it is not one. Control
 * characters are rejected outright, so nothing that could break a mail header
 * ever reaches the mailer.
 */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > EMAIL_MAX_LENGTH) return null;
  if (hasControlCharacter(email)) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}

export function isWaitlistSource(value: unknown): value is WaitlistSource {
  return (WAITLIST_SOURCES as readonly unknown[]).includes(value);
}

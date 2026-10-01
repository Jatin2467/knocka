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
  phoneNumber: string;
  /** The checkbox. Must be exactly `true`. */
  smsConsent: boolean;
}

export type WaitlistPhoneResponse = { ok: true } | { ok: false; error: string };

export const PHONE_INVALID_MESSAGE =
  "Please enter a valid mobile number, like (201) 555-0123, or start with + and your country code.";
export const PHONE_CONSENT_MESSAGE =
  "Please tick the box to agree to receive texts.";

/**
 * Normalise a mobile number to E.164 (`+15551234567`), or return null.
 *
 * Without a phone-number library, so only what can be decided safely:
 *  - a leading `+` means the visitor gave the country code: 8 to 15 digits,
 *    the first not 0 (E.164's own limits);
 *  - otherwise it is a North American number: 10 digits, or 11 with a leading
 *    1, where the area code and exchange both start with 2-9.
 * Spaces, dashes, dots and brackets are ignored. Anything else is rejected,
 * which also keeps letters and control characters out of the database.
 */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (raw.length === 0 || raw.length > 32) return null;
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;

  const digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) {
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }

  const national =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(national) ? `+1${national}` : null;
}

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

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
  /** The code from the friend's referral link this visitor arrived with, if any. */
  ref?: string;
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
      /**
       * The new signup's own referral code, sent with `offerPhone`.
       * Friends who join through `referralLink(origin, code)` count for them.
       */
      referralCode?: string;
    }
  | { ok: false; error: string };

/** Step 2: add a mobile number and SMS consent to the signup just made. */
export interface WaitlistPhoneRequest {
  email: string;
  /** As typed, in the picked country's own format (or with its own + code). */
  phoneNumber: string;
  /** ISO 3166-1 alpha-2 code of the picked country, e.g. "US". */
  phoneCountry: string;
  /**
   * The SMS checkbox. Optional and separate from the number: a number saved
   * without it is stored with `smsOptIn: false` and must never be texted.
   */
  smsConsent: boolean;
}

export type WaitlistPhoneResponse = { ok: true } | { ok: false; error: string };

export const PHONE_INVALID_MESSAGE =
  "That doesn't look like a valid mobile number for the country you picked. Check it and try again.";

/**
 * The SMS consent wording, exactly as the checkbox shows it. The server stores
 * this same string with every number, so each record says what was agreed to.
 * Changing it changes what new records say; old records keep their own copy.
 */
export const SMS_CONSENT_TEXT =
  "I agree to receive texts from Knocka. Message/data rates may apply. Reply STOP to opt out.";

/* ------------------------------------------------------------------ */
/*  Referrals                                                          */
/* ------------------------------------------------------------------ */

/**
 * Referral codes: 8 characters from an alphabet without look-alikes
 * (no 0/o, 1/i/l), so a code that is read aloud or retyped survives.
 */
export const REFERRAL_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_PATTERN = new RegExp(
  `^[${REFERRAL_ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`,
);

export function isReferralCode(value: unknown): value is string {
  return typeof value === "string" && REFERRAL_CODE_PATTERN.test(value);
}

/** `https://site/?ref=abcd2345`. `origin` has no trailing slash. */
export function referralLink(origin: string, code: string): string {
  return `${origin}/?ref=${code}`;
}

/** GET /api/waitlist/count. `count` stays null until the list is big enough to show. */
export interface WaitlistCountResponse {
  count: number | null;
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

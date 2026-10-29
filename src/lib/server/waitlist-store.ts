import "server-only";

import { randomInt } from "node:crypto";

import { FieldValue, type DocumentReference } from "firebase-admin/firestore";

import { getLandingDb } from "@/lib/server/landing-firestore";
import {
  REFERRAL_ALPHABET,
  REFERRAL_CODE_LENGTH,
  SMS_CONSENT_TEXT,
  type WaitlistSource,
} from "@/lib/waitlist";

/**
 * The waitlist, stored in the landing page's own Firestore database.
 *
 * `waitlist/{email}` — the normalised address is the document ID, so a second
 * signup with the same address cannot create a second record. Created with:
 * email, source, userAgent, createdAt, referralCode, referredBy, referralCount.
 *
 * `waitlistReferrals/{code}` — `{ email, createdAt }`, one per signup: the
 * lookup from a referral link's code to the person who shared it.
 */

export const WAITLIST_COLLECTION = "waitlist";
export const REFERRALS_COLLECTION = "waitlistReferrals";

export type StoreResult =
  | {
      status: "saved";
      referralCode: string;
      /** The address of whoever's link brought this signup, if it was credited. */
      referredBy: string | null;
    }
  | { status: "duplicate" }
  | { status: "skipped" };

/** Unbiased: `randomInt` draws each character uniformly from the alphabet. */
function newReferralCode(): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_ALPHABET[randomInt(REFERRAL_ALPHABET.length)];
  }
  return code;
}

/**
 * Create the record, its referral code and, when `ref` is a live code, credit
 * whoever shared it — all in one transaction, so a referrer's count can never
 * move without the signup that earned it. An unknown code is ignored, not an
 * error: the visitor still joins.
 */
export async function saveWaitlistSignup(signup: {
  email: string;
  source: WaitlistSource;
  userAgent: string | null;
  /** Already checked with `isReferralCode`. */
  ref: string | null;
}): Promise<StoreResult> {
  const landing = getLandingDb();

  if (!landing.ok) {
    if (landing.reason === "refused") {
      // Misconfiguration worth shouting about; never write to the wrong database.
      throw new Error(landing.detail);
    }
    return { status: "skipped" };
  }

  const { db } = landing;
  const waitlist = db.collection(WAITLIST_COLLECTION);
  const referrals = db.collection(REFERRALS_COLLECTION);
  const record = waitlist.doc(signup.email);
  // 31^8 codes; a collision fails the commit (the code document already
  // exists) and the visitor is asked to try again, rather than sharing a code.
  const referralCode = newReferralCode();

  return db.runTransaction(async (tx): Promise<StoreResult> => {
    // Every read comes before any write, as Firestore transactions require.
    if ((await tx.get(record)).exists) return { status: "duplicate" };

    let referrer: DocumentReference | null = null;
    if (signup.ref) {
      const owner = (await tx.get(referrals.doc(signup.ref))).get("email");
      if (typeof owner === "string" && owner !== signup.email) {
        const candidate = waitlist.doc(owner);
        // A deleted referrer would fail the update, and with it the signup.
        if ((await tx.get(candidate)).exists) referrer = candidate;
      }
    }

    tx.create(record, {
      email: signup.email,
      source: signup.source,
      userAgent: signup.userAgent?.slice(0, 300) ?? null,
      createdAt: FieldValue.serverTimestamp(),
      referralCode,
      referredBy: referrer ? signup.ref : null,
      referralCount: 0,
    });
    tx.create(referrals.doc(referralCode), {
      email: signup.email,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (referrer) tx.update(referrer, { referralCount: FieldValue.increment(1) });

    return { status: "saved", referralCode, referredBy: referrer?.id ?? null };
  });
}

/**
 * How many people are on the list, or null without a database. One
 * aggregation query: Firestore bills it as one read per 1,000 records, so the
 * caller caches it rather than asking per visitor.
 */
export async function countWaitlist(): Promise<number | null> {
  const landing = getLandingDb();
  if (!landing.ok) {
    if (landing.reason === "refused") throw new Error(landing.detail);
    return null;
  }
  const snapshot = await landing.db.collection(WAITLIST_COLLECTION).count().get();
  return snapshot.data().count;
}

/* ------------------------------------------------------------------ */
/*  Step 2: mobile number + SMS consent                               */
/* ------------------------------------------------------------------ */

/**
 * How long after signing up a visitor may still add a number. Step 2 follows
 * the signup within seconds; the window just stops a stranger who knows an
 * address from attaching a number to someone's old record.
 */
const PHONE_WINDOW_MS = 30 * 60 * 1000;

export type PhoneResult = "saved" | "not-eligible" | "skipped";

/**
 * Add the number to an existing record, with the SMS choice recorded beside
 * it rather than implied by it:
 *
 *  - `phoneNumber` (E.164), `phoneCountry` (ISO code), `phoneAddedAt`
 *  - `smsOptIn` — true only if the box was ticked; false numbers are never texted
 *  - `smsConsentText` — the wording the checkbox showed, ticked or not
 *  - `smsConsentAt` — when consent was given; written only when it was
 *
 * Times are the server's clock. Only these fields are written, so email,
 * source, userAgent, createdAt and the referral fields are never touched.
 * Allowed once, within the window, on a record that has no number yet;
 * anything else is "not-eligible" without saying why. The number is not
 * verified, and nothing here sends a text.
 */
export async function addWaitlistPhone(input: {
  email: string;
  phoneNumber: string;
  phoneCountry: string;
  smsOptIn: boolean;
}): Promise<PhoneResult> {
  const landing = getLandingDb();

  if (!landing.ok) {
    if (landing.reason === "refused") throw new Error(landing.detail);
    return "skipped";
  }

  const ref = landing.db.collection(WAITLIST_COLLECTION).doc(input.email);

  return landing.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!snap.exists || !data) return "not-eligible";
    if (data.phoneNumber) return "not-eligible";

    const createdAt = data.createdAt?.toMillis?.();
    if (typeof createdAt !== "number" || Date.now() - createdAt > PHONE_WINDOW_MS) {
      return "not-eligible";
    }

    tx.update(ref, {
      phoneNumber: input.phoneNumber,
      phoneCountry: input.phoneCountry,
      phoneAddedAt: FieldValue.serverTimestamp(),
      smsOptIn: input.smsOptIn,
      smsConsentText: SMS_CONSENT_TEXT,
      ...(input.smsOptIn ? { smsConsentAt: FieldValue.serverTimestamp() } : {}),
    });
    return "saved";
  });
}

import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getLandingDb } from "@/lib/server/landing-firestore";
import type { WaitlistSource } from "@/lib/waitlist";

/**
 * The waitlist, stored in the landing page's own Firestore database.
 *
 * `waitlist/{email}` — the normalised address is the document ID, so a second
 * signup with the same address cannot create a second record. Fields are
 * exactly: email, source, userAgent, createdAt.
 */

export const WAITLIST_COLLECTION = "waitlist";

/** gRPC status code for "document already exists". */
const ALREADY_EXISTS = 6;

export type StoreResult = "saved" | "duplicate" | "skipped";

export async function saveWaitlistSignup(signup: {
  email: string;
  source: WaitlistSource;
  userAgent: string | null;
}): Promise<StoreResult> {
  const landing = getLandingDb();

  if (!landing.ok) {
    if (landing.reason === "refused") {
      // Misconfiguration worth shouting about; never write to the wrong database.
      throw new Error(landing.detail);
    }
    return "skipped";
  }

  try {
    await landing.db
      .collection(WAITLIST_COLLECTION)
      .doc(signup.email)
      .create({
        email: signup.email,
        source: signup.source,
        userAgent: signup.userAgent?.slice(0, 300) ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });
    return "saved";
  } catch (error) {
    if ((error as { code?: number }).code === ALREADY_EXISTS) return "duplicate";
    throw error;
  }
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
 * Add `phoneNumber`, `smsOptIn` and `smsConsentAt` to an existing record.
 * Only those three fields are written, so email, source, userAgent and
 * createdAt are never touched. Allowed once, within the window, on a record
 * that has no number yet; anything else is "not-eligible" without saying why.
 * Nothing here sends a text.
 */
export async function addWaitlistPhone(input: {
  email: string;
  phoneNumber: string;
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
      smsOptIn: true,
      smsConsentAt: FieldValue.serverTimestamp(),
    });
    return "saved";
  });
}

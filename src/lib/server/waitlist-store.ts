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

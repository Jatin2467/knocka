import "server-only";

import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-side access to the landing page's OWN Firestore database.
 *
 * The Knocka project (knocka-75c63) has a (default) database that belongs to
 * the mobile apps. The website must never touch it, so this module refuses to
 * return a handle unless FIRESTORE_DATABASE_ID names a different, explicit
 * database. There is no fallback to (default), on purpose.
 *
 * Credentials: Application Default Credentials. On Firebase App Hosting
 * (Cloud Run) these are the backend's service account, so no key file or
 * secret exists. Locally, `gcloud auth application-default login` provides
 * them. A service-account JSON is never needed and never committed.
 *
 * The Admin SDK bypasses Firestore rules, so the rules for this database are
 * deny-all (firestore.landing.rules): the browser can never read or write it.
 */

/** A named app, so it can never collide with another default Firebase app. */
const APP_NAME = "knocka-landing-server";

export type LandingDb =
  | { ok: true; db: Firestore; databaseId: string }
  | { ok: false; reason: "not-configured" }
  | { ok: false; reason: "refused"; detail: string };

/** The one named Admin app for the whole site; Firestore and App Check both use it. */
export function getServerApp(): App {
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return existing;
  return initializeApp(
    {
      credential: applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    APP_NAME,
  );
}

/** Read per request, like the mail settings, so a missing value is reported where it matters. */
export function getLandingDb(): LandingDb {
  const databaseId = process.env.FIRESTORE_DATABASE_ID?.trim();
  if (!databaseId) return { ok: false, reason: "not-configured" };

  if (databaseId === "(default)" || databaseId === "default") {
    return {
      ok: false,
      reason: "refused",
      detail: "FIRESTORE_DATABASE_ID points at the mobile app's (default) database.",
    };
  }

  return { ok: true, db: getFirestore(getServerApp(), databaseId), databaseId };
}

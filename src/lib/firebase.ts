import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

/**
 * The Knocka Firebase project (knocka-75c63), shared with the mobile app.
 *
 * The values come from NEXT_PUBLIC_FIREBASE_* — see .env.example. They are
 * identifiers, not secrets: what protects the data is the Firestore rules.
 * Each is read as a literal property so Next can inline it for the browser.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** One app per process; hot reload and repeat calls reuse it. */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Google Analytics, browser only. It needs `window`, cookies and a supported
 * browser, so it is imported on demand and resolves to null anywhere else —
 * the server, a blocked tracker, a private window. Nothing calls this yet.
 */
export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(getFirebaseApp()) : null;
}

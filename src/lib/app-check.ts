import { getFirebaseApp } from "@/lib/firebase";

/**
 * Browser half of Firebase App Check: an invisible reCAPTCHA Enterprise check
 * that produces a token for our own API routes (sent as `X-Firebase-AppCheck`,
 * never in the URL or the body).
 *
 * LAZY, and only in the browser. Nothing here runs on the server or at page
 * load: App Check starts the first time a visitor touches a waitlist form, so
 * the page's weight and speed are unchanged for everyone who does not, and
 * there is no server-rendered difference to cause a hydration mismatch.
 *
 * Initialised once, on the existing Firebase app (lib/firebase.ts), with token
 * auto-refresh on. The token's lifetime is the default (1 hour).
 *
 * Local development: reCAPTCHA Enterprise attests real production domains, and
 * the key allows only the production one. On localhost the Firebase debug
 * provider is used instead: the SDK prints a one-off debug token to the
 * console, to be registered privately in the Firebase console. It is chosen by
 * hostname alone and has no effect on the live site.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;

type AppCheckInstance = import("firebase/app-check").AppCheck;

let instance: Promise<AppCheckInstance | null> | null = null;

function init(): Promise<AppCheckInstance | null> {
  if (typeof window === "undefined" || !SITE_KEY) return Promise.resolve(null);
  instance ??= (async () => {
    try {
      const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import("firebase/app-check");
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      return initializeAppCheck(getFirebaseApp(), {
        provider: new ReCaptchaEnterpriseProvider(SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch {
      return null;
    }
  })();
  return instance;
}

/** Start App Check in the background, so a token is ready by the time the form is submitted. */
export function warmAppCheck(): void {
  void init();
}

/**
 * A current App Check token, or null if one could not be obtained (blocked
 * script, no network, low score). The caller must then not send the request.
 * Nothing about the failure leaves this function.
 */
export async function getAppCheckToken(): Promise<string | null> {
  try {
    const appCheck = await init();
    if (!appCheck) return null;
    const { getToken } = await import("firebase/app-check");
    const { token } = await getToken(appCheck);
    return token || null;
  } catch {
    return null;
  }
}

/** The header every protected request carries. */
export const APP_CHECK_HEADER = "X-Firebase-AppCheck";

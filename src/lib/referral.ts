import { isReferralCode, referralLink } from "@/lib/waitlist";

/**
 * Browser side of referrals. Two codes, both kept in localStorage so they
 * survive a reload or a later visit:
 *
 *  - the friend's code this visitor arrived with (`?ref=` on the page), sent
 *    with their signup so the friend gets the credit;
 *  - this visitor's own code, once they have joined, so every share on the
 *    page (step 3 and the Share section) carries their link.
 *
 * Storage can be blocked or throw (private windows); everything here then
 * works for the current page only.
 */

const INCOMING_KEY = "knocka:ref";
const OWN_KEY = "knocka:myRef";
/** Same-tab signal; `storage` events only reach other tabs. */
const OWN_EVENT = "knocka:myref";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the code still works for this page.
  }
}

/**
 * The friend's code: the page's `?ref=` if it is a real code (remembered for
 * later), else the one remembered from an earlier visit. Never the visitor's
 * own code, which would only credit themselves.
 */
export function incomingReferral(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("ref")?.trim().toLowerCase();
  let code: string | null = null;
  if (isReferralCode(fromUrl)) {
    write(INCOMING_KEY, fromUrl);
    code = fromUrl;
  } else {
    const stored = read(INCOMING_KEY);
    code = isReferralCode(stored) ? stored : null;
  }
  return code && code !== ownReferral() ? code : null;
}

export function ownReferral(): string | null {
  const stored = read(OWN_KEY);
  return isReferralCode(stored) ? stored : null;
}

export function rememberOwnReferral(code: string) {
  write(OWN_KEY, code);
  window.dispatchEvent(new Event(OWN_EVENT));
}

/** For `useSyncExternalStore`: fires when the visitor's own code changes. */
export function subscribeOwnReferral(onChange: () => void) {
  window.addEventListener(OWN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(OWN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The visitor's invite link on this site, or the plain site address before they join. */
export function inviteUrl(code: string | null): string {
  const origin = window.location.origin;
  return code ? referralLink(origin, code) : `${origin}/`;
}

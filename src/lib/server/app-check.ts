import "server-only";

import { getAppCheck } from "firebase-admin/app-check";
import type { NextRequest } from "next/server";

import { getServerApp } from "@/lib/server/landing-firestore";

/**
 * Firebase App Check for the landing page's own API routes.
 *
 * This is the server half of: browser -> App Check (reCAPTCHA Enterprise,
 * invisible) -> token in the `X-Firebase-AppCheck` header -> verified here.
 * The Firebase documentation describes exactly this for custom backends.
 *
 * It protects ONLY /api/waitlist and /api/waitlist/phone. It is not Firebase's
 * per-product enforcement (Firestore, Auth, Storage, Realtime Database), which
 * stays off: that would apply to the mobile apps as well.
 *
 * `APP_CHECK_ENFORCE=true` rejects requests without a valid token. Anything
 * else is monitor mode: the verdict is logged and the request goes on. The
 * switch is server-side only; nothing in the browser can see or change it.
 *
 * The token is never logged, stored or returned, and neither is the reason a
 * verification failed beyond a short Firebase error code.
 */

export type AppCheckVerdict = "valid" | "missing" | "invalid";

const HEADER = "x-firebase-appcheck";

/** Replay protection (`consume`) is deliberately off: a normal verified token flow. */
async function verdictFor(request: NextRequest): Promise<{ verdict: AppCheckVerdict; code?: string }> {
  const token = request.headers.get(HEADER)?.trim();
  if (!token) return { verdict: "missing" };

  try {
    await getAppCheck(getServerApp()).verifyToken(token);
    return { verdict: "valid" };
  } catch (error) {
    // Only the SDK's short error code ("app-check/invalid-token", ...). Never
    // the message, which may quote the token.
    const code = (error as { code?: unknown })?.code;
    return { verdict: "invalid", code: typeof code === "string" ? code : "unknown" };
  }
}

export function appCheckEnforced(): boolean {
  return process.env.APP_CHECK_ENFORCE?.trim().toLowerCase() === "true";
}

/**
 * Run at the top of a route, after the request has been parsed. Returns the
 * response to send when the request must be refused, or null to carry on.
 * Valid token: carry on. Missing or invalid: logged, and refused only when
 * enforcing. The same generic 403 either way, so a caller learns nothing about
 * why.
 */
export async function appCheckGate(
  request: NextRequest,
  route: "waitlist" | "waitlist/phone",
): Promise<Response | null> {
  const { verdict, code } = await verdictFor(request);
  if (verdict === "valid") return null;

  const enforce = appCheckEnforced();
  console.warn(
    `[appcheck] route=${route} verdict=${verdict}${code ? ` code=${code}` : ""} enforce=${enforce}${enforce ? " refused" : " allowed"}`,
  );

  if (!enforce) return null;
  return Response.json(
    { ok: false, error: "We couldn't verify your browser. Please refresh the page and try again." },
    { status: 403 },
  );
}

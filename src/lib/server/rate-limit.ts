import "server-only";

import { isIP } from "node:net";

import type { NextRequest } from "next/server";

/*
  A fixed-window limit per key, kept in memory, so it is per server instance
  (App Hosting runs up to two): it slows a script hammering one process, it is
  not a distributed counter. The abuse that matters most — outbound email — is
  capped separately in Firestore, where every instance shares one counter (see
  mail-quota.ts), so this limiter is a first line, not the only one.

  One limiter per route, so the signup and the phone step do not spend each
  other's attempts.
*/
export function createRateLimiter(limit: number, windowMs: number) {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return function isRateLimited(key: string, now: number): boolean {
    // Drop expired windows so the map cannot grow without bound.
    if (attempts.size > 5_000) {
      for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
    }
    const entry = attempts.get(key);
    if (!entry || entry.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  };
}

/*
  WHO IS THE VISITOR?

  Never from X-Forwarded-For. Its leftmost entry is whatever the sender typed,
  and on App Hosting the rightmost is a proxy in front of Cloud Run, not the
  visitor. The previous limiter keyed on the leftmost entry, so sending a new
  value with each request gave every request a fresh allowance.

  On Firebase App Hosting the platform proxy reportedly sets `x-fah-client-ip`
  itself. That comes from a third-party write-up (Arcjet); it is NOT in
  Firebase's own documentation, so it is treated as an assumption to be tested
  on each deploy, not a fact. A header like that is only trustworthy when the
  platform is known to be in front, so it is read only when FIREBASE_CONFIG is
  set — the platform sets it at runtime, and nothing a visitor sends can.
  Anywhere else (a laptop, a plain Node host) no header is believed.

  If the header is missing or is not an IP, the visitor is "unidentified" and
  shares one bucket with every other unidentified visitor. That fails toward
  too strict, never toward unlimited.

  Whether the platform overwrites a forged `x-fah-client-ip` is verified after
  each deploy, not assumed — see docs/KNOCKA_LANDING_FIREBASE_SETUP.md.
*/
const PLATFORM_IP_HEADER = "x-fah-client-ip";

/** True when running behind Firebase App Hosting's proxy. */
function onAppHosting(): boolean {
  return Boolean(process.env.FIREBASE_CONFIG?.trim());
}

/** Expand an IPv6 address to its eight hextets, or null if it is not valid. */
function expandIpv6(address: string): string[] | null {
  if (isIP(address) !== 6) return null;
  const [head, tail] = address.split("::");
  const side = (part: string | undefined) => (part ? part.split(":") : []);
  const first = side(head);
  const last = side(tail);
  // An IPv4 tail (::ffff:1.2.3.4) counts as two hextets.
  const widen = (parts: string[]) =>
    parts.flatMap((p) => {
      if (!p.includes(".")) return [p];
      const [a, b, c, d] = p.split(".").map(Number);
      return [((a << 8) | b).toString(16), ((c << 8) | d).toString(16)];
    });
  const a = widen(first);
  const b = widen(last);
  const fill = address.includes("::") ? 8 - a.length - b.length : 0;
  const all = [...a, ...Array<string>(Math.max(fill, 0)).fill("0"), ...b];
  return all.length === 8 ? all.map((h) => h.padStart(4, "0")) : null;
}

/**
 * The limiter identity for a request. An IPv6 visitor is bucketed by its /64,
 * since one device or household can rotate through its whole /64 for free.
 */
export function clientKey(request: NextRequest): string {
  if (!onAppHosting()) return "local";

  const raw = request.headers.get(PLATFORM_IP_HEADER)?.trim();
  if (!raw) return "unidentified";

  const kind = isIP(raw);
  if (kind === 4) return `v4:${raw}`;
  if (kind === 6) {
    const hextets = expandIpv6(raw);
    if (hextets) return `v6:${hextets.slice(0, 4).join(":")}`;
  }
  return "unidentified";
}

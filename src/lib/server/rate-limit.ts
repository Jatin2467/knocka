import "server-only";

import type { NextRequest } from "next/server";

/*
  A fixed-window limit per key, kept in memory, so it is per server instance:
  it stops a script hammering one process, not a distributed attack. Behind
  several instances, move this to a shared store (Redis, Upstash) or the
  platform's own rate limiting.

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

/** The first hop in x-forwarded-for is the visitor; the rest are proxies. */
export function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

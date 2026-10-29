import { countWaitlist } from "@/lib/server/waitlist-store";
import type { WaitlistCountResponse } from "@/lib/waitlist";

/**
 * GET /api/waitlist/count -> { count } — "8,427 people are waiting to Knock."
 *
 * The number stays private (`count: null`) until the list reaches
 * WAITLIST_COUNTER_MIN (default 1,000), so a small early list is never put on
 * show. The threshold is checked here rather than in the browser, so the real
 * figure never leaves the server before then.
 *
 * Every visitor asks, so the answer is cached: five minutes in this instance,
 * and the same at App Hosting's CDN. A failure answers null and is not cached
 * for long, so the counter just stays hidden for a moment.
 */

const FRESH_MS = 5 * 60 * 1000;
const DEFAULT_MIN = 1_000;

let cached: { at: number; body: WaitlistCountResponse } | null = null;

function threshold(): number {
  const value = Number(process.env.WAITLIST_COUNTER_MIN?.trim());
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MIN;
}

function reply(body: WaitlistCountResponse, maxAge: number) {
  return Response.json(body, {
    headers: { "Cache-Control": `public, max-age=60, s-maxage=${maxAge}` },
  });
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.at < FRESH_MS) return reply(cached.body, 300);

  try {
    const count = await countWaitlist();
    const body = { count: count !== null && count >= threshold() ? count : null };
    cached = { at: now, body };
    return reply(body, 300);
  } catch (error) {
    console.error("[waitlist] Count failed.", error);
    return reply({ count: null }, 30);
  }
}

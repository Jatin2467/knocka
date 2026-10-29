"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import type { WaitlistCountResponse } from "@/lib/waitlist";

/**
 * "8,427 people are waiting to Knock."
 *
 * Renders nothing until /api/waitlist/count returns a number, which it only
 * does once the list passes WAITLIST_COUNTER_MIN — so a small early list is
 * never shown, and a failed request just leaves the line out. Fetched after
 * load rather than rendered on the server, so the page stays static.
 */
export function WaitlistCounter({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/waitlist/count", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: WaitlistCountResponse | null) => {
        if (typeof body?.count === "number") setCount(body.count);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (count === null) return null;

  return (
    <p
      className={cn(
        "m-0 inline-flex w-fit items-center gap-2.5 rounded-pill border border-[rgba(255,255,255,0.22)] bg-[rgba(9,6,18,0.28)] py-1.5 pr-4 pl-3 text-[13px] text-[rgba(255,255,255,0.86)] motion-safe:animate-[waitlist-counter-in_480ms_ease-out]",
        className,
      )}
    >
      <span aria-hidden="true" className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-[#4ade80] opacity-70 motion-safe:animate-ping" />
        <span className="relative h-2 w-2 rounded-full bg-[#4ade80]" />
      </span>
      <span>
        <strong className="font-semibold text-white tabular-nums">
          {count.toLocaleString("en-US")}
        </strong>{" "}
        {count === 1 ? "person is" : "people are"} waiting to Knock.
      </span>
    </p>
  );
}

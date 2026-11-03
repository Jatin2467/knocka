"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/cn";

/** What the pill says: the knock, then the joke's two answers. */
const LINES = ["Knock knock", "Who's there?", "Knocka. Soon."] as const;
/** Milliseconds each answer stays up before the next one. */
const BEATS = [1300, 2200] as const;
/** Two short buzzes, where the device has them: the knock itself. */
const KNOCK_PATTERN = [22, 90, 22];

/**
 * The page's one playful control. A tap sends two ripples out from the pill,
 * gives two short buzzes on phones that support it, and plays out the
 * knock-knock joke in the label.
 *
 * Every line is rendered at once, stacked in one grid cell, so the pill is
 * as wide as its longest line from the first paint and never changes size.
 * The visible lines are hidden from assistive tech; the button has a fixed
 * name and a polite live region carries the joke instead.
 *
 * The ripples are CSS. Under reduced motion they do not run at all, and the
 * label change is the whole response.
 */
export function KnockKnock({ className, style }: { className?: string; style?: CSSProperties }) {
  const [line, setLine] = useState(0);
  const [knocks, setKnocks] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const knock = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    setKnocks((n) => n + 1);
    setLine(1);
    // Only inside a real tap; Chrome refuses (and logs) any other call.
    if (navigator.userActivation?.isActive) navigator.vibrate?.(KNOCK_PATTERN);
    timers.current = [
      window.setTimeout(() => setLine(2), BEATS[0]),
      window.setTimeout(() => setLine(0), BEATS[0] + BEATS[1]),
    ];
  };

  return (
    <div className={cn("relative", className)} style={style}>
      <button type="button" onClick={knock} aria-label="Knock knock" className="cs-knock">
        <span className="cs-knock-led" aria-hidden="true" />
        <span className="grid" aria-hidden="true">
          {LINES.map((text, index) => (
            <span
              key={text}
              className="col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                opacity: index === line ? 1 : 0,
                transform: `translateY(${index === line ? 0 : index < line ? -6 : 6}px)`,
              }}
            >
              {text}
            </span>
          ))}
        </span>
        <span className="cs-knock-star" aria-hidden="true">
          ✦
        </span>
        {knocks > 0 && (
          // Keyed by the knock count, so each tap restarts both ripples.
          <span key={knocks} aria-hidden="true">
            <span className="cs-ripple" />
            <span className="cs-ripple cs-ripple--late" />
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {line === 0 ? "" : line === 1 ? "Who's there?" : "Knocka. Coming soon."}
      </span>
    </div>
  );
}

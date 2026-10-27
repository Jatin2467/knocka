"use client";

import { useState, type CSSProperties } from "react";

import { KNOCK_BEATS } from "@/components/sections/Arrival/score";
import {
  MUSIC_CONTROL_ATTR,
  startMusic,
  useMusicState,
} from "@/lib/background-music";

/** The gap between the two hits, which is the brand. Read, never redeclared. */
const BEAT_GAP = KNOCK_BEATS[1] - KNOCK_BEATS[0];

/**
 * "Knock to wake the vibe" — a knock of the visitor's own, under the title.
 *
 * Browsers only let a page play sound after a click, tap or key, so this
 * gives the visitor a reason to make one that belongs to the page: they knock,
 * two rings go out in the knock's own rhythm, and the music comes in with
 * them. `startMusic()` runs first and synchronously inside the click, so the
 * activation reaches `play()` intact; the rings are only the response.
 *
 * Optional and out of the way: it sits at the end of the head's own flow
 * (under the knock marks there was no room on a phone without touching the
 * cards), blocks nothing, and fades out in place as soon as there is nothing
 * left to wake — the music is playing, however it was started, or the
 * visitor has switched it off. The music toggle stays the control after that.
 */
export function KnockPrompt() {
  const state = useMusicState();
  const [knocks, setKnocks] = useState(0);
  const done = state !== "waiting";

  return (
    <button
      type="button"
      className="knock-prompt"
      {...{ [MUSIC_CONTROL_ATTR]: "" }}
      data-done={done || undefined}
      aria-hidden={done || undefined}
      tabIndex={done ? -1 : undefined}
      style={{ "--beat": `${BEAT_GAP}s` } as CSSProperties}
      onClick={() => {
        startMusic();
        setKnocks((count) => count + 1);
      }}
    >
      <span className="knock-prompt-body">
        {knocks > 0 && (
          // Keyed by the knock, so a second knock replays the rings.
          <span className="knock-prompt-rings" key={knocks} aria-hidden="true">
            <i />
            <i />
          </span>
        )}
        <span aria-hidden="true">✦</span>
        <span aria-live="polite">
          {knocks > 0 && state !== "waiting" ? "Vibe on" : "Knock to wake the vibe"}
        </span>
      </span>
    </button>
  );
}

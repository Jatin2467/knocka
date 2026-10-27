/**
 * Shared state for the page's one background track.
 *
 * `BackgroundMusic` (root layout) owns the single <audio> element and
 * registers its controls here; anything else on the page that wants to start
 * the music or reflect its state — the knock prompt in the opening section —
 * reads it through `useMusicState` and calls `startMusic` / `toggleMusic`.
 * No context provider, so nothing above the layout re-renders when it changes.
 *
 * - `waiting`      not started: the browser has not allowed sound yet, or the
 *                  visitor has not interacted yet
 * - `playing`      audible
 * - `held`         on, but paused for the film or a hidden tab; resumes itself
 * - `off`          the visitor switched it off (remembered across visits)
 * - `unavailable`  the file failed to load or cannot be decoded
 */
import { useSyncExternalStore } from "react";

export type MusicState = "waiting" | "playing" | "held" | "off" | "unavailable";

interface MusicControls {
  /** Must be called synchronously inside a click, tap or key handler. */
  start: () => void;
  toggle: () => void;
}

let state: MusicState = "waiting";
let controls: MusicControls | null = null;
const listeners = new Set<() => void>();

export function setMusicState(next: MusicState) {
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

export function registerMusicControls(next: MusicControls | null) {
  controls = next;
}

export function startMusic() {
  controls?.start();
}

export function toggleMusic() {
  controls?.toggle();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The server render, and the first client render, are always `waiting`. */
export function useMusicState(): MusicState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => "waiting",
  );
}

/** Marks an element whose own handler controls the music. */
export const MUSIC_CONTROL_ATTR = "data-music-control";

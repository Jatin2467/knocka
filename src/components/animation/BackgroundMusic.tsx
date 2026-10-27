"use client";

import { useEffect, useRef, useState } from "react";

import {
  MUSIC_CONTROL_ATTR,
  registerMusicControls,
  setMusicState,
  toggleMusic,
  useMusicState,
} from "@/lib/background-music";

/**
 * Bump the version whenever `public/music.mp3` is replaced. The file is
 * cached for a year (see next.config.ts), so the query string is what makes
 * browsers and the CDN fetch the new one.
 */
const SRC = "/music.mp3?v=2026-10-27";
const VOLUME = 0.35;
const FADE_MS = 1200;
/** localStorage: "off" once the visitor has switched the music off. */
const STORAGE_KEY = "knocka-music";

/*
  The events that grant user activation (HTML spec, "activation-triggering
  input event"): keydown, a mouse pointerdown, a touch or pen pointerup, and
  touchend. click follows both, so it is listened to as well. Scroll, wheel
  and touchstart never count in any browser, so they are not listened to:
  every attempt they made was a rejected play().
*/
const GESTURES = ["pointerdown", "pointerup", "touchend", "keydown", "click"] as const;

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

function readOff() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

function writeOff(off: boolean) {
  try {
    if (off) localStorage.setItem(STORAGE_KEY, "off");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the choice lasts for this visit only.
  }
}

/** True where downloading a soundtrack nobody asked for is a real cost. */
function isConstrained() {
  const connection = (navigator as Navigator & { connection?: NetworkInformation })
    .connection;
  return (
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  );
}

/**
 * One looping track for the whole page, paused while the Knocka film section
 * is on screen (the film has its own soundtrack) and while the tab is hidden.
 *
 * **Ready before the first tap.** Nothing about the music competes with the
 * first render: the <audio> has no `src` until the page has finished loading
 * and the browser is idle. Then it is given its `src` with `preload="auto"`,
 * so by the time the visitor taps, the start of the track is already
 * buffered and the tap only has to press play. Skipped under Save-Data or on
 * a 2G connection, where the file loads on the tap instead.
 *
 * **Sound needs a tap.** Browsers refuse audible playback before a click, tap
 * or key on the page, and nothing here tries to get around that. One
 * autoplay attempt is made when the file is prepared, unless the browser
 * says up front that it will refuse (`navigator.getAutoplayPolicy`); after
 * that, the first click, tap or key anywhere starts it, with `play()` called
 * synchronously inside that handler so the activation is not lost. The knock
 * prompt in the opening section is one such tap.
 *
 * The toggle shows what is actually happening: no sound until the music is
 * really playing, and a tap on it always does what its label says.
 */
export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const state = useMusicState();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    /** The visitor has music on: it plays whenever nothing holds it. */
    let wanted = false;
    let off = readOff();
    let failed = false;
    let inFilm = false;
    let starting = false;
    let fade = 0;
    let armed = false;
    let hinted = false;
    let hintTimer: number | undefined;

    const publish = () => {
      if (failed) setMusicState("unavailable");
      else if (off) setMusicState("off");
      else if (!audio.paused) setMusicState("playing");
      else if (wanted) setMusicState("held");
      else setMusicState("waiting");
    };

    /** Gives the element its source once; a second call is a no-op. */
    const load = () => {
      if (!audio.getAttribute("src")) audio.src = SRC;
    };

    const fadeTo = (target: number, then?: () => void) => {
      cancelAnimationFrame(fade);
      const from = audio.volume;
      const begin = performance.now();
      const step = () => {
        // performance.now(), not the frame timestamp: a frame can start
        // before `begin`, and a negative volume throws and ends the fade.
        const t = Math.min(1, Math.max(0, (performance.now() - begin) / FADE_MS));
        audio.volume = Math.min(1, Math.max(0, from + (target - from) * t));
        if (t < 1) fade = requestAnimationFrame(step);
        else then?.();
      };
      fade = requestAnimationFrame(step);
    };

    /**
     * Presses play if nothing holds the music. Synchronous up to the
     * `play()` call, so it keeps the user activation of the handler that
     * called it.
     */
    const play = () => {
      if (off || failed || inFilm || document.hidden) return publish();
      if (!audio.paused || starting) return;
      load();
      starting = true;
      cancelAnimationFrame(fade);
      audio.volume = 0;
      audio.play().then(
        () => {
          starting = false;
          wanted = true;
          disarm();
          fadeTo(VOLUME);
          if (!hinted) {
            // Show once where the control lives.
            hinted = true;
            setHint(true);
            hintTimer = window.setTimeout(() => setHint(false), 1600);
          }
          publish();
        },
        (error: unknown) => {
          starting = false;
          audio.volume = VOLUME;
          const name = error instanceof DOMException ? error.name : "";
          // NotAllowedError: no activation yet, so wait for one.
          // AbortError: paused (film, hidden tab) before it began; not a failure.
          if (name === "NotAllowedError") wanted = false;
          else if (name === "NotSupportedError") failed = true;
          publish();
        },
      );
    };

    const hold = () => {
      cancelAnimationFrame(fade);
      if (!audio.paused) audio.pause();
      publish();
    };

    const onGesture = (event: Event) => {
      if (wanted || off || failed) return;
      // The toggle and the knock prompt start the music themselves.
      if (event.target instanceof Element && event.target.closest(`[${MUSIC_CONTROL_ATTR}]`)) {
        return;
      }
      if (event instanceof PointerEvent) {
        const isMouse = event.pointerType === "mouse";
        if (event.type === "pointerdown" && !isMouse) return;
        if (event.type === "pointerup" && isMouse) return;
      }
      // Wanted even if the film holds it now: it starts once the film is
      // off screen, which the page's activation then allows.
      wanted = true;
      play();
    };

    function arm() {
      if (armed) return;
      armed = true;
      for (const type of GESTURES) window.addEventListener(type, onGesture, { passive: true });
    }

    function disarm() {
      if (!armed) return;
      armed = false;
      for (const type of GESTURES) window.removeEventListener(type, onGesture);
    }

    registerMusicControls({
      start: () => {
        if (off || failed) return;
        wanted = true;
        play();
      },
      toggle: () => {
        if (off || !wanted) {
          off = false;
          writeOff(false);
          wanted = true;
          play();
        } else {
          off = true;
          wanted = false;
          writeOff(true);
          disarm();
          fadeTo(0, () => {
            audio.pause();
            audio.volume = VOLUME;
          });
        }
        publish();
      },
    });

    const onError = () => {
      // Only a real source can fail; an element with no src yet has not tried.
      if (!audio.getAttribute("src")) return;
      failed = true;
      starting = false;
      disarm();
      publish();
    };
    audio.addEventListener("play", publish);
    audio.addEventListener("pause", publish);
    audio.addEventListener("error", onError);

    if (!off) arm();
    publish();

    /*
      Prepare once the page has loaded and the browser is idle, so the
      download never competes with the HTML, critical images or hydration.
    */
    let idle: number | undefined;
    let idleIsTimeout = false;
    const prepare = () => {
      if (off || isConstrained()) return;
      audio.preload = "auto";
      load();
      const policy = (
        navigator as Navigator & { getAutoplayPolicy?: (type: string) => string }
      ).getAutoplayPolicy?.("mediaelement");
      // "allowed-muted" is no use for music; "disallowed" would only reject.
      if (policy !== "disallowed" && policy !== "allowed-muted") play();
    };
    const schedule = () => {
      // Safari has no requestIdleCallback.
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(prepare, { timeout: 3000 });
      } else {
        idleIsTimeout = true;
        idle = window.setTimeout(prepare, 1500);
      }
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    const film = document.getElementById("film");
    const observer = film
      ? new IntersectionObserver(
          ([entry]) => {
            inFilm = entry.isIntersecting;
            if (inFilm) hold();
            else if (wanted) play();
          },
          { threshold: 0.05 },
        )
      : null;
    if (film) observer?.observe(film);

    const onVisibility = () => {
      if (document.hidden) hold();
      else if (wanted) play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disarm();
      registerMusicControls(null);
      window.removeEventListener("load", schedule);
      if (idle !== undefined) {
        if (idleIsTimeout) window.clearTimeout(idle);
        else window.cancelIdleCallback(idle);
      }
      window.clearTimeout(hintTimer);
      cancelAnimationFrame(fade);
      document.removeEventListener("visibilitychange", onVisibility);
      audio.removeEventListener("play", publish);
      audio.removeEventListener("pause", publish);
      audio.removeEventListener("error", onError);
      observer?.disconnect();
      audio.pause();
    };
  }, []);

  const on = state === "playing" || state === "held";

  return (
    <>
      {/* No src until the page is ready for it — see prepare() above. */}
      <audio ref={audioRef} loop preload="none" />
      {state !== "unavailable" && (
      <button
        type="button"
        {...{ [MUSIC_CONTROL_ATTR]: "" }}
        // Synchronous: the toggle's own click is the activation play() needs.
        onClick={toggleMusic}
        aria-label={on ? "Turn background music off" : "Turn background music on"}
        aria-pressed={on}
        data-hint={hint || undefined}
        className="music-toggle fixed bottom-4 left-4 z-50 grid size-10 place-items-center rounded-full border border-white/15 bg-[rgba(10,8,16,0.72)] text-white transition-colors hover:border-purple-300/50"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
          {!on && <path d="M3 3l18 18" />}
        </svg>
      </button>
      )}
    </>
  );
}

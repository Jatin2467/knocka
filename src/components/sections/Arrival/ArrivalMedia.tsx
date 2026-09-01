"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { arrivalMedia } from "@/lib/site-config";

export interface ArrivalMediaProps {
  /** True once the section is close enough to be worth downloading. */
  isArmed: boolean;
  /** True once scroll has reached the arrival beat and the frame is open. */
  isPlaying: boolean;
  /**
   * True when the section is rendering as a static composition. Reduced
   * motion never autoplays a video of someone knocking, so that path needs a
   * way to ask for it instead — the same control the blocked-sound path uses.
   */
  allowManualPlay?: boolean;
  /**
   * Fired the moment the arrival actually begins — the video's first frame,
   * not the scroll threshold that asked for it. The two knock marks are timed
   * from here, so they land on the video's real hits even if it took a moment
   * to start.
   */
  onPlaybackStart?: () => void;
}

/**
 * Whatever arrives in S2's frame.
 *
 * The section is built around a media *slot*, not a particular asset: the
 * frame's ratio, the beats and the knock timing all resolve from
 * `arrivalMedia`. It currently names the welcome video, which the client
 * asked for here, with sound.
 *
 * ## Sound, and why it is written this way
 *
 * **A browser will not autoplay audio without a prior user gesture, and
 * scrolling is not a gesture.** Chrome, Safari and Firefox all require real
 * activation — a click, a tap, a key — before an unmuted `play()` is allowed.
 * Since this fires on scroll, the honest options are to play silently, or to
 * try for sound and degrade well. This does the latter:
 *
 *   1. try unmuted;
 *   2. if the promise rejects, or the browser quietly mutes us anyway, fall
 *      back to muted playback so the arrival still happens;
 *   3. offer one button so the visitor can turn the knock on deliberately.
 *
 * Anyone who has already clicked anything on the page — the header CTA, a nav
 * link — gets step 1, because the activation is already banked.
 *
 * The `src` is withheld until the section is near, so the page never pays for
 * the download on first load, and it does not loop: an arrival that repeats
 * is not an arrival.
 */
export function ArrivalMedia({
  isArmed,
  isPlaying,
  allowManualPlay = false,
  onPlaybackStart,
}: ArrivalMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const isVideo = arrivalMedia.kind === "video";

  /** Reports the real start of playback exactly once per arrival. */
  const started = useRef(false);
  const announce = useCallback(() => {
    if (started.current) return;
    started.current = true;
    onPlaybackStart?.();
  }, [onPlaybackStart]);

  useEffect(() => {
    if (isVideo) return;
    // A still image has nothing to start, so the beat is the threshold.
    if (isPlaying) announce();
    else started.current = false;
  }, [isVideo, isPlaying, announce]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isArmed) return;

    // Reduced motion: hold on the first frame and wait to be asked.
    if (allowManualPlay) return;

    if (!isPlaying) {
      video.pause();
      // Rewound so scrolling back up and down replays the arrival rather
      // than resuming it half-finished.
      video.currentTime = 0;
      started.current = false;
      return;
    }

    let cancelled = false;
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;

    void video
      .play()
      .then(() => {
        if (cancelled) return;
        // Some browsers honour play() but mute it rather than refusing.
        setSoundBlocked(video.muted);
      })
      .catch(() => {
        if (cancelled) return;
        video.muted = true;
        setSoundBlocked(true);
        void video.play().catch(() => undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [isArmed, isPlaying, allowManualPlay]);

  /** A real gesture, so this is always allowed to unmute. */
  const enableSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    video.currentTime = 0;
    started.current = false;
    void video
      .play()
      .then(() => setSoundBlocked(video.muted))
      .catch(() => undefined);
  };

  if (arrivalMedia.kind === "video") {
    return (
      <>
        <video
          ref={videoRef}
          className="arrival-media-el"
          src={isArmed ? arrivalMedia.src : undefined}
          poster={arrivalMedia.poster}
          preload={isArmed ? "auto" : "none"}
          playsInline
          aria-label={arrivalMedia.alt}
          tabIndex={-1}
          onPlaying={announce}
        />

        {isArmed && (allowManualPlay || (soundBlocked && isPlaying)) && (
          <button
            type="button"
            className="arrival-sound"
            onClick={enableSound}
            aria-label="Play the knock with sound"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8.5 2.2 4.9 5.1H2.4a.9.9 0 0 0-.9.9v4a.9.9 0 0 0 .9.9h2.5l3.6 2.9a.6.6 0 0 0 1-.47V2.67a.6.6 0 0 0-1-.47Z" />
              <path d="M11.4 5.1a.75.75 0 0 0-.1 1.5 1.9 1.9 0 0 1 0 2.8.75.75 0 1 0 1 1.1 3.4 3.4 0 0 0 0-5 .75.75 0 0 0-.9-.4Z" />
            </svg>
            Hear the knock
          </button>
        )}
      </>
    );
  }

  return (
    <Image
      className="arrival-media-el"
      src={arrivalMedia.src}
      alt={arrivalMedia.alt}
      // Intrinsic size of the asset. Display size comes from CSS.
      width={arrivalMedia.width}
      height={arrivalMedia.height}
      sizes="(max-width: 560px) 76vw, (max-width: 900px) 60vw, 460px"
    />
  );
}

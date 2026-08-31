"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { arrivalMedia } from "@/lib/site-config";

export interface ArrivalMediaProps {
  /** True once the section is close enough to be worth downloading. */
  isArmed: boolean;
  /** True once scroll has reached the arrival beat and the frame is open. */
  isPlaying: boolean;
}

/**
 * Whatever arrives in S2's frame.
 *
 * The section is built around a media *slot*, not around a particular asset:
 * the frame's ratio, the beats and the knock timing are all fixed, and this
 * component resolves whichever source `arrivalMedia` names. Today that is the
 * avatar artwork, because the welcome video is still an open client question.
 * Approving it is a config change, not a rebuild.
 *
 * The video path is deliberately conservative: the `src` is withheld until
 * the section is near, so the page never pays for it on first load; it is
 * muted and inline so autoplay is permitted; and it does not loop, because an
 * arrival that repeats is not an arrival.
 */
export function ArrivalMedia({ isArmed, isPlaying }: ArrivalMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isArmed) return;

    if (isPlaying) {
      // Muted + playsInline is the combination browsers allow to autoplay.
      // If a policy still refuses, the frame holds on the poster frame.
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      // Rewound so scrolling back up and down replays the arrival rather
      // than resuming it half-finished.
      video.currentTime = 0;
    }
  }, [isArmed, isPlaying]);

  if (arrivalMedia.kind === "video") {
    return (
      <video
        ref={videoRef}
        className="arrival-media-el"
        src={isArmed ? arrivalMedia.src : undefined}
        poster={arrivalMedia.poster}
        preload={isArmed ? "auto" : "none"}
        muted
        playsInline
        aria-label={arrivalMedia.alt}
        tabIndex={-1}
      />
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

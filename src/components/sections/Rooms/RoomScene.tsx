"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

import type { Room } from "@/lib/site-config";

/** Crossfade width, as a fraction of one world's band of the runway. */
export const ROOM_FADE = 0.3;

export interface RoomSceneProps {
  room: Room;
  index: number;
  total: number;
  /** 0 -> 1 across the whole pinned runway. */
  progress: MotionValue<number>;
  /** True while this world should be decoding frames. */
  isPlaying: boolean;
  /** True once the section is close enough to be worth downloading. */
  isArmed: boolean;
}

/**
 * One world in the depth stack.
 *
 * Every layer sits in the same portal. Scrolling flies the camera forward:
 * the outgoing world comes toward you and passes the lens while the next
 * scales up from behind. Transform and opacity only — no filters — so the
 * DNA canvas keeps its frame budget.
 */
export function RoomScene({
  room,
  index,
  total,
  progress,
  isPlaying,
  isArmed,
}: RoomSceneProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  const band = 1 / total;
  const start = index * band;
  const end = start + band;
  // Crossfade window, as a slice of one room's band.
  const fade = band * ROOM_FADE;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  /*
    Every stop has to stay inside [0, 1]. Framer Motion v13 hands
    scroll-linked transforms to the browser as native WAAPI animations, and
    the input range becomes the keyframe offsets — an offset below 0 or above
    1 throws "Offsets must be monotonically non-decreasing" at mount and takes
    the whole tree down with it.

    So the outer worlds get three stops instead of four: the first has no
    entrance to play and the last has no exit.
  */
  const stops = isFirst
    ? [0, end - fade, end]
    : isLast
      ? [start - fade, start, 1]
      : [start - fade, start, end - fade, end];

  /** Trims a full [enter, hold, drift, exit] track to match `stops`. */
  const track = <T,>(keyframes: readonly [T, T, T, T]): T[] =>
    isFirst
      ? [keyframes[1], keyframes[2], keyframes[3]]
      : isLast
        ? [keyframes[0], keyframes[1], keyframes[2]]
        : [...keyframes];

  const opacity = useTransform(progress, stops, track([0, 1, 1, 0]));

  // 1.045 at the end of the active window is a slow Ken Burns creep, so the
  // world is never frozen; past that it accelerates by the camera.
  const scale = useTransform(progress, stops, track([0.9, 1, 1.045, 1.12]));

  const y = useTransform(progress, stops, track(["5%", "0%", "-1%", "-4%"]));

  // A scrim instead of a brightness filter: same depth cue, no repaint.
  const scrim = useTransform(progress, stops, track([0.55, 0, 0, 0.55]));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isArmed) return;

    if (isPlaying) {
      // Muted + playsInline is the combination browsers allow to autoplay.
      // If a policy still refuses, the frame stays on its poster frame.
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isPlaying, isArmed]);

  return (
    <motion.div
      className="room-scene"
      style={
        reduceMotion
          ? { opacity, zIndex: total - index }
          : { opacity, scale, y, zIndex: total - index }
      }
    >
      <video
        ref={videoRef}
        // src is withheld until the section is near, so the page does not
        // pay for three videos on first load.
        src={isArmed ? room.video : undefined}
        preload={isArmed ? "auto" : "none"}
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
      />
      {!reduceMotion && (
        <motion.div className="room-scene-scrim" style={{ opacity: scrim }} />
      )}
    </motion.div>
  );
}

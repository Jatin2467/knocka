"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

import { TextReveal } from "@/components/animation/TextReveal";
import { rooms } from "@/lib/site-config";

import { RoomProgress } from "./RoomProgress";
import { ROOM_FADE, RoomScene } from "./RoomScene";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** Point inside a world's band where the next one starts decoding. */
const WARM_AT = 0.72;

export function Rooms() {
  const reduceMotion = useReducedMotion();
  const runwayRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Bitmask of worlds that should be decoding. A number rather than an array
  // so the equality guard below is a plain comparison.
  const [playMask, setPlayMask] = useState(1);

  // Generous margin so the first world has downloaded before it is needed.
  const isNear = useInView(runwayRef, { margin: "80% 0px 80% 0px" });
  const isOnScreen = useInView(runwayRef, { amount: 0.01 });

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  /*
    Framer Motion v13 hands scroll-linked transform chains to the browser as
    native ViewTimeline animations, and stops writing the JS value once it
    does. Measured here, that native timeline runs out of step with the
    useScroll range — it reported 52.8% progress at the end of the runway, so
    the first world faded back in over the last one.

    Acceleration is only attached when a transform maps an array range
    straight off the scroll value, so routing it through one function
    transform detaches the descriptor and keeps the whole chain on framer's
    own frameloop, where the values are correct. Keep this indirection.
  */
  const progress = useTransform(scrollYProgress, (value) => value);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const last = rooms.length - 1;
    const scaled = Math.min(
      rooms.length - 0.0001,
      Math.max(0, value * rooms.length),
    );
    const raw = Math.floor(scaled);
    const frac = scaled - raw;

    // The crossfade ends on the band boundary, so keying the label off
    // Math.floor alone would leave it a whole transition behind the picture.
    // Shifting by half the fade swaps it as the new world passes 50%.
    const label = Math.min(last, Math.floor(scaled + ROOM_FADE / 2));

    // Two videos decoding at once halves the canvas frame rate, so the
    // overlap is kept as short as the crossfade allows: the next world warms
    // just before it appears, and the outgoing one freezes on its last frame
    // once the label has swapped — by then it is scaling away and fading, so
    // a still frame does not read.
    let mask = 1 << label;
    if (frac > WARM_AT && raw < last) mask |= 1 << (raw + 1);

    // Functional updates with an equality guard: this fires on every scroll
    // frame but only ever re-renders on an actual change.
    setActive((prev) => (prev === label ? prev : label));
    setPlayMask((prev) => (prev === mask ? prev : mask));
  });

  const activeRoom = rooms[active] ?? rooms[0];

  return (
    <section className="rooms" id="modes" aria-labelledby="rooms-title">
      <div className="rooms-intro">
        <motion.p
          className="rooms-eyebrow"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <span aria-hidden="true">✦</span> Rooms
        </motion.p>

        <h2 className="rooms-title" id="rooms-title">
          <TextReveal className="rooms-title-line" delay={0.05}>
            Don&apos;t just chat.
          </TextReveal>
          <TextReveal className="rooms-title-line" delay={0.16}>
            <span className="text-gradient">Go somewhere.</span>
          </TextReveal>
        </h2>

        <motion.p
          className="rooms-lead"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
        >
          Knocka gives every conversation a place. Step in as your avatar — the
          room sets the mood, you bring the presence.
        </motion.p>
      </div>

      <div className="rooms-runway" ref={runwayRef}>
        <div className="rooms-stage">
          <div className="rooms-portal-wrap">
            {/* Glow layers, one per world, crossfaded by class rather than by
                a per-frame style write. They sit behind the frame and spill
                past it, tinting the DNA field around the portal. */}
            <div className="rooms-glow" aria-hidden="true">
              {rooms.map((room, index) => (
                <span
                  key={room.id}
                  className="rooms-glow-layer"
                  data-on={index === active}
                  style={{ ["--glow" as string]: room.glow }}
                />
              ))}
            </div>

            <div className="rooms-portal">
              {rooms.map((room, index) => (
                <RoomScene
                  key={room.id}
                  room={room}
                  index={index}
                  total={rooms.length}
                  progress={progress}
                  isArmed={isNear}
                  isPlaying={isOnScreen && (playMask & (1 << index)) !== 0}
                />
              ))}
              <div className="rooms-portal-edge" aria-hidden="true" />
            </div>
          </div>

          <div className="rooms-caption">
            <div className="rooms-caption-slot">
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeRoom.id}
                  className="rooms-caption-item"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: EASE_OUT }}
                >
                  <p className="rooms-caption-name">
                    <span className="rooms-caption-ordinal">
                      {activeRoom.ordinal}
                    </span>
                    {activeRoom.name}
                  </p>
                  <p className="rooms-caption-line">{activeRoom.line}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <RoomProgress
              rooms={rooms}
              active={active}
              progress={progress}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

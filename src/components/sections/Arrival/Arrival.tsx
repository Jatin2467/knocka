"use client";

import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

import { ArrivalMedia } from "./ArrivalMedia";
import { ConversationThread } from "./ConversationThread";
import { KNOCK_BEATS, KNOCK_PULSE, SCORE } from "./score";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * S2 — THE FLAT -> THE ARRIVAL.
 *
 * The page's comprehension moment: an ordinary thread goes quiet, collapses
 * into a point, the plate covering the DNA field lifts, and the avatar opens
 * out of that same point and knocks twice.
 *
 * Three things carry the story, and they are one property each:
 *
 *   1. `.arrival-scrim` — a single solid plate over the fixed DNA canvas.
 *      Only its opacity animates. The site's own signature dying and coming
 *      back is the argument this section is making, so it is worth one layer.
 *   2. `.arrival-thread` — one `scale` on the wrapper pulls the whole
 *      conversation into its own centre.
 *   3. `.arrival-frame-outer` — the frame opens out of that same centre.
 *
 * No second canvas, no filter on anything that moves, no layout animation.
 */
export function Arrival() {
  const reduceMotion = useReducedMotion();
  const isStatic = reduceMotion === true;
  const runwayRef = useRef<HTMLDivElement>(null);

  const [hasArrived, setHasArrived] = useState(false);
  const [hasKnocked, setHasKnocked] = useState(false);

  // Generous margin so a video source, if one is ever approved, has
  // downloaded before the arrival beat needs it.
  const isNear = useInView(runwayRef, { margin: "60% 0px 60% 0px" });
  const isOnScreen = useInView(runwayRef, { amount: 0.01 });

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  /*
    A second range covering the *approach*: 0 when the runway's top is still a
    viewport away, 1 the moment it pins. The plate is multiplied by it, so it
    dims in as you come down to the section instead of a hard black band
    rising over the end of the hero. The plate's geometry keeps it off the
    hero entirely (see arrival.css); this is what keeps its arrival soft.
  */
  const { scrollYProgress: approach } = useScroll({
    target: runwayRef,
    offset: ["start end", "start start"],
  });

  /*
    Routed through one identity function transform on purpose. Framer Motion
    v13 accelerates scroll-linked chains onto native ViewTimeline animations
    and then stops writing the JS value — and that native timeline runs out of
    step with the useScroll range (measured at 52.8% progress at the end of
    the Rooms runway). Acceleration only attaches when a transform maps an
    array range straight off the scroll value, so this indirection detaches it
    and keeps the whole section on framer's own frameloop. Keep it.
  */
  const progress = useTransform(scrollYProgress, (value) => value);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    // Hysteresis on both flags: the arm and disarm thresholds are far apart,
    // so a scroll resting on a boundary cannot retrigger every frame. Both
    // are functional updates with an equality guard, so this listener runs on
    // every scroll frame but only re-renders on an actual state change.
    const arrived = value >= (hasArrived ? SCORE.arriveReset : SCORE.arriveAt);
    const knocked = value >= (hasKnocked ? SCORE.knockReset : SCORE.knockAt);

    setHasArrived((prev) => (prev === arrived ? prev : arrived));
    setHasKnocked((prev) => (prev === knocked ? prev : knocked));
  });

  const scrimTrack = useTransform(progress, SCORE.scrim, [1, 0]);
  const scrim = useTransform(
    [approach, scrimTrack],
    ([fadeIn, track]: number[]) => fadeIn * track,
  );

  const flatOpacity = useTransform(progress, SCORE.flatLine, [0, 1, 1, 0]);
  const flatY = useTransform(progress, SCORE.flatLine, [18, 0, 0, -14]);

  const arriveOpacity = useTransform(progress, SCORE.arriveLine, [0, 1]);
  const arriveY = useTransform(progress, SCORE.arriveLine, [22, 0]);

  const sparkOpacity = useTransform(progress, SCORE.spark, [0, 1, 0]);
  const sparkScale = useTransform(progress, SCORE.spark, [0.2, 1, 2.1]);

  const bloomOpacity = useTransform(progress, SCORE.bloom, [0, 0.95, 0.6]);
  const bloomScale = useTransform(progress, SCORE.bloom, [0.45, 1, 1.06]);

  const frameOpacity = useTransform(progress, SCORE.frame, [0, 1]);
  const frameScale = useTransform(progress, SCORE.frame, [0.3, 1]);
  const frameY = useTransform(progress, SCORE.frame, ["7%", "0%"]);

  const closerOpacity = useTransform(progress, SCORE.closer, [0, 1]);
  const closerY = useTransform(progress, SCORE.closer, [16, 0]);

  // The knock reveals the marks; with motion off they are simply there.
  const knockShown = isStatic || hasKnocked;
  const knockPulse = hasKnocked && !isStatic;
  const pulseTransition = knockPulse
    ? { duration: KNOCK_PULSE.duration, times: KNOCK_PULSE.times }
    : { duration: 0.2 };

  return (
    <section className="arrival" id="arrival" aria-labelledby="arrival-title">
      <div className="arrival-runway" ref={runwayRef}>
        <div className="arrival-stage">
          {/*
            The plate. It reaches well past the pinned stage so its feathered
            edges stay off-screen while the section is pinned, and so
            approaching the section reads as the lights going down rather than
            as a hard edge sliding up the page.
          */}
          {!isStatic && (
            <motion.div
              className="arrival-scrim"
              aria-hidden="true"
              style={{ opacity: scrim }}
            />
          )}

          <h2 className="arrival-title" id="arrival-title">
            <motion.span
              className="arrival-title-line"
              style={isStatic ? undefined : { opacity: flatOpacity, y: flatY }}
            >
              Text is flat.
            </motion.span>
            <motion.span
              className="arrival-title-line"
              style={
                isStatic ? undefined : { opacity: arriveOpacity, y: arriveY }
              }
            >
              <span className="text-gradient">Someone just showed up.</span>
            </motion.span>
          </h2>

          <div className="arrival-core">
            <ConversationThread progress={progress} isStatic={isStatic} />

            <div className="arrival-stack">
              {/* Painted gradients, never a blurred layer: both of these
                  scale, and a filter on a scaling element re-rasterises
                  every frame. The gradient is the blur. */}
              <motion.span
                className="arrival-bloom"
                aria-hidden="true"
                style={
                  isStatic
                    ? undefined
                    : { opacity: bloomOpacity, scale: bloomScale }
                }
              />

              {!isStatic && (
                <motion.span
                  className="arrival-spark"
                  aria-hidden="true"
                  style={{ opacity: sparkOpacity, scale: sparkScale }}
                />
              )}

              <motion.div
                className="arrival-frame-outer"
                style={
                  isStatic
                    ? undefined
                    : { opacity: frameOpacity, scale: frameScale, y: frameY }
                }
              >
                {/*
                  The knock impulse lives on its own element: the outer
                  wrapper's scale is already owned by scroll, and one element
                  cannot take a transform from a motion value and from a
                  keyframe animation at the same time.
                */}
                <motion.div
                  className="arrival-frame"
                  animate={
                    knockPulse ? { scale: [1, 1.028, 1, 1, 1.028, 1] } : { scale: 1 }
                  }
                  transition={pulseTransition}
                >
                  <ArrivalMedia
                    isArmed={isNear}
                    isPlaying={isOnScreen && hasArrived}
                  />

                  {/* Static geometry, opacity only: the edge light for each
                      hit, on the same impulse track as the frame kick. */}
                  <motion.span
                    className="arrival-flash"
                    aria-hidden="true"
                    animate={
                      knockPulse ? { opacity: [0, 1, 0, 0, 1, 0] } : { opacity: 0 }
                    }
                    transition={pulseTransition}
                  />

                  {/*
                    Exactly two. Scroll arms the sequence, KNOCK_BEATS
                    performs it — so the rhythm is the same every time, no
                    matter how fast the visitor scrolls.
                  */}
                  {KNOCK_BEATS.map((beat, index) => (
                    <motion.span
                      key={beat}
                      className="arrival-knock"
                      data-mark={index + 1}
                      initial={false}
                      animate={
                        knockShown
                          ? { opacity: 1, scale: 1, y: 0 }
                          : { opacity: 0, scale: 0.72, y: 10 }
                      }
                      transition={
                        knockShown && !isStatic
                          ? { duration: 0.34, ease: EASE_OUT, delay: beat }
                          : { duration: 0.2 }
                      }
                    >
                      Knock
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>

          <motion.p
            className="arrival-closer"
            style={isStatic ? undefined : { opacity: closerOpacity, y: closerY }}
          >
            That&apos;s the difference.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

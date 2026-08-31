/**
 * S2's score.
 *
 * Every number here is a fraction of the pinned runway, and the whole section
 * is driven from this one file so the beats cannot drift apart: the thread
 * has to finish collapsing before the spark fires, the spark has to fire
 * before the frame opens, and the scrim has to be gone before either reads.
 *
 * **Every stop must stay inside [0, 1].** Framer Motion v13 hands
 * scroll-linked transforms to the browser as native WAAPI animations, where
 * the input range becomes the keyframe offsets; a stop below 0 or above 1
 * throws "Offsets must be monotonically non-decreasing" at mount and takes
 * the whole tree down. See docs/LANDING_PAGE_AGENT.md.
 */
export const SCORE = {
  /** Bubble i enters at `bubbleIn + i * bubbleStep`, over `bubbleDur`. */
  bubbleIn: 0.02,
  bubbleStep: 0.03,
  bubbleDur: 0.05,
  /** ...and leaves on the collapse, offset by the same per-bubble step. */
  bubbleOut: [0.41, 0.52],
  bubbleOutStep: 0.012,

  /** "Seen 2h ago": in, hold, out. The thread stalls here. */
  stall: [0.2, 0.27, 0.41, 0.48],

  /** Headline A, "Text is flat." */
  flatLine: [0.22, 0.31, 0.4, 0.47],

  /** The whole thread is pulled into a single point. */
  collapse: [0.4, 0.58],

  /** What the thread collapses into, and what the frame opens out of. */
  spark: [0.5, 0.58, 0.67],

  /** The plate over the DNA field lifts. This is the section's turn. */
  scrim: [0.5, 0.67],

  /** Brand bloom behind the arrival. Holds at part strength to the end. */
  bloom: [0.52, 0.68, 1],

  /** The arrival frame opens out of the spark. */
  frame: [0.58, 0.76],

  /** Headline B, "Someone just showed up." */
  arriveLine: [0.7, 0.81],

  /** "That's the difference." — the breath before S3. */
  closer: [0.9, 0.97],

  /**
   * Thresholds, not ranges. Each pair is armed on the way down and disarmed
   * on the way back up; the gap between them is hysteresis, so a scroll that
   * hovers on the boundary cannot retrigger the sequence every frame.
   */
  arriveAt: 0.56,
  arriveReset: 0.5,
  knockAt: 0.84,
  knockReset: 0.66,
};

/**
 * Exactly two knocks. Seconds from the moment the sequence arms.
 *
 * Scroll *arms* the knock; time *performs* it. A purely scroll-linked knock
 * would let the visitor's scroll speed set its rhythm, and the rhythm is the
 * brand — so the position is scroll-driven and the beat is not.
 *
 * If the approved welcome video (which knocks twice itself) is ever dropped
 * into the arrival frame, retime these two offsets to its knock frames
 * instead of adding a second knock animation.
 */
export const KNOCK_BEATS = [0, 0.34];

/**
 * One impulse track carrying both hits, for the pulses that ride along with
 * the marks (frame kick, edge flash). Peaks land at 0.036s and 0.378s, which
 * is the same 0.34s gap as KNOCK_BEATS.
 */
export const KNOCK_PULSE = {
  duration: 0.9,
  times: [0, 0.04, 0.26, 0.34, 0.42, 1],
};

"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** A place in the fan. x/y are percentages of the phone's own size. */
interface Pose {
  readonly x: number;
  readonly y: number;
  readonly rotate: number;
}

interface Phone {
  readonly src: string;
  readonly alt: string;
  /** Where it sits at rest. */
  readonly rest: Pose;
  /** Where it slides to while the fan is hovered. */
  readonly open: Pose;
}

/**
 * Real screens from the app, in the order someone meets them: set up an
 * avatar, land on the welcome, open the app. Nothing here is a mockup or a
 * rendered device frame — the artwork already carries the phone, complete
 * with transparent corners, so the CSS only has to match its radius.
 *
 * Poses are percentages rather than pixels so the whole fan scales with
 * --phone-w. One set of numbers works from 320px to 1920px.
 */
const PHONES: readonly Phone[] = [
  {
    src: "/news-latter-phone-img/avatar-setup.png",
    alt: "Building a Knocka avatar",
    rest: { x: 0, y: 9, rotate: -16 },
    open: { x: -8, y: 15, rotate: -21 },
  },
  {
    src: "/news-latter-phone-img/Welcome.png",
    alt: "The Knocka welcome screen: don't text, arrive",
    rest: { x: 0, y: -4, rotate: -16 },
    open: { x: 0, y: -11, rotate: -16 },
  },
  {
    // The file name has a space in it. Encoded, because next/image hands the
    // src to the optimiser as a query parameter and a raw space does not
    // survive the round trip.
    src: "/news-latter-phone-img/splash%20screen.png",
    alt: "The Knocka splash screen",
    rest: { x: 0, y: -17, rotate: -16 },
    open: { x: 15, y: -24, rotate: -11 },
  },
];

const pose = (p: Pose, dropBy = 0) => ({
  x: `${p.x}%`,
  y: `${p.y + dropBy}%`,
  rotate: p.rotate,
});

/**
 * Three app screens fanned out and cropped by the panel edge.
 *
 * Hover opens the fan: each screen moves a different amount and by a
 * different angle, so the group spreads rather than sliding as a block. It is
 * a spring on x/y/rotate only — compositor work, no layout, no repaint, and
 * nothing that can disturb the DNA canvas painting behind the panel.
 *
 * The gesture sits on the wrapper, not on each screen. Pointer events on a
 * child count as entering its ancestors, so hovering any one of the three
 * opens all three, and moving between them never restarts the animation.
 */
export function PhoneStack() {
  const reduceMotion = useReducedMotion() === true;

  return (
    <motion.div
      className="newsletter-phones"
      // Reduced motion skips the entrance outright rather than fading in on
      // view. The copy beside these is AOS, whose "disable" hook leaves it
      // unconditionally visible, so a scroll-gated reveal here left the three
      // screens at opacity 0 while the words around them were painted —
      // measured by jumping to the page bottom under prefers-reduced-motion.
      initial={reduceMotion ? "rest" : "stacked"}
      whileInView={reduceMotion ? undefined : "rest"}
      whileHover={reduceMotion ? undefined : "open"}
      // The panel clips with overflow:hidden and the fan deliberately
      // overflows it, so IntersectionObserver only ever sees part of this
      // wrapper. 0.2 keeps the trigger well clear of that ceiling.
      viewport={{ once: true, amount: 0.2 }}
    >
      {PHONES.map((phone, index) => (
        <motion.div
          key={phone.src}
          className={`newsletter-phone newsletter-phone-${index + 1}`}
          variants={{
            stacked: {
              ...pose(phone.rest, reduceMotion ? 0 : 16),
              opacity: 0,
            },
            rest: {
              ...pose(phone.rest),
              opacity: 1,
              transition: {
                duration: reduceMotion ? 0.3 : 0.95,
                ease: EASE_OUT,
                delay: reduceMotion ? 0 : 0.06 + index * 0.09,
              },
            },
            open: {
              ...pose(phone.open),
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 210,
                damping: 24,
                mass: 0.7,
              },
            },
          }}
        >
          <Image
            src={phone.src}
            alt={phone.alt}
            // Intrinsic size of the artwork. Display size comes from CSS.
            width={375}
            height={812}
            sizes="(min-width: 901px) 190px, 120px"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

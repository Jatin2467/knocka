"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";

import { KnockMarks } from "./KnockMarks";
import { VoiceWave } from "./VoiceWave";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * The site's masked line reveal, triggered on view rather than on mount.
 *
 * `TextReveal` animates from `animate`, which for a section this far down the
 * page means the reveal is over long before anyone scrolls to it. Same mask,
 * same easing, same CSS (`.text-reveal` in utilities.css) — different
 * trigger. Kept local so the shared component, and the two sections already
 * using it, are left alone.
 *
 * **The trigger must sit on the wrapper, not on the line.** IntersectionObserver
 * clips the intersection rect against an ancestor's `overflow: hidden`, and the
 * mask *is* an `overflow: hidden` ancestor holding the line 110% below it — so
 * the line reports a ratio of 0.05 and `whileInView` never fires however far
 * down the page you scroll. Measured. The unclipped wrapper does the observing
 * and the line follows it as a variant.
 */
function RevealLine({
  children,
  delay,
  reduceMotion,
}: {
  children: ReactNode;
  delay: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.span
      className="text-reveal range-title-line"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
    >
      <motion.span
        className="text-reveal-inner"
        variants={{
          hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: "110%" },
          shown: { opacity: 1, y: 0 },
        }}
        transition={{
          duration: reduceMotion ? 0.3 : 1.05,
          ease: EASE_OUT,
          delay: reduceMotion ? 0 : delay,
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

/**
 * S3 — THE RANGE.
 *
 * The quiet section. S2 argued that someone can show up; this one says what
 * they can do once they are here — face, voice, knock.
 *
 * **Built on the fallback path, deliberately.** The repository contains one
 * avatar image in one pose, and has never contained an expression clip, an
 * expression still, lip-sync footage or any audio — checked across the
 * working tree and the whole git history. So nothing here pretends the
 * avatar can pull a face on command: the avatar is held constant and the
 * three modes are argued in type, in one drawn waveform, and in the two
 * knock marks. See docs/LANDING_PAGE_STRATEGY.md for the upgrade path.
 *
 * Not pinned, no scroll-linked value anywhere, no second canvas. Everything
 * is a one-shot reveal on `whileInView`, which is what keeps this the
 * cheapest section on the page and the breath between S2 and Rooms.
 */
export function Range() {
  const reduceMotion = useReducedMotion() === true;

  /** Shared entrance. Reduced motion keeps the fade and drops the travel. */
  const rise = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: reduceMotion ? 0.3 : 0.85, ease: EASE_OUT, delay },
  });

  return (
    <section className="range" id="range" aria-labelledby="range-title">
      <div className="range-inner">
        <div className="range-head">
          <motion.p className="range-eyebrow" {...rise(0)}>
            <span aria-hidden="true">✦</span> The range
          </motion.p>

          <h2 className="range-title" id="range-title">
            <RevealLine delay={0.05} reduceMotion={reduceMotion}>
              Your face. Your voice.
            </RevealLine>
            <RevealLine delay={0.16} reduceMotion={reduceMotion}>
              <span className="text-gradient">Your knock.</span>
            </RevealLine>
          </h2>
        </div>

        <div className="range-body">
          <motion.div className="range-avatar" {...rise(0.1)}>
            {/* One still ring behind the artwork — the DNA's curve, held
                still. The rest of the page moves; this section does not. */}
            <span className="range-arc" aria-hidden="true" />
            <Image
              src="/branding/knocka-avatar-logo.png"
              alt="A Knocka avatar"
              // Intrinsic size of the asset. Display size comes from CSS.
              width={615}
              height={512}
              sizes="(max-width: 900px) 72vw, 38vw"
            />
          </motion.div>

          {/*
            One list, one hairline running through it. The spine is what
            makes these three states a single argument rather than three
            cards, and it walks purple -> magenta -> cyan on its way down, so
            the section carries the brand gradient without a single glow.
          */}
          <ol className="range-states">
            <motion.li className="range-state" {...rise(0.14)}>
              <p className="range-state-head">
                <span className="range-ordinal">01</span>
                <span className="range-label">Expression</span>
              </p>
              <p className="range-state-line">Your face, not an emoji.</p>
            </motion.li>

            <motion.li className="range-state" {...rise(0.22)}>
              <p className="range-state-head">
                <span className="range-ordinal">02</span>
                <span className="range-label">Voice</span>
              </p>
              <p className="range-state-line">Say it out loud.</p>
              <VoiceWave />
            </motion.li>

            <motion.li className="range-state" {...rise(0.3)}>
              <p className="range-state-head">
                <span className="range-ordinal">03</span>
                <span className="range-label">The knock</span>
              </p>
              <p className="range-state-line">
                When words are not enough, knock.
              </p>
              <KnockMarks />
            </motion.li>
          </ol>
        </div>
      </div>
    </section>
  );
}

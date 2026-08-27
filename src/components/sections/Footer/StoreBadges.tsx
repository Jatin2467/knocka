"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Apple mark, drawn inline so the badge carries no network weight. */
function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

/** Google Play mark. */
function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M3.609 1.814 13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92Zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635Zm3.199-3.198 2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.29 12l2.408-2.491ZM5.864 2.658 16.802 8.99l-2.303 2.303-8.635-8.635Z" />
    </svg>
  );
}

interface StoreBadgeProps {
  glyph: "apple" | "play";
  eyebrow: string;
  name: string;
}

function StoreBadge({ glyph, eyebrow, name }: StoreBadgeProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href="#"
      className="store-badge"
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.6 }}
    >
      <span className="store-badge-glyph">
        {glyph === "apple" ? <AppleGlyph /> : <PlayGlyph />}
      </span>
      <span className="store-badge-text">
        <span className="store-badge-eyebrow">{eyebrow}</span>
        <span className="store-badge-name">{name}</span>
      </span>
    </motion.a>
  );
}

export function StoreBadges() {
  return (
    <div className="store-badges">
      <StoreBadge glyph="apple" eyebrow="Download on the" name="App Store" />
      <StoreBadge glyph="play" eyebrow="Get it on" name="Google Play" />
    </div>
  );
}

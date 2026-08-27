"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TextRevealProps {
  children: ReactNode;
  /** Seconds to wait before the line rises. */
  delay?: number;
  className?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Masked line reveal: the line rises out of its own overflow box instead of
 * fading in. Transform + opacity only, so it stays on the compositor.
 *
 * The wrapper's padding/margin pair keeps descenders and gradient bleed from
 * being clipped by the mask.
 */
export function TextReveal({ children, delay = 0, className }: TextRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <span className={cn("text-reveal", className)}>
      <motion.span
        className="text-reveal-inner"
        initial={reduceMotion ? { opacity: 0 } : { y: "110%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0.3 : 1.05,
          ease: EASE_OUT,
          delay: reduceMotion ? 0 : delay,
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}

"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "ghost";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
};

const SIZE_CLASS: Record<ButtonSize, string | null> = {
  md: null,
  lg: "btn-lg",
};

/**
 * The tactile press lives in the primitive so every CTA in the page reacts
 * the same way: a short lift on hover, a firm compression on press.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      className={cn("btn", VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.6 }}
      {...props}
    />
  );
}

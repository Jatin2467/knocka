"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "ghost";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Everything shared by every CTA on the page. `rounded-control`, `text-nav`,
 * `text-body` and `font-medium` all come from the @theme tokens, so these are
 * the design system's own values rather than Tailwind's defaults.
 *
 * No `border-none` here: Tailwind's preflight already gives every element
 * `border-width: 0`, and adding a border-style utility on the base would put
 * it in a fight with the ghost variant's border that stylesheet order, not
 * the className order, would settle.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control " +
  "font-medium text-text-primary whitespace-nowrap no-underline " +
  "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[ease]";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-[image:var(--gradient-brand)]",
  ghost: "bg-glass-strong border border-border-glass",
};

/**
 * Padding is resolved to exactly one value rather than layered.
 *
 * The stylesheet this replaced relied on `.btn-lg` being written after
 * `.btn-primary` to win the padding. Utilities have no such guarantee — two
 * padding classes in one string are settled by the order Tailwind happens to
 * emit them, not by the order they appear in the className. So the large size
 * owns its padding outright and the variants only supply theirs at `md`.
 */
const SIZE_CLASS: Record<ButtonSize, string> = {
  md: "text-nav",
  // leading-[normal] is not cosmetic: the token pairs --text-body with a 1.6
  // line-height, but the rule this replaced set font-size alone, so the large
  // CTA measured 49px tall. Without this it grows to 54px.
  lg: "px-7 py-[15px] text-body leading-[normal]",
};

const VARIANT_PADDING: Record<ButtonVariant, string> = {
  primary: "px-6 py-2.5",
  ghost: "px-[22px] py-2.5",
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
      className={cn(
        BASE,
        VARIANT_CLASS[variant],
        size === "md" && VARIANT_PADDING[variant],
        SIZE_CLASS[size],
        className,
      )}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.6 }}
      {...props}
    />
  );
}

"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type EmailSignupVariant = "panel" | "inline";

export interface EmailSignupProps {
  /**
   * `panel` is the invite banner's row — a field beside the page's primary
   * CTA. `inline` is the footer's single control, field and button sharing
   * one pill.
   */
  variant?: EmailSignupVariant;
  label: string;
  buttonLabel: string;
  className?: string;
}

/**
 * The waitlist field.
 *
 * **NOT WIRED.** There is no backend, no API route and no endpoint in this
 * project, so this posts nowhere: submitting swaps the control for a
 * confirmation and the address is dropped. It is a front-end shell, and it
 * has to be connected to something real — or taken back out — before the site
 * goes live, or it will collect addresses that go straight in the bin.
 *
 * `type="email"` plus `required` means the browser does the validating, so
 * there is no validation code here to keep in step with it.
 */
export function EmailSignup({
  variant = "panel",
  label,
  buttonLabel,
  className,
}: EmailSignupProps) {
  const id = useId();
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <p
        className={cn(
          "m-0 text-[14px]",
          variant === "panel"
            ? "text-[rgba(255,255,255,0.82)]"
            : "text-text-secondary",
          className,
        )}
        role="status"
      >
        ✦ You&apos;re on the list — we&apos;ll knock when your wave opens.
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <form
        className={cn("w-full", className)}
        onSubmit={submit}
        noValidate={false}
      >
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        {/*
          One control, not two next to each other: the border, the background
          and the focus ring belong to the wrapper, and the field inside is
          transparent and unstyled. focus-within is what moves the focus state
          from the input up to the shape the eye reads as the control.
        */}
        <div className="flex items-center gap-1.5 rounded-pill border border-border-subtle bg-glass-strong p-1.5 transition-[border-color] duration-200 focus-within:border-border-accent">
          <input
            id={id}
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            className="min-w-0 flex-1 bg-transparent px-3.5 py-1.5 text-[14px] text-text-primary outline-none placeholder:text-[rgba(255,255,255,0.38)]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="shrink-0"
          >
            {buttonLabel}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      className={cn("flex w-full flex-wrap items-center gap-3", className)}
      onSubmit={submit}
    >
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@email.com"
        className="min-w-0 flex-1 rounded-control border border-[rgba(255,255,255,0.24)] bg-[rgba(9,6,18,0.32)] px-5 py-[15px] text-body leading-[normal] text-white outline-none transition-[border-color,background-color] duration-200 placeholder:text-[rgba(255,255,255,0.5)] focus-visible:border-[rgba(255,255,255,0.6)] focus-visible:bg-[rgba(9,6,18,0.5)]"
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="shrink-0 shadow-[0_18px_40px_-16px_rgba(12,4,32,0.85)]"
      >
        {buttonLabel}
      </Button>
    </form>
  );
}

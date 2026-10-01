"use client";

import dynamic from "next/dynamic";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { APP_CHECK_HEADER, getAppCheckToken, warmAppCheck } from "@/lib/app-check";
import { cn } from "@/lib/cn";
import {
  normalizeEmail,
  type WaitlistRequest,
  type WaitlistResponse,
  type WaitlistSource,
} from "@/lib/waitlist";

/*
  Step 2 brings the phone-number library and its country data with it, which
  only visitors who finish step 1 ever need. So it is its own chunk, fetched
  while the signup request is in flight (see `submit`) and never in the first
  page load. It appears only after a click, so it has no server HTML.
*/
const loadPhoneStep = () =>
  import("@/components/ui/WaitlistPhoneStep").then((m) => m.WaitlistPhoneStep);
const WaitlistPhoneStep = dynamic(loadPhoneStep, { ssr: false });

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
 * idle -> sending -> phone (step 2, new signups only) -> added | sent
 *                 \-> sent (a repeat signup goes straight here)
 * "sent" is the finished state; skipping step 2 lands there too, and it is
 * never offered again for the same signup.
 */
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "phone"; email: string }
  | { kind: "added" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

/** Each variant lives in exactly one place on the page. */
const SOURCE: Record<EmailSignupVariant, WaitlistSource> = {
  panel: "newsletter",
  inline: "footer",
};

const FALLBACK_ERROR = "We couldn't add you just now. Please try again.";
const VERIFY_ERROR =
  "We couldn't verify your browser. Please refresh the page and try again.";

/**
 * The waitlist field. Posts to /api/waitlist, which emails the owner and
 * sends the visitor a confirmation — see app/api/waitlist/route.ts.
 *
 * `type="email"` plus `required` means the browser does the first round of
 * validating; the route validates again, because anything can post to it.
 *
 * The honeypot (`company`) is off-screen rather than display:none, which some
 * bots check for, and is kept out of the tab order and the accessibility tree
 * so no person ever fills it.
 */
export function EmailSignup({
  variant = "panel",
  label,
  buttonLabel,
  className,
}: EmailSignupProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const sending = status.kind === "sending";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;

    const form = new FormData(event.currentTarget);
    const payload: WaitlistRequest = {
      email: String(form.get("email") ?? ""),
      source: SOURCE[variant],
      company: String(form.get("company") ?? ""),
    };

    setStatus({ kind: "sending" });
    void loadPhoneStep().catch(() => undefined); // warm the step-2 chunk
    try {
      // App Check proves the request comes from this page. With no token the
      // request is not sent at all, and the visitor is told nothing technical.
      const appCheckToken = await getAppCheckToken();
      if (!appCheckToken) {
        setStatus({ kind: "error", message: VERIFY_ERROR });
        return;
      }

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", [APP_CHECK_HEADER]: appCheckToken },
        body: JSON.stringify(payload),
      });
      const result = (await response
        .json()
        .catch(() => null)) as WaitlistResponse | null;

      if (response.ok && result?.ok) {
        setStatus(
          result.offerPhone
            ? { kind: "phone", email: normalizeEmail(payload.email) ?? payload.email }
            : { kind: "sent" },
        );
      } else {
        setStatus({
          kind: "error",
          message: result && !result.ok ? result.error : FALLBACK_ERROR,
        });
      }
    } catch {
      // Offline, or the request never reached the server.
      setStatus({
        kind: "error",
        message: "Check your connection and try again.",
      });
    }
  };

  if (status.kind === "phone") {
    return (
      <WaitlistPhoneStep
        email={status.email}
        variant={variant}
        className={className}
        onAdded={() => setStatus({ kind: "added" })}
        onSkip={() => setStatus({ kind: "sent" })}
      />
    );
  }

  if (status.kind === "added") {
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
        ✦ Number added. You&apos;re on the list, and we&apos;ll text you when
        Knocka launches.
      </p>
    );
  }

  if (status.kind === "sent") {
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
        ✦ You&apos;re on the list — check your inbox. We&apos;ll knock when
        your wave opens.
      </p>
    );
  }

  const error =
    status.kind === "error" ? (
      <p
        id={errorId}
        role="alert"
        className={cn(
          "m-0 mt-2.5 w-full text-[13px]",
          variant === "panel" ? "text-[#ffe4e6]" : "text-[#fda4af]",
        )}
      >
        {status.message}
      </p>
    ) : null;

  const honeypot = (
    <input
      type="text"
      name="company"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -left-[9999px] h-px w-px opacity-0"
    />
  );

  const buttonText = sending ? "Joining…" : buttonLabel;

  if (variant === "inline") {
    return (
      <form
        className={cn("relative w-full", className)}
        onSubmit={submit}
        onFocus={warmAppCheck}
        aria-busy={sending}
      >
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        {honeypot}
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
            aria-invalid={status.kind === "error" || undefined}
            aria-describedby={status.kind === "error" ? errorId : undefined}
            onInput={() => status.kind === "error" && setStatus({ kind: "idle" })}
            className="min-w-0 flex-1 bg-transparent px-3.5 py-1.5 text-[14px] text-text-primary outline-none placeholder:text-[rgba(255,255,255,0.38)]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="shrink-0 disabled:cursor-wait disabled:opacity-70"
            arrow={!sending}
            magnetic={false}
            disabled={sending}
          >
            {buttonText}
          </Button>
        </div>
        {error}
      </form>
    );
  }

  /*
    The field keeps at least 220px. Where the field and the button cannot both
    fit, the button wraps underneath, and both then grow to the full width, so
    a phone gets two full-width controls rather than a squeezed field.
  */
  return (
    <form
      className={cn("relative flex w-full flex-wrap items-center gap-3", className)}
      onSubmit={submit}
      onFocus={warmAppCheck}
      aria-busy={sending}
    >
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      {honeypot}
      <input
        id={id}
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@email.com"
        aria-invalid={status.kind === "error" || undefined}
        aria-describedby={status.kind === "error" ? errorId : undefined}
        onInput={() => status.kind === "error" && setStatus({ kind: "idle" })}
        className="min-w-0 flex-[1_1_220px] rounded-control border border-[rgba(255,255,255,0.24)] bg-[rgba(9,6,18,0.32)] px-5 py-[15px] text-body leading-[normal] text-white outline-none transition-[border-color,background-color] duration-200 placeholder:text-[rgba(255,255,255,0.5)] focus-visible:border-[rgba(255,255,255,0.6)] focus-visible:bg-[rgba(9,6,18,0.5)]"
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="flex-[1_0_auto] shadow-[0_18px_40px_-16px_rgba(12,4,32,0.85)] disabled:cursor-wait disabled:opacity-70"
        arrow={!sending}
        disabled={sending}
      >
        {buttonText}
      </Button>
      {error}
    </form>
  );
}

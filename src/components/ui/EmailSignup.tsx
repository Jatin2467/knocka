"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { WaitlistInvite } from "@/components/ui/WaitlistInvite";
import { APP_CHECK_HEADER, getAppCheckToken, warmAppCheck } from "@/lib/app-check";
import { cn } from "@/lib/cn";
import { incomingReferral, rememberOwnReferral } from "@/lib/referral";
import {
  isReferralCode,
  normalizeEmail,
  type WaitlistRequest,
  type WaitlistResponse,
  type WaitlistSource,
} from "@/lib/waitlist";

/*
  The phone form brings the phone-number library and its country data with
  it, which only visitors who have joined ever need. So it is its own chunk,
  fetched while the signup request is in flight (see `submit`) and never in
  the first page load. It appears only after a click, so it has no server HTML.
*/
const loadPhoneForm = () =>
  import("@/components/ui/WaitlistPhoneForm").then((m) => m.WaitlistPhoneForm);
const WaitlistPhoneForm = dynamic(loadPhoneForm, { ssr: false });

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
 * idle -> sending -> joined
 *
 * "joined" is the end: the visitor is on the list and the card says so. A new
 * signup's card also carries one button that opens the optional phone form
 * (`offerPhone`); a repeat of an address already on the list gets the card
 * without it. Once a number is saved, the card ends with the visitor's invite
 * link (`referralCode`); the Share section below carries the same link.
 */
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "joined"; email: string; offerPhone: boolean; referralCode: string | null }
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

  // Remember a friend's `?ref=` on arrival, so it still counts if the visitor
  // joins on a later visit.
  useEffect(() => {
    incomingReferral();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;

    const form = new FormData(event.currentTarget);
    const payload: WaitlistRequest = {
      email: String(form.get("email") ?? ""),
      source: SOURCE[variant],
      company: String(form.get("company") ?? ""),
      ref: incomingReferral() ?? undefined,
    };

    setStatus({ kind: "sending" });
    void loadPhoneForm().catch(() => undefined); // warm the phone form's chunk
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
        // From here every share on the page carries this visitor's invite link.
        const referralCode = isReferralCode(result.referralCode) ? result.referralCode : null;
        if (referralCode) rememberOwnReferral(referralCode);
        setStatus({
          kind: "joined",
          email: normalizeEmail(payload.email) ?? payload.email,
          offerPhone: result.offerPhone === true,
          referralCode,
        });
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

  if (status.kind === "joined") {
    return (
      <JoinedCard
        email={status.email}
        offerPhone={status.offerPhone}
        referralCode={status.referralCode}
        variant={variant}
        className={className}
      />
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

/** The optional phone part of the card: offered, open, or done one way or the other. */
type PhonePhase = "offer" | "open" | "texts" | "noTexts";

/**
 * "You're on the list" — the end of the signup, not a step towards it.
 *
 * For a new signup it carries exactly one action, Add my mobile number, which
 * opens the phone form in place inside the same card. Cancel folds it back to
 * the button. A saved number replaces both with a one-line confirmation and
 * the invite block — the visitor who has just given a number is the one most
 * likely to bring friends.
 *
 * Focus follows the visitor: the heading on arrival (the form they were in has
 * gone), the number field when the form opens, the button again on cancel.
 */
function JoinedCard({
  email,
  offerPhone,
  referralCode,
  variant,
  className,
}: {
  email: string;
  offerPhone: boolean;
  referralCode: string | null;
  variant: EmailSignupVariant;
  className?: string;
}) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<PhonePhase>("offer");
  const panel = variant === "panel";
  const muted = panel ? "text-[rgba(255,255,255,0.78)]" : "text-text-secondary";

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const cancel = () => {
    setPhase("offer");
    // After the button is back in the DOM.
    requestAnimationFrame(() => offerRef.current?.querySelector("button")?.focus());
  };

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "w-full rounded-[20px] border p-[clamp(16px,2vw,24px)] text-left",
        panel
          ? "border-[rgba(255,255,255,0.22)] bg-[rgba(9,6,18,0.34)]"
          : "border-border-subtle bg-glass-strong",
        className,
      )}
    >
      <h3
        id={`${id}-title`}
        ref={headingRef}
        tabIndex={-1}
        className="m-0 font-display text-[clamp(18px,1.6vw,22px)]/[1.2] font-[800] tracking-[-0.02em] text-balance text-text-primary outline-none"
      >
        <span aria-hidden="true">🎉 </span>You&apos;re on the Knocka list!
      </h3>
      <p className={cn("mt-1.5 mb-0 text-[14px]/[1.55] text-pretty", muted)}>
        Check your inbox — we&apos;ll knock when your wave opens.
      </p>

      {offerPhone && phase === "offer" && (
        <div
          ref={offerRef}
          className="mt-4 flex flex-col items-start gap-2.5 border-t border-[rgba(255,255,255,0.12)] pt-4"
        >
          <p className={cn("m-0 text-[13px]/[1.5]", muted)}>
            <span className="font-medium text-accent-lilac">Want early access even faster?</span>{" "}
            We&apos;ll text you the moment Knocka launches.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            arrow
            magnetic={false}
            onClick={() => setPhase("open")}
          >
            Add my mobile number
          </Button>
        </div>
      )}

      {phase === "open" && (
        <div className="mt-4 border-t border-[rgba(255,255,255,0.12)] pt-4">
          <WaitlistPhoneForm
            email={email}
            variant={variant}
            onAdded={(textsOk) => setPhase(textsOk ? "texts" : "noTexts")}
            onCancel={cancel}
          />
        </div>
      )}

      {(phase === "texts" || phase === "noTexts") && (
        <div className="mt-4 border-t border-[rgba(255,255,255,0.12)] pt-4">
          <p role="status" className="m-0 text-[13px]/[1.5] text-white">
            ✦{" "}
            {phase === "texts"
              ? "Number added. We'll text you when Knocka launches."
              : "Number saved. We won't text you — we'll email you at launch."}
          </p>
          {referralCode && <WaitlistInvite referralCode={referralCode} variant={variant} />}
        </div>
      )}
    </section>
  );
}

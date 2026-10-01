"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { APP_CHECK_HEADER, getAppCheckToken } from "@/lib/app-check";
import { cn } from "@/lib/cn";
import {
  countryOptions,
  guessCountry,
  normalizePhone,
  type CountryCode,
} from "@/lib/phone";
import {
  PHONE_CONSENT_MESSAGE,
  PHONE_INVALID_MESSAGE,
  type WaitlistPhoneRequest,
  type WaitlistPhoneResponse,
} from "@/lib/waitlist";

export interface WaitlistPhoneStepProps {
  /** The address that has just joined. Sent back so the server finds the record. */
  email: string;
  /** Same two looks as the signup field: the invite banner and the footer. */
  variant: "panel" | "inline";
  /** The number was saved. */
  onAdded: () => void;
  /** The visitor chose not to add one. */
  onSkip: () => void;
  className?: string;
}

const FALLBACK_ERROR = "We couldn't save your number. Please try again.";

/**
 * STEP 2 of the waitlist: right after the email is in, an optional mobile
 * number and SMS consent.
 *
 * A country picker and the number, nothing else: no code is texted to confirm
 * it. Collects and stores only. Nothing is texted from here and no SMS provider
 * is wired up, so the copy promises a text at launch and nothing sooner.
 *
 * The checkbox is a real checkbox and the button a real submit, so the whole
 * step works from the keyboard. Focus moves to the heading when the step
 * appears, because the form the visitor was in has just gone.
 */
export function WaitlistPhoneStep({
  email,
  variant,
  onAdded,
  onSkip,
  className,
}: WaitlistPhoneStepProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [phone, setPhone] = useState("");
  // This step only exists after a click, never in server HTML, so reading the
  // browser's language here cannot cause a hydration mismatch.
  const [country, setCountry] = useState<CountryCode>(() =>
    guessCountry(typeof navigator === "undefined" ? undefined : navigator.language),
  );
  const countries = useMemo(() => countryOptions(), []);
  const selectedDial = countries.find((option) => option.code === country)?.dial ?? "";
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const errorId = `${id}-error`;
  const panel = variant === "panel";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;

    // The server checks all of this again; this is the quick, kind version.
    if (!normalizePhone(phone, country)) return setError(PHONE_INVALID_MESSAGE);
    if (!consent) return setError(PHONE_CONSENT_MESSAGE);

    setError(null);
    setSending(true);
    try {
      const payload: WaitlistPhoneRequest = {
        email,
        phoneNumber: phone,
        phoneCountry: country,
        smsConsent: consent,
      };
      // The token is almost certainly cached from step 1; no token, no request.
      const appCheckToken = await getAppCheckToken();
      if (!appCheckToken) {
        setError("We couldn't verify your browser. Please refresh the page and try again.");
        setSending(false);
        return;
      }

      const response = await fetch("/api/waitlist/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", [APP_CHECK_HEADER]: appCheckToken },
        body: JSON.stringify(payload),
      });
      const result = (await response
        .json()
        .catch(() => null)) as WaitlistPhoneResponse | null;

      if (response.ok && result?.ok) {
        onAdded();
        return;
      }
      setError(result && !result.ok ? result.error : FALLBACK_ERROR);
    } catch {
      setError("Check your connection and try again.");
    }
    setSending(false);
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

      <p className="mt-3 mb-0 text-[13px] font-medium tracking-[0.04em] text-accent-lilac">
        Want early access even faster?
      </p>
      <p
        className={cn(
          "mt-1.5 mb-0 text-[14px]/[1.55] text-pretty",
          panel ? "text-[rgba(255,255,255,0.78)]" : "text-text-secondary",
        )}
      >
        Add your mobile number and we&apos;ll text you when Knocka launches.
      </p>

      <form className="mt-4 flex flex-col gap-3.5" onSubmit={submit} noValidate aria-busy={sending}>
        <div>
          <label
            htmlFor={`${id}-phone`}
            className="mb-1.5 block text-[12px] font-medium text-[rgba(255,255,255,0.7)]"
          >
            Mobile number (optional)
          </label>
          {/* One joined control: a compact country chip ("IN +91") and the
              number, sharing a single outline like a native phone field. The
              chip is only the visible face; a real <select> fills it,
              transparent, so tapping opens the platform's own country list,
              the keyboard works, and screen readers hear "Country, India
              (+91)". It never wraps: the chip is narrow enough for 320px. */}
          <div
            className={cn(
              "flex min-w-0 items-stretch overflow-hidden rounded-control border bg-[rgba(9,6,18,0.32)] transition-[border-color,background-color] duration-200 focus-within:bg-[rgba(9,6,18,0.5)]",
              error
                ? "border-[rgba(253,164,175,0.7)]"
                : "border-[rgba(255,255,255,0.24)] focus-within:border-[rgba(255,255,255,0.6)]",
            )}
          >
            <div className="relative flex shrink-0 items-center gap-1.5 border-r border-[rgba(255,255,255,0.14)] pr-2.5 pl-3 text-[14px] text-white transition-colors duration-200 hover:bg-[rgba(255,255,255,0.05)] has-[select:focus-visible]:bg-[rgba(255,255,255,0.08)]">
              <span aria-hidden="true" className="hidden font-semibold tracking-[0.02em] min-[360px]:inline">
                {country}
              </span>
              <span aria-hidden="true" className="text-[rgba(255,255,255,0.72)] tabular-nums">
                {selectedDial}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className="h-3 w-3 text-[rgba(255,255,255,0.55)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4.5 6 7.5 9 4.5" />
              </svg>
              <label htmlFor={`${id}-country`} className="sr-only">
                Country
              </label>
              <select
                id={`${id}-country`}
                name="phoneCountry"
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value as CountryCode);
                  if (error) setError(null);
                }}
                autoComplete="country"
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [color-scheme:dark]"
              >
                {countries.map((option) => (
                  <option key={option.code} value={option.code} className="bg-[#140a26] text-white">
                    {option.name} ({option.dial})
                  </option>
                ))}
              </select>
            </div>
            <input
              id={`${id}-phone`}
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={country === "US" || country === "CA" ? "(201) 555-0123" : "Mobile number"}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="w-0 min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[15px] text-white outline-none placeholder:text-[rgba(255,255,255,0.4)]"
            />
          </div>
        </div>

        <label
          htmlFor={`${id}-consent`}
          className="flex cursor-pointer items-start gap-2.5 text-[12px]/[1.5] text-[rgba(255,255,255,0.72)]"
        >
          <input
            id={`${id}-consent`}
            type="checkbox"
            name="smsConsent"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              if (error) setError(null);
            }}
            className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#a855f7]"
          />
          <span className="min-w-0 break-words">
            I agree to receive texts from Knocka. Message/data rates may apply.
            Reply STOP to opt out.
          </span>
        </label>

        {error && (
          <p
            id={errorId}
            role="alert"
            className={cn("m-0 text-[13px]", panel ? "text-[#ffe4e6]" : "text-[#fda4af]")}
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="shrink-0 disabled:cursor-wait disabled:opacity-70"
            arrow={!sending}
            magnetic={false}
            disabled={sending}
          >
            {sending ? "Adding…" : "Add my number"}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            disabled={sending}
            className="cursor-pointer rounded-sm bg-transparent p-1 text-[13px] text-[rgba(255,255,255,0.7)] underline underline-offset-4 transition-colors duration-200 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.7)] disabled:cursor-wait disabled:opacity-60"
          >
            Skip
          </button>
        </div>
      </form>
    </section>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { inviteUrl } from "@/lib/referral";
import { REFERRAL_TIERS } from "@/lib/waitlist";

export interface WaitlistReferralStepProps {
  /** The visitor's own code, from the signup response. */
  referralCode: string;
  /** Same two looks as the signup field: the invite banner and the footer. */
  variant: "panel" | "inline";
  /** What just happened in step 1–2, said once above the ask. */
  note: string;
  className?: string;
}

/** The message that travels with the link in the share sheet. */
const SHARE_TEXT = "Knock knock 👊 I just joined the Knocka waitlist. Join me:";

/**
 * STEP 3 of the waitlist: the visitor's own invite link and what inviting
 * earns. The server credits a referrer when a new address joins through the
 * link (`referralCount` on their record); nothing grants the rewards yet.
 *
 * Share opens the system sheet where there is one and copies the link where
 * there is not, so the one button always does something. The link is also
 * shown with its own Copy button, and it is in the confirmation email.
 *
 * Only ever rendered after a click, so reading `navigator` and `window` here
 * cannot cause a hydration mismatch. Focus moves to the heading on arrival,
 * because the form the visitor was in has just gone.
 */
export function WaitlistReferralStep({
  referralCode,
  variant,
  note,
  className,
}: WaitlistReferralStepProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const panel = variant === "panel";

  const url = inviteUrl(referralCode);
  const shown = url.replace(/^https?:\/\//, "");

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(resetTimer.current);
  }, []);

  const say = (text: string, didCopy: boolean) => {
    setMessage(text);
    setCopied(didCopy);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setMessage("");
      setCopied(false);
    }, 3200);
  };

  const copy = async () => {
    if (await copyText(url)) say("Link copied — paste it anywhere.", true);
    else say("Couldn't copy. Select the link above and copy it instead.", false);
  };

  const share = async () => {
    const data = { title: "Knocka", text: SHARE_TEXT, url };
    const canShare =
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(data));
    if (!canShare) return copy();
    try {
      await navigator.share(data);
    } catch {
      // AbortError: the visitor closed the sheet. Nothing to report.
    }
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
      <p
        role="status"
        className={cn(
          "m-0 text-[13px]/[1.5]",
          panel ? "text-[rgba(255,255,255,0.78)]" : "text-text-secondary",
        )}
      >
        ✦ {note}
      </p>

      <h3
        id={`${id}-title`}
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 mb-0 font-display text-[clamp(18px,1.6vw,22px)]/[1.2] font-[800] tracking-[-0.02em] text-balance text-text-primary outline-none"
      >
        Move up the Knocka early-access list
      </h3>
      <p
        className={cn(
          "mt-1.5 mb-0 text-[14px]/[1.55] text-pretty",
          panel ? "text-[rgba(255,255,255,0.78)]" : "text-text-secondary",
        )}
      >
        Invite friends. Everyone who joins with your link counts for you.
      </p>

      <ol className="mt-4 mb-0 grid list-none gap-2 p-0">
        {REFERRAL_TIERS.map(({ friends, reward }) => (
          <li key={friends} className="flex items-center gap-3 text-[14px] text-white">
            <span className="inline-flex h-7 min-w-[4.75rem] shrink-0 items-center justify-center rounded-pill border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-2.5 text-[12px] font-semibold tabular-nums text-accent-lilac">
              {friends} friend{friends === 1 ? "" : "s"}
            </span>
            <span aria-hidden="true" className="text-[rgba(255,255,255,0.45)]">
              →
            </span>
            <span className="min-w-0">{reward}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-col gap-2.5">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full"
          arrow
          magnetic={false}
          onClick={() => void share()}
        >
          Share Knocka
        </Button>

        {/* The link itself, selectable, with its own Copy: always works. */}
        <div className="flex min-w-0 items-center gap-1.5 rounded-control border border-[rgba(255,255,255,0.18)] bg-[rgba(9,6,18,0.32)] py-1 pr-1 pl-3.5">
          <label htmlFor={`${id}-link`} className="sr-only">
            Your invite link
          </label>
          <input
            id={`${id}-link`}
            readOnly
            value={shown}
            onFocus={(event) => event.currentTarget.select()}
            className="w-0 min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-[rgba(255,255,255,0.86)] outline-none"
          />
          <button
            type="button"
            onClick={() => void copy()}
            className="shrink-0 cursor-pointer rounded-[10px] bg-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[12px] font-medium text-white transition-colors duration-200 hover:bg-[rgba(255,255,255,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.7)]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "m-0 mt-2 min-h-[1.25em] text-[12px]",
          panel ? "text-[rgba(255,255,255,0.72)]" : "text-text-secondary",
        )}
      >
        {message}
      </p>
    </section>
  );
}

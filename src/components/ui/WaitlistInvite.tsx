"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { inviteUrl } from "@/lib/referral";
import { REFERRAL_TIERS } from "@/lib/waitlist";

export interface WaitlistInviteProps {
  /** The visitor's own code, from the signup response. */
  referralCode: string;
  /** Same two looks as the signup field: the invite banner and the footer. */
  variant: "panel" | "inline";
}

/** The message that travels with the link. */
const SHARE_TEXT = "Knock knock 👊 I just joined the Knocka waitlist. Join me:";

/**
 * The end of the "you're on the list" card, once a number is in: the visitor's
 * invite link and what inviting earns. The server credits a referrer when a new
 * address joins through the link (`referralCount`); nothing grants the rewards
 * yet.
 *
 * Share Knocka opens the system sheet where there is one and copies the link
 * where there is not, so the main button always does something. WhatsApp and
 * Email are plain links that arrive pre-filled; Copy link always works.
 *
 * Only ever rendered after a click, so reading `navigator` and `window` here
 * cannot cause a hydration mismatch.
 */
export function WaitlistInvite({ referralCode, variant }: WaitlistInviteProps) {
  const resetTimer = useRef<number | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const panel = variant === "panel";
  const muted = panel ? "text-[rgba(255,255,255,0.78)]" : "text-text-secondary";

  const url = inviteUrl(referralCode);
  const shareMessage = `${SHARE_TEXT} ${url}`;

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

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
    else say("Couldn't copy. Use WhatsApp or Email instead.", false);
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

  const pill =
    "inline-flex min-h-9 items-center justify-center rounded-pill border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.06)] px-3.5 text-[13px] font-medium text-white no-underline transition-colors duration-200 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.7)] cursor-pointer";

  return (
    <div className="mt-4">
      <p className="m-0 font-display text-[15px]/[1.3] font-[700] tracking-[-0.01em] text-white">
        Move up the Knocka early-access list
      </p>
      <p className={cn("mt-1 mb-0 text-[13px]/[1.5] text-pretty", muted)}>
        Invite friends. Everyone who joins with your link counts for you.
      </p>

      <ol className="mt-3 mb-0 grid list-none gap-1.5 p-0">
        {REFERRAL_TIERS.map(({ friends, reward }) => (
          <li key={friends} className="flex items-center gap-2.5 text-[13px] text-white">
            <span className="inline-flex min-w-[4.5rem] shrink-0 justify-center rounded-pill border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-accent-lilac">
              {friends} friend{friends === 1 ? "" : "s"}
            </span>
            <span className="min-w-0">{reward}</span>
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="primary"
        size="md"
        className="mt-4 w-full"
        arrow
        magnetic={false}
        onClick={() => void share()}
      >
        Share Knocka
      </Button>

      <ul className="mt-2.5 mb-0 flex list-none flex-wrap gap-2 p-0" aria-label="More ways to share">
        <li>
          <a
            className={pill}
            href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </li>
        <li>
          <a
            className={pill}
            href={`mailto:?subject=${encodeURIComponent("Join me on Knocka")}&body=${encodeURIComponent(shareMessage)}`}
          >
            Email
          </a>
        </li>
        <li>
          <button type="button" className={pill} onClick={() => void copy()}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </li>
      </ul>

      <p
        role="status"
        aria-live="polite"
        className={cn("m-0 mt-2 min-h-[1.25em] text-[12px]", copied ? "text-[#6ee7b7]" : muted)}
      >
        {message}
      </p>
    </div>
  );
}

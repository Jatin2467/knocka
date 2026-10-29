"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { CheckIcon, LinkIcon, MailIcon, WhatsAppIcon } from "@/components/ui/ShareIcons";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { inviteUrl } from "@/lib/referral";

export interface WaitlistInviteProps {
  /** The visitor's own code, from the signup response. */
  referralCode: string;
  /** Same two looks as the signup field: the invite banner and the footer. */
  variant: "panel" | "inline";
}

/** The message that travels with the link. */
const SHARE_TEXT = "Knock knock 👊 I just joined the Knocka waitlist. Join me:";

/** Three of the cast, as in the Share section, so the ask feels like sending it to someone. */
const FACES = [
  "/avatar-profile-img/avatar1.png",
  "/avatar-profile-img/avatar3.png",
  "/avatar-profile-img/avatar6.png",
] as const;

/**
 * The end of the "you're on the list" card, once a number is in: a plain ask
 * to bring friends. No rewards are offered, so none are promised. The link is
 * the visitor's own (`/?ref=code`); the server counts who joins through it
 * (`referralCount`), quietly.
 *
 * Share Knocka opens the system sheet where there is one and copies the link
 * where there is not, so the main button always does something. WhatsApp and
 * Email arrive pre-filled; Copy link always works.
 *
 * Only ever rendered after a click, so reading `navigator` and `window` here
 * cannot cause a hydration mismatch.
 */
export function WaitlistInvite({ referralCode, variant }: WaitlistInviteProps) {
  const resetTimer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const muted = variant === "panel" ? "text-[rgba(255,255,255,0.78)]" : "text-text-secondary";

  const url = inviteUrl(referralCode);
  const shareMessage = `${SHARE_TEXT} ${url}`;

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const copy = async () => {
    const ok = await copyText(url);
    setCopied(ok);
    setFailed(!ok);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 3200);
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
    "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-pill border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.06)] px-3.5 text-[13px] font-medium text-white no-underline transition-colors duration-200 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.7)] [&>svg]:h-4 [&>svg]:w-4";

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="flex shrink-0 pl-2" aria-hidden="true">
          {FACES.map((src) => (
            <Image
              key={src}
              src={src}
              alt=""
              width={64}
              height={64}
              className="-ml-2 h-8 w-8 rounded-full border-2 border-[#1a1030] bg-[#1a1030] object-cover"
            />
          ))}
        </span>
        <div className="min-w-0">
          <p className="m-0 font-display text-[15px]/[1.3] font-[700] tracking-[-0.01em] text-white">
            Bring your friends
          </p>
          <p className={cn("m-0 text-[13px]/[1.45] text-pretty", muted)}>
            Knocka is better when someone knocks back.
          </p>
        </div>
      </div>

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
            <WhatsAppIcon />
            WhatsApp
          </a>
        </li>
        <li>
          <a
            className={pill}
            href={`mailto:?subject=${encodeURIComponent("Join me on Knocka")}&body=${encodeURIComponent(shareMessage)}`}
          >
            <MailIcon />
            Email
          </a>
        </li>
        <li>
          <button
            type="button"
            className={cn(pill, copied && "border-[rgba(52,211,153,0.5)] bg-[rgba(52,211,153,0.16)]")}
            onClick={() => void copy()}
          >
            {copied ? <CheckIcon /> : <LinkIcon />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </li>
      </ul>

      {/* Announces the copy, and says so when the browser refused it. */}
      <p role="status" aria-live="polite" className={cn("m-0 mt-2 min-h-[1.25em] text-[12px]", muted)}>
        {copied ? "Link copied — paste it anywhere." : failed ? "Couldn't copy. Use WhatsApp or Email instead." : ""}
      </p>
    </div>
  );
}

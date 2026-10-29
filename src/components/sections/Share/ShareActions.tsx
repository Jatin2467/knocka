"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  CheckIcon,
  InstagramIcon,
  LinkIcon,
  MailIcon,
  ShareIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/ShareIcons";
import { copyText } from "@/lib/clipboard";
import { inviteUrl, ownReferral, subscribeOwnReferral } from "@/lib/referral";

/** Only the link is shared for now; the subject is just a label for mail. */
const MAIL_SUBJECT = "Knocka";

const noSubscribe = () => () => {};

/**
 * The site's own address, without path or hash — or, once this visitor has
 * joined the waitlist, their invite link (`/?ref=code`), so sharing from here
 * counts for them too. Empty on the server.
 */
const useSiteUrl = () =>
  useSyncExternalStore(
    subscribeOwnReferral,
    () => inviteUrl(ownReferral()),
    () => "",
  );

/** Whether this browser has a system share sheet (phones, Safari, Edge, Chrome on Windows/Android). */
const useCanShare = (url: string) =>
  useSyncExternalStore(
    noSubscribe,
    () =>
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare({ url })),
    () => false,
  );

/* ------------------------------------------------------------------ */
/*  Destinations                                                       */
/* ------------------------------------------------------------------ */

interface Tile {
  key: string;
  label: string;
  hint: string;
  icon: ReactNode;
  /** The link to open. Receives the encoded site URL. */
  href: (encoded: string) => string;
  /** Set for apps with no web share link: the URL is copied, then the app opens. */
  copies?: string;
  newTab?: boolean;
}

/*
  WhatsApp and mail take the link in the address, so the message arrives
  filled in. Instagram and TikTok have no such address — neither lets a web
  page start a share — so those two copy the link first and then open the
  app (or its site) at the messages, ready to paste.
*/
const TILES: readonly Tile[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    hint: "Opens a chat",
    icon: <WhatsAppIcon />,
    href: (encoded) => `https://wa.me/?text=${encoded}`,
    newTab: true,
  },
  {
    key: "instagram",
    label: "Instagram",
    hint: "Copies link",
    icon: <InstagramIcon />,
    href: () => "https://www.instagram.com/direct/inbox/",
    copies: "Link copied — paste it in an Instagram message or your story.",
    newTab: true,
  },
  {
    key: "tiktok",
    label: "TikTok",
    hint: "Copies link",
    icon: <TikTokIcon />,
    href: () => "https://www.tiktok.com/messages",
    copies: "Link copied — paste it in a TikTok message or your bio.",
    newTab: true,
  },
  {
    key: "email",
    label: "Email",
    hint: "Opens mail",
    icon: <MailIcon />,
    href: (encoded) => `mailto:?subject=${MAIL_SUBJECT}&body=${encoded}`,
  },
];

/**
 * The share controls.
 *
 * - **Share Knocka** opens the system share sheet where the browser has one
 *   (phones, Safari, Edge and Chrome on Windows) — every app installed on the
 *   device is in it. It is hidden where there is no sheet.
 * - **The link bar** shows the address with a Copy button; it always works.
 * - **The tiles** are plain links, so they work with no sheet at all.
 *
 * Only the link is shared: the site URL, or the visitor's invite link once
 * they have joined. A dismissed sheet is not an error.
 */
export function ShareActions() {
  const url = useSiteUrl();
  const canShare = useCanShare(url);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

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

  const share = async () => {
    try {
      await navigator.share({ url });
    } catch {
      // AbortError: the visitor closed the sheet. Nothing to report.
    }
  };

  /** Not awaited by the tiles: the link must open inside the same tap. */
  const copy = async (success = "Link copied — paste it anywhere.") => {
    const ok = await copyText(url);
    if (ok) say(success, true);
    else say("Couldn't copy. Copy the address from your browser bar instead.", false);
  };

  const encoded = encodeURIComponent(url);
  const ready = url !== "";
  const shown = ready ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";

  return (
    <div className="share-actions">
      {canShare && (
        <button type="button" className="share-main" onClick={share}>
          <ShareIcon />
          Share Knocka
          <span className="share-main-hint">Pick any app</span>
        </button>
      )}

      <div className="share-link">
        <LinkIcon />
        <span className="share-link-url">{shown}</span>
        <button
          type="button"
          className="share-copy-btn"
          data-done={copied || undefined}
          onClick={() => void copy()}
        >
          {copied ? <CheckIcon /> : null}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <ul className="share-tiles" aria-label="Share on">
        {TILES.map((tile) => (
          <li key={tile.key}>
            <a
              className={`share-tile share-tile-${tile.key}`}
              href={ready ? tile.href(encoded) : undefined}
              target={tile.newTab ? "_blank" : undefined}
              rel={tile.newTab ? "noopener noreferrer" : undefined}
              onClick={tile.copies ? () => void copy(tile.copies) : undefined}
            >
              <span className="share-tile-icon">{tile.icon}</span>
              <span className="share-tile-label">{tile.label}</span>
              <span className="share-tile-hint">{tile.hint}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="share-status" role="status" aria-live="polite" data-ok={copied || undefined}>
        {message}
      </p>
    </div>
  );
}


"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/** Only the link is shared for now; the subject is just a label for mail. */
const MAIL_SUBJECT = "Knocka";

const noSubscribe = () => () => {};

/** The site's own address, without path, query or hash. Empty on the server. */
const useSiteUrl = () =>
  useSyncExternalStore(
    noSubscribe,
    () => `${window.location.origin}/`,
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
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const STROKE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

function ShareIcon() {
  return (
    <svg {...STROKE}>
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="m8.3 10.8 7.4-4.4M8.3 13.2l7.4 4.4" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 9.88 9.9c0 5.45-4.44 9.87-9.89 9.87ZM20.46 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.23-6.16-3.48-8.41Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...STROKE}>
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...STROKE}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7.5 8 6 8-6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...STROKE}>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...STROKE}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

/** Clipboard API where allowed (secure contexts); a hidden textarea otherwise. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
    }
  }
}

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
 * Only the site URL is shared. A dismissed sheet is not an error.
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


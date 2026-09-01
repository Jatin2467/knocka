export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface PrimaryNavLink extends NavLink {
  /**
   * False while the target section does not exist yet. Unready links stay in
   * the list so the intended navigation is visible in one place, but they are
   * never rendered — a link that scrolls nowhere is a broken link. The phase
   * that builds each section flips its flag.
   */
  readonly ready: boolean;
}

export const siteConfig = {
  name: "Knocka",
  title: "Knocka — Feel the Message",
  description:
    "Messages that feel human. Express yourself with emotion, voice, movement and presence.",
} as const;

/**
 * The full intended navigation, in final order — page order, top to bottom.
 *
 * Every entry points at a section that is actually on the page, so every
 * label in the bar goes somewhere. The hero is deliberately absent: the
 * wordmark is already the way back to the top.
 *
 * Anchors rely on `scroll-margin-top` in base.css to clear the floating
 * header; without it every jump lands with the section heading tucked
 * behind the bar.
 */
export const navLinks: readonly PrimaryNavLink[] = [
  // S2, the flat-to-arrival sequence. It was labelled "Flow & Motivi", which
  // was never resolved with the client and told a visitor nothing.
  { label: "Why Knocka", href: "#arrival", ready: true },
  { label: "How it works", href: "#how", ready: true },
  { label: "Rooms", href: "#rooms", ready: true },
  { label: "Expressions", href: "#expression", ready: true },
  // Target section S5 is not built.
  { label: "Modes", href: "#modes", ready: false },
  // Retained pending client confirmation on whether the page has an FAQ.
  { label: "FAQ", href: "#faq", ready: false },
];

/** The only links safe to render today. */
export const activeNavLinks: readonly NavLink[] = navLinks.filter(
  (link) => link.ready,
);

export interface FooterGroup {
  readonly title: string;
  readonly links: readonly NavLink[];
}

/**
 * Footer navigation. The "Explore" group mirrors the header — and, like the
 * header, lists only sections that actually exist. The rest are placeholder
 * destinations (href "#") until those pages exist.
 */
export const footerGroups: readonly FooterGroup[] = [
  { title: "Explore", links: activeNavLinks },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press kit", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Cookies", href: "#" },
      { label: "Safety", href: "#" },
    ],
  },
];

export const socialGroup: FooterGroup = {
  title: "Social",
  links: [
    { label: "Instagram", href: "#" },
    { label: "TikTok", href: "#" },
    { label: "X", href: "#" },
    { label: "YouTube", href: "#" },
  ],
};

export interface Room {
  readonly id: string;
  readonly ordinal: string;
  readonly name: string;
  readonly line: string;
  readonly video: string;
  /** Portal glow for this world. The three step through the brand gradient. */
  readonly glow: string;
}

export const rooms: readonly Room[] = [
  {
    id: "coffee-shop",
    ordinal: "01",
    name: "Coffee shop",
    line: "Slow conversations.",
    video: "/videos/coffee-shop.mp4",
    glow: "168, 85, 247",
  },
  {
    id: "disco-club",
    ordinal: "02",
    name: "Disco club",
    line: "Turn the moment up.",
    video: "/videos/disco-club.mp4",
    glow: "236, 72, 153",
  },
  {
    id: "ice-cream-shop",
    ordinal: "03",
    name: "Ice cream shop",
    line: "Just hanging out.",
    video: "/videos/ice-cream-shop.mp4",
    glow: "56, 189, 248",
  },
];

/* ---------------------------------------------------------------
   S2 — The Flat -> The Arrival
--------------------------------------------------------------- */

export interface ThreadMessage {
  readonly id: string;
  /** "them" renders left-aligned, "you" right-aligned. */
  readonly from: "them" | "you";
  readonly text: string;
}

/**
 * The ordinary conversation S2 opens on. Deliberately dull and deliberately
 * short — this is a sketch of texting, not a messaging-app clone.
 *
 * TEMPORARY COPY. Placeholder dialogue chosen to be universally recognisable;
 * not client-approved. See docs/LANDING_PAGE_STRATEGY.md.
 */
export const arrivalThread: readonly ThreadMessage[] = [
  { id: "m1", from: "you", text: "hey" },
  { id: "m2", from: "them", text: "hey" },
  { id: "m3", from: "you", text: "what's up?" },
  { id: "m4", from: "them", text: "nothing much" },
  { id: "m5", from: "you", text: "you free later?" },
  { id: "m6", from: "them", text: "idk" },
  { id: "m7", from: "you", text: "lol" },
  { id: "m8", from: "them", text: "k" },
];

interface ArrivalMediaBase {
  readonly src: string;
  readonly alt: string;
  /** Frame aspect ratio, as a CSS `aspect-ratio` value. */
  readonly ratio: string;
}

export type ArrivalMediaSource =
  | (ArrivalMediaBase & {
      readonly kind: "image";
      readonly width: number;
      readonly height: number;
    })
  | (ArrivalMediaBase & {
      readonly kind: "video";
      readonly poster?: string;
      /** Seconds from playback start to each of the two knock marks. */
      readonly knockBeats: readonly [number, number];
    });

/**
 * What arrives in S2's frame.
 *
 * RESOLVED: the client asked for the welcome video here, so open question 1
 * ("no welcome video" meaning not-in-the-hero, or nowhere) is answered — it
 * belongs in S2's frame, with sound.
 *
 * `ratio` is not decoration. The frame was authored at 4:3 on the assumption
 * that the welcome video was 1440x1080; it is actually **1440x1440**, square.
 * The frame follows this value, so the media and its container can never
 * disagree again.
 *
 * `knockBeats` are measured, not chosen. The audio track has six knock
 * transients at 0.39, 0.77, 1.04, 1.30, 1.64 and 1.96 seconds; the two marks
 * ride the first two, so the typography lands on real hits instead of running
 * a rhythm of its own beside them.
 */
export const arrivalMedia: ArrivalMediaSource = {
  kind: "video",
  src: "/videos/Knocka-Welcome-Dark-optimized.mp4",
  alt: "A Knocka avatar knocking to arrive through a message frame",
  ratio: "1 / 1",
  knockBeats: [0.39, 0.77],
};

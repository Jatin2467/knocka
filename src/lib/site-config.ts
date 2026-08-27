export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export const siteConfig = {
  name: "Knocka",
  title: "Knocka — Feel the Message",
  description:
    "Messages that feel human. Express yourself with emotion, voice, movement and presence.",
} as const;

export const navLinks: readonly NavLink[] = [
  { label: "Flow & Motivi", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Modes", href: "#modes" },
  { label: "FAQ", href: "#faq" },
];

export interface FooterGroup {
  readonly title: string;
  readonly links: readonly NavLink[];
}

/**
 * Footer navigation. The "Explore" group mirrors the header; the rest are
 * placeholder destinations (href "#") until those pages exist.
 */
export const footerGroups: readonly FooterGroup[] = [
  { title: "Explore", links: navLinks },
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

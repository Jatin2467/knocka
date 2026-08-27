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
  { label: "Flow & Motiv", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Modes", href: "#modes" },
  { label: "FAQ", href: "#faq" },
];

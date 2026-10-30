import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";

import { Aos } from "@/components/animation/Aos";
import { BackgroundMusic } from "@/components/animation/BackgroundMusic";
import { SmoothScroll } from "@/components/animation/SmoothScroll";
import { siteConfig } from "@/lib/site-config";
import { siteUrl } from "@/lib/server/site-url";

import "./globals.css";

/**
 * Outfit carries the display voice: geometric, rounded and youthful, so it
 * sits naturally next to the Knocka wordmark at poster sizes. Inter stays on
 * body copy, which is the stack the project already declared.
 */
const display = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const NOSCRIPT_REVEAL = [
  ".text-reveal-inner",
  ".hero-eyebrow",
  ".hero-lead",
  ".hero-cta-row",
  ".hero-scroll-cue",
  ".knock-portal-art",
  ".site-header",
].join(",") + "{opacity:1!important;transform:none!important}";

// The footer and the invite banner are not listed: their reveals are AOS,
// whose hidden state is gated on the .aos-init class AOS itself adds. No
// script, no class, no hidden content — see styles/aos.css.

/*
  The link-preview image is not set here: src/app/opengraph-image.jpg and
  twitter-image.jpg (made by scripts/og-image.mjs) are picked up by Next, which
  writes og:image / twitter:image with their size, type and alt text.
  metadataBase turns those, and every relative URL below, into absolute ones —
  crawlers ignore relative image URLs.
*/
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: siteConfig.title,
  description: siteConfig.metaDescription,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  category: "social networking",
  // Invite links are /?ref=code; they all point search engines at the root.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.metaDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.metaDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#030305",
  colorScheme: "dark",
};

/** What Knocka is, for search engines: the organisation and its site. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": new URL("/#organization", siteUrl).href,
      name: siteConfig.name,
      url: siteUrl.href,
      logo: new URL("/branding/knocka-avatar-logo.png", siteUrl).href,
      email: "knocka@weknocka.com",
    },
    {
      "@type": "WebSite",
      "@id": new URL("/#website", siteUrl).href,
      name: siteConfig.name,
      url: siteUrl.href,
      description: siteConfig.metaDescription,
      inLanguage: "en",
      publisher: { "@id": new URL("/#organization", siteUrl).href },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior is required in Next 16 for the framework to
    // keep honouring `scroll-behavior: smooth` across navigations.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable}`}
    >
      <body>
        {/* The entrance animations render their initial (hidden) state on
            the server, so without JS the hero would never be revealed. */}
        <noscript>
          <style>{NOSCRIPT_REVEAL}</style>
        </noscript>
        <script
          type="application/ld+json"
          // `<` escaped so no string in the payload can close the tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        <SmoothScroll />
        <Aos />
        <BackgroundMusic />
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";

const TITLE = "Knocka — Coming Soon | Feel the Message";
const DESCRIPTION =
  "Something exciting is about to knock. Discover Knocka, a new way to bring messages to life.";

/**
 * The Coming Soon page's title and descriptions, layered over the root
 * layout's metadata by app/page.tsx while the page is live.
 *
 * Next replaces `openGraph` and `twitter` as whole objects rather than
 * merging them, so every field the layout sets is restated here. Everything
 * else — metadataBase, the canonical, robots, the icons and the
 * opengraph-image / twitter-image files — still comes from the layout and
 * the app directory, untouched.
 */
export const comingSoonMetadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

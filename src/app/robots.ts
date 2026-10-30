import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/server/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The waitlist endpoints are for the page's own forms, not for indexing.
      disallow: "/api/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}

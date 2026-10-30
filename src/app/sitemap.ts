import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/server/site-url";

/** One page today. Add an entry here when a new route ships. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl.href,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      images: [new URL("/opengraph-image.jpg", siteUrl).href],
    },
  ];
}

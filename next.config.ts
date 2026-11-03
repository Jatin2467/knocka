import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Next serves public/ with `max-age=0`, so App Hosting's CDN never
        // kept the music and every play went back to Cloud Run. The page
        // requests it as /music.mp3?v=<version> (BackgroundMusic.tsx), and a
        // new file always ships with a new version, so it is safe to keep
        // for a year. Videos keep the default until they are reviewed.
        source: "/music.mp3",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // The page at / is prerendered, so Next marks its HTML
        // `s-maxage=31536000`: App Hosting's Cloud CDN may then keep it for a
        // year, and whether a rollout purges it is not documented. That is
        // how a retired page can stay visible. Five minutes at the CDN and
        // none in the browser bounds how long any version of / outlives the
        // rollout that replaces it. Applies to the HTML only: /_next/static
        // keeps its own immutable caching.
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=300" },
        ],
      },
    ];
  },
};

export default nextConfig;

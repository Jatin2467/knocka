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
    ];
  },
};

export default nextConfig;

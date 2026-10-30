/** The live address, used when SITE_URL is missing or malformed. */
const PRODUCTION_ORIGIN = "https://knocka--knocka-75c63.us-east4.hosted.app";

function origin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * The public site origin for the page's metadata: the canonical URL, og:url,
 * the absolute og:image address, robots.txt and the sitemap.
 *
 * From SITE_URL, which therefore has to be available at BUILD time on App
 * Hosting (apphosting.yaml): the page is prerendered, so its <head> is written
 * during the build. A build without it falls back to the live address rather
 * than shipping link previews that point at localhost.
 */
export const siteUrl = new URL(origin(process.env.SITE_URL) ?? PRODUCTION_ORIGIN);

/**
 * Composes the 1200x630 link-preview card (Open Graph / X) from the landing
 * page's own artwork: the wordmark, the hero copy and the knocking avatar.
 *
 * The output is committed, not generated at build: crawlers (WhatsApp in
 * particular) are most reliable with a small static JPEG. Re-run after a
 * brand or copy change:
 *
 *   node scripts/og-image.mjs
 *
 * It writes src/app/opengraph-image.jpg and src/app/twitter-image.jpg, which
 * Next turns into the og:image / twitter:image tags.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputs = ["src/app/opengraph-image.jpg", "src/app/twitter-image.jpg"];

const W = 1200;
const H = 630;

const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="purple" cx="22%" cy="85%" r="60%">
      <stop offset="0" stop-color="#7627ed" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#7627ed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="magenta" cx="88%" cy="8%" r="50%">
      <stop offset="0" stop-color="#ec4899" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cyan" cx="92%" cy="100%" r="45%">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="halo" cx="74%" cy="50%" r="34%">
      <stop offset="0" stop-color="#a855f7" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="brand" gradientUnits="userSpaceOnUse" x1="80" y1="0" x2="500" y2="0">
      <stop offset="0" stop-color="#c084fc"/>
      <stop offset="0.55" stop-color="#ec4899"/>
      <stop offset="1" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#030305"/>
  <rect width="100%" height="100%" fill="url(#purple)"/>
  <rect width="100%" height="100%" fill="url(#magenta)"/>
  <rect width="100%" height="100%" fill="url(#cyan)"/>
  <rect width="100%" height="100%" fill="url(#halo)"/>

  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="84" y="150" fill="#d8b4fe" font-size="22" font-weight="600" letter-spacing="4">✦ AVATAR MESSAGING</text>
    <text x="80" y="402" fill="#ffffff" font-size="58" font-weight="700">Feel the message.</text>
    <text x="80" y="470" fill="url(#brand)" font-size="46" font-weight="700">Don't text, arrive.</text>
    <text x="84" y="540" fill="#94a3b8" font-size="24" font-weight="400">Messages that feel human — emotion, voice and presence.</text>
  </g>
</svg>`);

async function main() {
  const wordmark = await sharp(path.join(root, "public/branding/knocka-logo.svg"), { density: 400 })
    .resize({ width: 470 })
    .png()
    .toBuffer();
  const avatar = await sharp(path.join(root, "public/branding/knocka-avatar-logo.png"))
    .resize({ height: 500 })
    .png()
    .toBuffer();

  const card = await sharp(background)
    .composite([
      { input: wordmark, left: 78, top: 182 },
      { input: avatar, left: 640, top: 52 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();

  for (const output of outputs) {
    fs.writeFileSync(path.join(root, output), card);
    console.log(output, card.length, "bytes");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

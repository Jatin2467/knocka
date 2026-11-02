/**
 * Builds the site icons from the brand artwork:
 *
 *  - src/app/icon.svg and src/app/favicon.ico (16/32/48): the gradient "K"
 *    from the wordmark on a dark tile. The avatar is unreadable at tab size;
 *    the letter is not.
 *  - src/app/apple-icon.png (180): the knocking avatar, for home screens,
 *    where there is room for it. iOS fills transparency with black, so it
 *    sits on the page's own dark ground instead.
 *
 * Re-run after a brand change:
 *
 *   node scripts/icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "src/app");

const wordmark = fs.readFileSync(path.join(root, "public/branding/knocka-logo.svg"), "utf8");
// The wordmark's first path is the K.
const kPath = wordmark.match(/<path d="M11\.0924[^"]*"/)?.[0];
if (!kPath) throw new Error("The K path was not found in knocka-logo.svg");

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="k" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#2B6CFF"/>
      <stop offset="0.5" stop-color="#8B3FFA"/>
      <stop offset="1" stop-color="#F84FC9"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#0b080d"/>
  <g transform="translate(6.3 4.4) scale(0.9)">${kPath} fill="url(#k)"/></g>
</svg>
`;

/** An .ico holding PNG images, which every browser since IE Vista reads. */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)]);
}

async function appleIcon() {
  const SIZE = 180;
  const INNER = 150;
  const avatar = await sharp(path.join(root, "public/branding/knocka-avatar-logo.png"))
    .trim()
    .resize(INNER, INNER, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: "#0b080d" } })
    .composite([{ input: avatar, left: (SIZE - INNER) / 2, top: (SIZE - INNER) / 2 }])
    .png()
    .toBuffer();
}

async function main() {
  fs.writeFileSync(path.join(appDir, "icon.svg"), iconSvg);

  const pngs = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      data: await sharp(Buffer.from(iconSvg), { density: 600 }).resize(size, size).png().toBuffer(),
    })),
  );
  fs.writeFileSync(path.join(appDir, "favicon.ico"), ico(pngs));

  fs.writeFileSync(path.join(appDir, "apple-icon.png"), await appleIcon());

  for (const file of ["icon.svg", "favicon.ico", "apple-icon.png"]) {
    console.log(`src/app/${file}`, fs.statSync(path.join(appDir, file)).size, "bytes");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

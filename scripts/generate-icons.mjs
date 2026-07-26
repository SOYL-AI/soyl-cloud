/**
 * Regenerates every app icon from `public/images/logo.png`.
 *
 *   node scripts/generate-icons.mjs
 *
 * Why this exists: `src/app/icon.png` used to be the full 1024x1024 285 KB
 * logo, shipped on every page as the favicon — the single heaviest request on
 * the site (REPO-AUDIT.md §7). Icons are now generated at the sizes browsers
 * actually ask for, and this script is committed so the next person does not
 * have to guess how they were made.
 *
 * The source logo has ~25% transparent margin on every side. At 32x32 that
 * margin is what makes the mark unreadable in a browser tab, so the artwork is
 * trimmed and re-padded to a deliberate 8%.
 *
 * `sharp` is not a direct dependency — it arrives with `next` (the image
 * optimizer). That is fine for a manual build-time script; do not import it
 * from application code.
 */
import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "public/images/logo.png");

/** Brand charcoal — Apple touch icons are composited on an opaque background. */
const APPLE_BACKGROUND = "#1A1F25";
const PAD_RATIO = 0.08;

/** Trimmed artwork at `size`px square, transparent, padded by PAD_RATIO. */
async function mark(size) {
  const inner = Math.round(size * (1 - PAD_RATIO * 2));
  const art = await sharp(SOURCE)
    .trim({ threshold: 1 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: art, gravity: "center" }])
    .png(PNG)
    .toBuffer();
}

/**
 * Palette quantisation with a bounded colour count. The mark is a flat
 * two-tone logo, so 64 colours is visually lossless at icon sizes and is what
 * keeps `src/app/icon.png` — the one fetched on every page — well under the
 * 15 KB budget.
 */
const PNG = { compressionLevel: 9, palette: true, colours: 64, effort: 10 };

/**
 * Packs PNG buffers into a multi-size .ico.
 *
 * ICONDIR (6 bytes) + one 16-byte ICONDIRENTRY per image + the PNG payloads.
 * PNG-in-ICO is understood by every browser we support.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function write(relative, data) {
  await writeFile(path.join(root, relative), data);
  console.log(`${relative.padEnd(32)} ${(data.length / 1024).toFixed(1)} KB`);
}

// 96px covers a 48px tab icon on a 2x display, which is the largest size any
// browser actually asks a favicon for. Android home-screen sizes come from the
// manifest, not from here.
const [ico16, ico32, ico48, icon96, icon512] = await Promise.all(
  [16, 32, 48, 96, 512].map(mark),
);

await write(
  "src/app/favicon.ico",
  ico([
    { size: 16, data: ico16 },
    { size: 32, data: ico32 },
    { size: 48, data: ico48 },
  ]),
);
await write("src/app/icon.png", icon96);
await write("public/icon-512.png", icon512);

// Apple touch icons ignore transparency and are not rounded by the OS, so this
// one is composited onto brand charcoal at the platform's expected 180px.
await write(
  "src/app/apple-icon.png",
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: APPLE_BACKGROUND },
  })
    .composite([{ input: await mark(180), gravity: "center" }])
    .png(PNG)
    .toBuffer(),
);

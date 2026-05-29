#!/usr/bin/env node
// Generates responsive WebP + JPG variants for /public images so the site can
// ship modern formats and right-sized files via <picture> + srcset.
//
// Output per source image (e.g. T1.jpg):
//   T1.webp         — full size, WebP (used on desktop / hero)
//   T1-sm.webp      — 500w cap, WebP (used in thumbnails on mobile/small grid)
//   T1-sm.jpg       — 500w cap, JPG fallback
// The original JPG (T1.jpg) is left untouched and serves as the desktop JPG fallback.

import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');

const targets = [
  { dir: path.join(ROOT, 'public/trailers'), pattern: /\.(jpe?g)$/i },
  { file: path.join(ROOT, 'public/logo.jpeg'), smallWidth: 336 },
];

const SMALL_WIDTH = 500;
const WEBP_QUALITY = 78;
const JPG_QUALITY = 82;

async function processFile(input, smallW) {
  const dir = path.dirname(input);
  const base = path.basename(input, path.extname(input));
  const img = await loadImage(input);
  const ratio = img.height / img.width;

  // Full-size WebP — same dimensions as source.
  const cvFull = createCanvas(img.width, img.height);
  cvFull.getContext('2d').drawImage(img, 0, 0);
  const fullWebp = await cvFull.encode('webp', WEBP_QUALITY);
  await fs.writeFile(path.join(dir, `${base}.webp`), fullWebp);

  // Small variant.
  const smW = Math.min(smallW, img.width);
  const smH = Math.round(smW * ratio);
  const cvSm = createCanvas(smW, smH);
  cvSm.getContext('2d').drawImage(img, 0, 0, smW, smH);
  const smWebp = await cvSm.encode('webp', WEBP_QUALITY);
  const smJpg = await cvSm.encode('jpeg', JPG_QUALITY);
  await fs.writeFile(path.join(dir, `${base}-sm.webp`), smWebp);
  await fs.writeFile(path.join(dir, `${base}-sm.jpg`), smJpg);

  console.log(
    `${base}: full=${(fullWebp.length / 1024).toFixed(1)}KB webp (${img.width}w) | ` +
      `sm=${(smWebp.length / 1024).toFixed(1)}KB webp, ${(smJpg.length / 1024).toFixed(1)}KB jpg (${smW}w)`
  );
}

// Clean stale variants from prior runs that used different naming.
async function cleanStale(dir) {
  const entries = await fs.readdir(dir).catch(() => []);
  for (const name of entries) {
    if (/-\d+\.(webp|jpg)$/.test(name)) {
      await fs.unlink(path.join(dir, name));
    }
  }
}

for (const target of targets) {
  if (target.file) {
    await cleanStale(path.dirname(target.file));
    await processFile(target.file, target.smallWidth);
    continue;
  }
  await cleanStale(target.dir);
  const entries = await fs.readdir(target.dir);
  for (const name of entries) {
    if (!target.pattern.test(name)) continue;
    if (name.includes('-sm.')) continue; // already a variant
    await processFile(path.join(target.dir, name), SMALL_WIDTH);
  }
}

console.log('Done.');

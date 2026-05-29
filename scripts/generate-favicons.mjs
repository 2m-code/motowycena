import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const logo = await loadImage(join(root, 'public/logo.jpeg'));

// Logo 1536×1024. Górny symbol (e w okręgu + przyczepa) = ~x:300-1300, y:170-600.
// Wycinamy ten poziomy pasek i wstawiamy w kwadrat z białym paddingiem.
const srcX = 300;
const srcY = 170;
const srcW = 1000;
const srcH = 430;

function generate(size, outName) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Skaluj symbol do szerokości canvasu, wycentruj pionowo z paddingiem.
  const scale = size / srcW;
  const drawH = srcH * scale;
  const offsetY = (size - drawH) / 2;
  ctx.drawImage(logo, srcX, srcY, srcW, srcH, 0, offsetY, size, drawH);

  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(root, 'public', outName), buf);
  console.log(`✓ ${outName} - ${(buf.length / 1024).toFixed(1)} kB`);
}

generate(32, 'favicon-32.png');
generate(64, 'favicon-64.png');
generate(180, 'apple-touch-icon.png');

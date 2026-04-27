import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const W = 1200;
const H = 630;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// --- tło: zdjęcie T1.jpg + dark overlay ---
const photo = await loadImage(join(root, 'public/trailers/T1.jpg'));

// skaluj cover
const scale = Math.max(W / photo.width, H / photo.height);
const sw = photo.width * scale;
const sh = photo.height * scale;
const sx = (W - sw) / 2;
const sy = (H - sh) / 2;
ctx.drawImage(photo, sx, sy, sw, sh);

// gradient lewy (ciemny do przezroczystego)
const gradL = ctx.createLinearGradient(0, 0, W * 0.75, 0);
gradL.addColorStop(0, 'rgba(10,18,35,0.97)');
gradL.addColorStop(0.55, 'rgba(10,18,35,0.82)');
gradL.addColorStop(1, 'rgba(10,18,35,0.25)');
ctx.fillStyle = gradL;
ctx.fillRect(0, 0, W, H);

// gradient dolny (winiety)
const gradB = ctx.createLinearGradient(0, H * 0.6, 0, H);
gradB.addColorStop(0, 'rgba(10,18,35,0)');
gradB.addColorStop(1, 'rgba(10,18,35,0.7)');
ctx.fillStyle = gradB;
ctx.fillRect(0, 0, W, H);

// --- niebieski akcent pionowy ---
ctx.fillStyle = '#0066FF';
ctx.fillRect(0, 0, 5, H);

// --- logo pill ---
const PILL_X = 52;
const PILL_Y = 52;
const PILL_H = 38;
const PILL_R = 10;
const pillText = 'MOTOWYCENA RAFAŁ PELCZAR';
ctx.font = 'bold 13px Arial';
const pillTW = ctx.measureText(pillText).width;
const PILL_W = pillTW + 32;

ctx.beginPath();
ctx.moveTo(PILL_X + PILL_R, PILL_Y);
ctx.lineTo(PILL_X + PILL_W - PILL_R, PILL_Y);
ctx.quadraticCurveTo(PILL_X + PILL_W, PILL_Y, PILL_X + PILL_W, PILL_Y + PILL_R);
ctx.lineTo(PILL_X + PILL_W, PILL_Y + PILL_H - PILL_R);
ctx.quadraticCurveTo(PILL_X + PILL_W, PILL_Y + PILL_H, PILL_X + PILL_W - PILL_R, PILL_Y + PILL_H);
ctx.lineTo(PILL_X + PILL_R, PILL_Y + PILL_H);
ctx.quadraticCurveTo(PILL_X, PILL_Y + PILL_H, PILL_X, PILL_Y + PILL_H - PILL_R);
ctx.lineTo(PILL_X, PILL_Y + PILL_R);
ctx.quadraticCurveTo(PILL_X, PILL_Y, PILL_X + PILL_R, PILL_Y);
ctx.closePath();
ctx.fillStyle = '#0066FF';
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 13px Arial';
ctx.textBaseline = 'middle';
ctx.fillText(pillText, PILL_X + 16, PILL_Y + PILL_H / 2);

// --- main headline ---
ctx.textBaseline = 'alphabetic';
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 72px Arial';
ctx.fillText('Wypożyczalnia', 52, 220);
ctx.fillText('przyczep.', 52, 310);

// --- niebieskie podkreślenie ---
ctx.fillStyle = '#0066FF';
ctx.fillRect(52, 326, 340, 5);

// --- flota ---
ctx.fillStyle = 'rgba(255,255,255,0.75)';
ctx.font = '22px Arial';
ctx.fillText('Kempingowe · Transportowe · Laweta', 52, 385);

// --- lokalizacja ---
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.font = '18px Arial';
ctx.fillText('Garki, woj. wielkopolskie', 52, 430);

// --- dolny pasek: telefon ---
ctx.fillStyle = 'rgba(255,255,255,0.1)';
ctx.fillRect(0, H - 88, W, 88);

ctx.fillStyle = '#60a5fa';
ctx.font = 'bold 15px Arial';
ctx.fillText('ZADZWOŃ', 52, H - 52);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 28px Arial';
ctx.fillText('+48 509 146 666', 52, H - 22);

// --- URL po prawej ---
ctx.fillStyle = 'rgba(255,255,255,0.4)';
ctx.font = '16px Arial';
ctx.textAlign = 'right';
ctx.fillText('motowycena.pl', W - 52, H - 32);

// --- eksport ---
const jpeg = canvas.toBuffer('image/jpeg', 92);
writeFileSync(join(root, 'public/og-image.jpg'), jpeg);
console.log(`✓ public/og-image.jpg — ${(jpeg.length / 1024).toFixed(0)} kB`);

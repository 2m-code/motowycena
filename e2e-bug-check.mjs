import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = './e2e-screenshots';
const BASE_URL = 'http://127.0.0.1:3001';

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const bugs = [];
let screenshotIndex = 0;

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${String(screenshotIndex++).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`📸 ${file}`);
  return file;
}

function bug(msg, details = '') {
  console.error(`🐛 BUG: ${msg}${details ? ' — ' + details : ''}`);
  bugs.push({ msg, details });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Zbieraj błędy konsoli
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => bug('JS pageerror', err.message));

  // --- 1. Strona główna desktop ---
  console.log('\n=== 1. Strona główna (desktop 1280px) ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await screenshot(page, 'home-desktop');

  const title = await page.title();
  console.log('Tytuł:', title);
  if (!title || title.trim() === '') bug('Brak tytułu strony');

  // Sprawdź czy nav istnieje
  const nav = await page.$('nav');
  if (!nav) bug('Brak elementu <nav>');

  // Sprawdź logo
  const logo = await page.$('img[src*="logo"]');
  if (!logo) {
    const logoAlt = await page.$('img');
    if (!logoAlt) bug('Brak logo/obrazka w nagłówku');
  }

  // --- 2. Mobile ---
  console.log('\n=== 2. Mobile (375px) ===');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await screenshot(page, 'home-mobile');

  // Sprawdź overflow na mobile
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  if (bodyWidth > 375) bug(`Horizontal overflow na mobile`, `scrollWidth=${bodyWidth}px > 375px`);

  // --- 3. Nawigacja po sekcjach ---
  console.log('\n=== 3. Nawigacja/Scroll ===');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Zbierz linki w nav
  const navLinks = await page.$$eval('nav a', els => els.map(a => ({ text: a.textContent?.trim(), href: a.getAttribute('href') })));
  console.log('Nav linki:', navLinks);
  if (navLinks.length === 0) bug('Brak linków w nawigacji');

  // --- 4. Sekcja przyczep ---
  console.log('\n=== 4. Sekcja przyczep ===');
  // Próbuj anchor #oferta lub #przyczepy
  for (const anchor of ['#oferta', '#przyczepy', '#fleet', '#trailers']) {
    try {
      await page.goto(BASE_URL + anchor, { waitUntil: 'networkidle' });
      break;
    } catch {}
  }
  await screenshot(page, 'trailers-section');

  // Sprawdź karty przyczep
  const cards = await page.$$('[class*="card"], [class*="Card"], article, [class*="trailer"], [class*="Trailer"]');
  console.log('Karty przyczep:', cards.length);
  if (cards.length === 0) bug('Nie znaleziono kart przyczep');

  // --- 5. Obrazki ---
  console.log('\n=== 5. Broken images ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const brokenImgs = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter(img => !img.naturalWidth || !img.complete || img.naturalWidth === 0)
      .map(img => ({ src: img.src, alt: img.alt }));
  });
  if (brokenImgs.length > 0) {
    bug('Broken images', JSON.stringify(brokenImgs));
  } else {
    console.log('✅ Wszystkie obrazki OK');
  }

  // --- 6. Formularz kontaktowy ---
  console.log('\n=== 6. Formularz kontaktowy ===');
  for (const anchor of ['#kontakt', '#contact', '#formularz']) {
    try {
      await page.goto(BASE_URL + anchor, { waitUntil: 'networkidle' });
      break;
    } catch {}
  }
  await screenshot(page, 'contact-section');

  const form = await page.$('form');
  if (!form) {
    bug('Brak formularza kontaktowego');
  } else {
    // Sprawdź czy pola formularza są widoczne
    const inputs = await page.$$('form input, form textarea');
    console.log('Pola formularza:', inputs.length);
    if (inputs.length < 2) bug('Za mało pól w formularzu', `znaleziono ${inputs.length}`);

    // Test wysyłki pustego formularza
    const submitBtn = await page.$('form button[type="submit"], form button:last-child');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'form-empty-submit');
      // Sprawdź czy przeglądarka pokazuje walidację lub własna
      const errorMessages = await page.$$('[class*="error"], [class*="Error"], [role="alert"]');
      console.log('Komunikaty błędu po pustym submit:', errorMessages.length);
    }
  }

  // --- 7. Tablet (768px) ---
  console.log('\n=== 7. Tablet (768px) ===');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await screenshot(page, 'home-tablet');

  const tabletOverflow = await page.evaluate(() => document.body.scrollWidth);
  if (tabletOverflow > 768) bug(`Horizontal overflow na tablecie`, `scrollWidth=${tabletOverflow}px > 768px`);

  // --- 8. Scroll do dołu strony ---
  console.log('\n=== 8. Footer ===');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await screenshot(page, 'footer');

  const footer = await page.$('footer');
  if (!footer) bug('Brak elementu <footer>');

  // --- 9. Sprawdź błędy konsoli ---
  console.log('\n=== 9. Błędy konsoli ===');
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => bug('Console error', e));
  } else {
    console.log('✅ Brak błędów w konsoli');
  }

  // --- 10. Sprawdź meta description i OG tags ---
  console.log('\n=== 10. SEO/Meta ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const metaDesc = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
  const ogTitle = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => null);
  if (!metaDesc) bug('Brak meta[name="description"]');
  else console.log('Meta description:', metaDesc);
  if (!ogTitle) console.log('⚠️  Brak og:title (nie krytyczne)');

  await browser.close();

  // --- Podsumowanie ---
  console.log('\n=============================');
  console.log(`PODSUMOWANIE: ${bugs.length} bug(ów) znaleziono`);
  if (bugs.length > 0) {
    bugs.forEach((b, i) => console.log(`  ${i + 1}. ${b.msg}${b.details ? ': ' + b.details : ''}`));
  } else {
    console.log('✅ Brak bugów!');
  }
  console.log('=============================\n');
}

run().catch(e => {
  console.error('Playwright crash:', e);
  process.exit(1);
});

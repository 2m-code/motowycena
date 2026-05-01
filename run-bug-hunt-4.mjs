/**
 * BUG HUNT RUNDA 4 — 20 sprintów
 * Nowe scenariusze: JS disabled, scroll restoration, localStorage,
 * ARIA audit, submit spinner, spec content, 1024px, resize, SVG favicon,
 * skip links, OG image dims, sitemap vs pages, form rapid submit, itd.
 * Wyniki → BUGS-ROUND4.md
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE   = 'http://127.0.0.1:3005';
const SS_DIR = './bug-screenshots-r4';
const OUT    = './BUGS-ROUND4.md';
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

let idx = 0;
const bugs  = [];
const notes = [];
let sprint  = '';

const log  = m => process.stdout.write(m + '\n');
const bug  = (t, d = '') => { bugs.push({ sprint, t, d }); log(`  🐛 [${sprint}] ${t}${d ? ' — ' + d : ''}`); };
const note = (t, d = '') => { notes.push({ sprint, t, d }); log(`  📝 [${sprint}] ${t}${d ? ': ' + d : ''}`); };

async function shot(page, name, full = false) {
  const f = path.join(SS_DIR, `${String(idx++).padStart(3,'0')}-${name}.png`);
  await page.screenshot({ path: f, fullPage: full }).catch(() => {});
  return path.basename(f);
}
async function go(page, url = BASE) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
}
async function ok(page) {
  const t = await page.title().catch(() => '');
  return t.includes('EPRZYCZEPY') || t.includes('Wypożyczalnia') || t.includes('Motowycena');
}
async function scrollFull(page) {
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ═══════════════════════════════════════════
  // S01 — localStorage: cookie consent persistence
  // ═══════════════════════════════════════════
  sprint = 'S01-localstorage-consent';
  log('\n══ SPRINT 1: localStorage — cookie consent persistence ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Sprawdź klucz w localStorage
      await p.waitForTimeout(700);
      const lsKey = await p.evaluate(() => Object.keys(localStorage));
      note('localStorage keys przy wejściu', lsKey.join(', ') || 'puste');

      // Kliknij Akceptuj
      const acceptBtn = await p.$('button:has-text("Akceptuj")');
      if (acceptBtn) await acceptBtn.click();
      await p.waitForTimeout(300);

      const lsAfterAccept = await p.evaluate(() => ({
        key:   Object.keys(localStorage)[0],
        value: localStorage.getItem('cookieConsent'),
        all:   JSON.stringify(Object.entries(localStorage)),
      }));
      note('localStorage po Akceptuj', JSON.stringify(lsAfterAccept));

      if (lsAfterAccept.value !== 'accepted') {
        bug('localStorage nie przechowuje wartości "accepted"', `wartość: ${lsAfterAccept.value}`);
      } else note('Wartość "accepted" OK');

      // Sprawdź czy baner nie pojawia się po refresh
      await p.reload({ waitUntil: 'networkidle' });
      await p.waitForTimeout(700);
      const bannerAgain = await p.$('[role="dialog"]');
      if (bannerAgain) bug('Cookie banner pojawia się ponownie po refresh mimo accepted', '');
      else note('Brak banera po refresh — persist OK');

      // Sprawdź zachowanie po wyczyszczeniu localStorage
      await p.evaluate(() => localStorage.clear());
      await p.reload({ waitUntil: 'networkidle' });
      await p.waitForTimeout(700);
      const bannerAfterClear = await p.$('[role="dialog"]');
      if (!bannerAfterClear) bug('Banner NIE pojawia się po wyczyszczeniu localStorage', '');
      else note('Banner pojawia się po clear localStorage — OK');

      await shot(p, 'S01-banner-after-clear');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S02 — Scroll restoration po back button
  // ═══════════════════════════════════════════
  sprint = 'S02-scroll-restoration';
  log('\n══ SPRINT 2: Scroll restoration po back button ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Scroll na dół
      await p.evaluate(() => window.scrollTo(0, 3000));
      await p.waitForTimeout(300);
      const scrollBefore = await p.evaluate(() => window.scrollY);
      note('ScrollY przed nawigacją do PP', `${scrollBefore}px`);

      // Przejdź do PP
      await p.evaluate(() => { window.location.hash = '#polityka-prywatnosci'; });
      await p.waitForTimeout(600);

      // Back
      await p.goBack();
      await p.waitForTimeout(500);
      const scrollAfter = await p.evaluate(() => window.scrollY);
      note('ScrollY po powrocie (back button)', `${scrollAfter}px`);

      if (scrollAfter < 100) {
        bug('Po back button scroll wraca na górę zamiast do poprzedniej pozycji', `scrollY=${scrollAfter}px (było ${scrollBefore}px)`);
      } else {
        note('Scroll restoration po back OK', `${scrollAfter}px`);
      }

      await shot(p, 'S02-scroll-restoration');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S03 — 1024px borderline tablet/desktop
  // ═══════════════════════════════════════════
  sprint = 'S03-1024px-breakpoint';
  log('\n══ SPRINT 3: 1024px — borderline tablet/desktop ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      const ow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ow > 2) bug('Overflow na 1024px', `${ow}px`);
      else note('Brak overflow 1024px');

      // Desktop nav widoczny?
      const dnav = await p.evaluate(() => {
        const n = document.querySelector('[class*="DesktopNav"]');
        return n ? window.getComputedStyle(n).display : 'nie znaleziono';
      });
      note('DesktopNav display na 1024px', dnav);
      if (dnav === 'none') bug('Desktop nav ukryty na 1024px — użytkownik widzi hamburger', '');

      // Hamburger widoczny?
      const menuBtn = await p.$('button[aria-expanded]');
      const menuVisible = menuBtn ? await menuBtn.isVisible() : false;
      note('Hamburger widoczny na 1024px', String(menuVisible));

      await shot(p, 'S03-1024-hero');
      await scrollFull(p);

      // Trailer grid — 2 kolumny czy 1?
      const gridCols = await p.evaluate(() => {
        const el = document.querySelector('article');
        if (!el) return 'brak article';
        return window.getComputedStyle(el.parentElement || el).gridTemplateColumns;
      });
      note('Trailer grid columns na 1024px', gridCols || 'brak');

      // Contact layout — row czy column?
      const contactLayout = await p.evaluate(() => {
        const el = document.querySelector('[class*="ContactWrapper"]');
        return el ? window.getComputedStyle(el).flexDirection : 'nie znaleziono';
      });
      note('Contact layout na 1024px', contactLayout);

      await shot(p, 'S03-1024-full', true);
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S04 — Submit button stan podczas wysyłania
  // ═══════════════════════════════════════════
  sprint = 'S04-submit-loading-state';
  log('\n══ SPRINT 4: Submit button — stan "Wysyłanie..." ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();

    // Przechwytujemy request i celowo opóźniamy odpowiedź (1.5s)
    await p.route('**/api/contact', async route => {
      await new Promise(r => setTimeout(r, 1500));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await p.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(400);

      await p.fill('#contact-name', 'Test User');
      await p.fill('#contact-phone', '+48600000000');
      await p.fill('#contact-message', 'Test wysyłki formularza.');
      await p.check('#contact-consent');

      // Kliknij submit i natychmiast sprawdź stan przycisku
      const submitBtn = await p.$('button[type="submit"]');
      await submitBtn.click();
      await p.waitForTimeout(200); // czekaj chwilę (odpowiedź trwa 1.5s)

      const btnText = await p.$eval('button[type="submit"]', e => e.textContent.trim());
      const btnDisabled = await p.$eval('button[type="submit"]', e => e.disabled);
      note('Tekst przycisku Submit podczas wysyłania', btnText);
      note('Submit disabled podczas wysyłania', String(btnDisabled));

      if (!btnDisabled) bug('Przycisk Submit nie jest disabled podczas wysyłania', 'Możliwe podwójne wysłanie formularza');
      if (!btnText.includes('Wysyłanie') && !btnText.includes('wysyłanie')) {
        bug('Tekst przycisku Submit nie zmienia się na "Wysyłanie..."', `aktualny: "${btnText}"`);
      }

      await shot(p, 'S04-submit-loading');
      await p.waitForTimeout(1500); // czekaj na odpowiedź
      await shot(p, 'S04-submit-success');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S05 — Rapid form submissions
  // ═══════════════════════════════════════════
  sprint = 'S05-rapid-form-submit';
  log('\n══ SPRINT 5: Rapid form submissions (race condition) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();

    let submitCount = 0;
    await p.route('**/api/contact', route => {
      submitCount++;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await p.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(300);

      await p.fill('#contact-name', 'Test User');
      await p.fill('#contact-phone', '+48600000000');
      await p.fill('#contact-message', 'Test formularza rapid submit.');
      await p.check('#contact-consent');

      const btn = await p.$('button[type="submit"]');
      // 5 szybkich kliknięć
      for (let i = 0; i < 5; i++) {
        await btn.click({ delay: 50 }).catch(() => {});
      }
      await p.waitForTimeout(1000);

      note('Liczba wysłanych requestów do /api/contact', `${submitCount}`);
      if (submitCount > 1) {
        bug('Formularz wysłany wielokrotnie przy rapid clicks', `${submitCount} requestów (oczekiwano 1)`);
      } else {
        note('Rapid submit protection OK', '1 request');
      }
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S06 — ARIA roles pełny audit
  // ═══════════════════════════════════════════
  sprint = 'S06-aria-roles-audit';
  log('\n══ SPRINT 6: ARIA roles — pełny audit ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      // Sprawdź kluczowe role landmark
      const landmarks = await p.evaluate(() => {
        const check = (role, fallback) => !!(document.querySelector(`[role="${role}"]`) || (fallback ? document.querySelector(fallback) : null));
        return [
          { role: 'banner',        found: check('banner', 'header') },
          { role: 'main',          found: check('main', 'main') },
          { role: 'navigation',    found: check('navigation', 'nav') },
          { role: 'contentinfo',   found: check('contentinfo', 'footer') },
        ];
      });
      for (const l of landmarks) {
        if (!l.found) bug(`Brak landmark ARIA role="${l.role}"`, '');
        else note(`Landmark "${l.role}"`, 'OK');
      }

      // img alt bez pustego (dekoracyjne powinny mieć alt="" lub aria-hidden)
      const decorativeImgs = await p.$$eval('img', imgs => imgs.filter(img => {
        const alt = img.getAttribute('alt');
        return alt === null; // brak atrybutu alt = accessibility fail
      }).map(i => i.src.split('/').pop()));
      if (decorativeImgs.length > 0) bug('Obrazki bez atrybutu alt', decorativeImgs.join(', '));
      else note('Wszystkie img mają atrybut alt', '');

      // Sprawdź czy article ma dostępną nazwę
      const articles = await p.$$eval('article', els => els.map(e => ({
        hasAriaLabel:     !!e.getAttribute('aria-label'),
        hasAriaLabelledby: !!e.getAttribute('aria-labelledby'),
        hasH3:            !!e.querySelector('h3'),
      })));
      note('Article elementy', `${articles.length}`);
      for (let i = 0; i < articles.length; i++) {
        const a = articles[i];
        if (!a.hasAriaLabel && !a.hasAriaLabelledby && !a.hasH3) {
          bug(`Article ${i+1} nie ma nazwy (aria-label / aria-labelledby / h3)`, '');
        }
      }

      // Sprawdź czy nav ma aria-label
      const navLabels = await p.$$eval('nav', els => els.map(e => e.getAttribute('aria-label')));
      note('Nav aria-labels', navLabels.join(', ') || 'brak');
      if (navLabels.some(l => !l)) {
        bug('Przynajmniej jeden <nav> bez aria-label', 'Gdy jest kilka nav, każda powinna mieć unikalny aria-label');
      }

      // button bez accessible name (text lub aria-label)
      const namedBtns = await p.$$eval('button', els => els.filter(e => {
        return !e.textContent.trim() && !e.getAttribute('aria-label') && !e.querySelector('[aria-label]');
      }).map(e => e.outerHTML.substring(0, 80)));
      if (namedBtns.length > 0) bug('Przyciski bez accessible name', namedBtns.join(' | '));
      else note('Wszystkie przyciski mają accessible name', '');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S07 — Treść specyfikacji przyczep (DMC, wymiary)
  // ═══════════════════════════════════════════
  sprint = 'S07-trailer-specs-content';
  log('\n══ SPRINT 7: Dokładna treść specyfikacji przyczep ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);
      const text = await p.evaluate(() => document.body.innerText);

      // Tabbert Bellini specs
      const tabbertChecks = [
        { val: '2000 kg',  desc: 'DMC Tabbert' },
        { val: '90L',       desc: 'Zbiornik wody Tabbert' },
        { val: 'AL-KO',     desc: 'Stabilizator Tabbert' },
        { val: '180',       desc: 'Cena min Tabbert' },
        { val: '1500 zł',   desc: 'Kaucja Tabbert' },
        { val: '250zł',     desc: 'Opłata serwisowa' },
      ];
      for (const c of tabbertChecks) {
        if (!text.includes(c.val)) bug(`Brak "${c.val}" w opisie (${c.desc})`, '');
        else note(`✓ ${c.desc}`, c.val);
      }

      // Lunar Clubman specs
      const lunarChecks = [
        { val: '1450 kg',   desc: 'DMC Lunar' },
        { val: '70L',       desc: 'Zbiornik wody Lunar' },
        { val: 'TRUMA',     desc: 'Ogrzewanie Lunar' },
        { val: '160',       desc: 'Cena min Lunar' },
      ];
      for (const c of lunarChecks) {
        if (!text.includes(c.val)) bug(`Brak "${c.val}" w opisie (${c.desc})`, '');
        else note(`✓ ${c.desc}`, c.val);
      }

      // Laweta specs
      const lawetaChecks = [
        { val: '2000KG',    desc: 'DMC Laweta' },
        { val: '1500kg',    desc: 'Ładowność Laweta' },
        { val: '400cm',     desc: 'Długość platformy Laweta' },
        { val: '195cm',     desc: 'Szerokość Laweta' },
        { val: '80 zł',     desc: 'Cena Laweta' },
      ];
      for (const c of lawetaChecks) {
        if (!text.includes(c.val)) bug(`Brak "${c.val}" w opisie (${c.desc})`, '');
        else note(`✓ ${c.desc}`, c.val);
      }

      // Przyczepa motocyklowa specs
      const motoChecks = [
        { val: '225x148',   desc: 'Wymiary motocyklowa' },
        { val: '60 zł',     desc: 'Cena motocyklowa' },
      ];
      for (const c of motoChecks) {
        if (!text.includes(c.val)) bug(`Brak "${c.val}" w opisie (${c.desc})`, '');
        else note(`✓ ${c.desc}`, c.val);
      }

      await shot(p, 'S07-specs');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S08 — SVG Favicon accessibility i format
  // ═══════════════════════════════════════════
  sprint = 'S08-favicon-svg';
  log('\n══ SPRINT 8: Favicon SVG — dostępność i format ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Sprawdź favicon tags
      const favicons = await p.$$eval('link[rel*="icon"]', els => els.map(e => ({
        rel:   e.rel,
        href:  e.getAttribute('href'),
        type:  e.type,
        sizes: e.getAttribute('sizes'),
      })));
      note('Favicon tags', JSON.stringify(favicons));

      // Czy jest apple-touch-icon?
      const appleTouchIcon = favicons.find(f => f.rel.includes('apple-touch-icon'));
      if (!appleTouchIcon) bug('Brak apple-touch-icon', 'iOS home screen ikona nie wyświetli się poprawnie');
      else note('apple-touch-icon', appleTouchIcon.href);

      // Czy SVG favicon istnieje i jest dostępny?
      const svgStatus = await p.evaluate(() => fetch('/favicon.svg').then(r => r.status).catch(() => 0));
      note('/favicon.svg status', `${svgStatus}`);
      if (svgStatus !== 200) bug('/favicon.svg niedostępne', `HTTP ${svgStatus}`);

      // Pobierz SVG i sprawdź jego zawartość
      const svgContent = await p.evaluate(() => fetch('/favicon.svg').then(r => r.text()).catch(() => ''));
      if (svgContent) {
        note('SVG favicon size', `${svgContent.length} znaków`);
        if (!svgContent.includes('viewBox') && !svgContent.includes('viewbox')) {
          bug('SVG favicon nie ma atrybutu viewBox', 'Może nie skalować się poprawnie');
        } else note('SVG viewBox OK');

        if (!svgContent.includes('xmlns')) {
          bug('SVG favicon nie ma atrybutu xmlns', '');
        }

        // Czy SVG favicon ma preferowany kolor dla dark mode?
        if (!svgContent.includes('prefers-color-scheme') && !svgContent.includes('media')) {
          note('SVG favicon nie ma wariantu dark mode', 'Minor — nowoczesne przeglądarki go obsługują');
        }
      }

      // Czy jest .ico fallback?
      const icoStatus = await p.evaluate(() => fetch('/favicon.ico').then(r => r.status).catch(() => 0));
      note('/favicon.ico status', `${icoStatus}`);
      if (icoStatus === 404 || icoStatus === 0) {
        bug('Brak /favicon.ico fallback', 'Stare przeglądarki i boty mogą nie rozpoznać SVG favicon');
      }
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S09 — Skip link (dostępność klawiatury)
  // ═══════════════════════════════════════════
  sprint = 'S09-skip-link';
  log('\n══ SPRINT 9: Skip link — "Przejdź do treści" ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Skip link powinien być pierwszym elementem focus (dla screen readerów)
      await p.keyboard.press('Tab');
      const firstFocus = await p.evaluate(() => {
        const el = document.activeElement;
        return {
          tag:      el?.tagName,
          text:     el?.textContent?.trim().substring(0, 40),
          href:     el?.getAttribute('href'),
          class:    el?.className,
        };
      });
      note('Pierwszy fokus po Tab', JSON.stringify(firstFocus));

      const isSkipLink = firstFocus.href?.includes('main') ||
                         firstFocus.href?.includes('content') ||
                         firstFocus.text?.toLowerCase().includes('przejdź do') ||
                         firstFocus.text?.toLowerCase().includes('skip');

      if (!isSkipLink) {
        bug('Brak skip link jako pierwszego elementu fokus', `Pierwszy fokus: ${firstFocus.tag} "${firstFocus.text}" → ${firstFocus.href}`);
      } else {
        note('Skip link OK', firstFocus.text);
      }

      // Sprawdź czy istnieje element <main> jako target skip linka
      const mainEl = await p.$('main, [role="main"]');
      if (!mainEl) bug('Brak elementu <main> jako cel skip linka', '');
      else {
        const mainId = await mainEl.getAttribute('id');
        note('<main> element id', mainId || 'brak id — skip link nie może wskazać celu');
        if (!mainId) bug('<main> nie ma atrybutu id — skip link nie może do niego prowadzić', '');
      }

      await shot(p, 'S09-skip-link-focus');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S10 — OG image: wymiary i dostępność
  // ═══════════════════════════════════════════
  sprint = 'S10-og-image-check';
  log('\n══ SPRINT 10: OG image — wymiary i dostępność ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Sprawdź lokalny plik /og-image.jpg
      const imgData = await p.evaluate(async () => {
        const resp = await fetch('/og-image.jpg').catch(() => null);
        if (!resp || resp.status !== 200) return { status: resp?.status || 0 };
        const blob = await resp.blob();
        return new Promise(resolve => {
          const img = new Image();
          const url = URL.createObjectURL(blob);
          img.onload = () => resolve({ status: 200, w: img.width, h: img.height, size: blob.size });
          img.onerror = () => resolve({ status: 200, w: 0, h: 0, size: blob.size, error: 'load failed' });
          img.src = url;
        });
      });

      note('og-image.jpg', JSON.stringify(imgData));

      if (imgData.status !== 200) {
        bug('/og-image.jpg niedostępny', `HTTP ${imgData.status}`);
      } else {
        // Facebook wymaga min 600×315, zalecane 1200×630
        if (imgData.w < 1200 || imgData.h < 630) {
          bug('og-image.jpg za mały', `${imgData.w}×${imgData.h}px (Facebook wymaga 1200×630)`);
        } else {
          note('og-image.jpg wymiary OK', `${imgData.w}×${imgData.h}px`);
        }

        // Rozmiar pliku
        const sizeKB = Math.round(imgData.size / 1024);
        note('og-image.jpg rozmiar', `${sizeKB} KB`);
        if (sizeKB > 500) bug('og-image.jpg zbyt duży', `${sizeKB}KB — powinno być <500KB`);
        if (sizeKB < 10)  bug('og-image.jpg podejrzanie mały', `${sizeKB}KB — może być pusty`);
      }

      // Sprawdź meta og:image:width i og:image:height
      const ogW = await p.$eval('meta[property="og:image:width"]', e => e.content).catch(() => null);
      const ogH = await p.$eval('meta[property="og:image:height"]', e => e.content).catch(() => null);
      note('og:image:width', ogW || 'brak');
      note('og:image:height', ogH || 'brak');
      if (!ogW) bug('Brak meta og:image:width', '');
      if (!ogH) bug('Brak meta og:image:height', '');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S11 — Hero "Skontaktuj się" button scroll
  // ═══════════════════════════════════════════
  sprint = 'S11-hero-cta-scroll';
  log('\n══ SPRINT 11: Hero CTA "Skontaktuj się" — scroll do kontakt ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Kliknij "Skontaktuj Się" w hero
      const contactBtn = await p.$('a[href="#kontakt"]');
      if (!contactBtn) {
        bug('Brak przycisku "Skontaktuj Się" (href="#kontakt") w hero', '');
      } else {
        await contactBtn.click();
        await p.waitForTimeout(800);

        const contactTop = await p.$eval('#kontakt', e => e.getBoundingClientRect().top).catch(() => null);
        const headerH    = await p.$eval('[class*="HeaderBar"], header', e => e.getBoundingClientRect().height).catch(() => 104);
        note('Kontakt section.top po kliknięciu hero CTA', contactTop !== null ? `${Math.round(contactTop)}px` : 'null');
        note('Header height', `${Math.round(headerH)}px`);

        if (contactTop !== null && contactTop < 0) {
          bug('Sekcja #kontakt scrolluje ZA DALEKO — treść za headerem', `top=${Math.round(contactTop)}px`);
        } else if (contactTop !== null && contactTop > headerH + 40) {
          bug('Sekcja #kontakt nie doscrollowała w pełni', `top=${Math.round(contactTop)}px przy header=${Math.round(headerH)}px`);
        } else {
          note('Hero CTA scroll do #kontakt OK', `top=${contactTop !== null ? Math.round(contactTop) : 'null'}px`);
        }
        await shot(p, 'S11-hero-cta-result');
      }

      // Kliknij "Zobacz Przyczepy" → #kempingowe
      await go(p);
      const trailerBtn = await p.$('a[href="#kempingowe"]');
      if (!trailerBtn) {
        bug('Brak przycisku "Zobacz Przyczepy" (href="#kempingowe") w hero', '');
      } else {
        await trailerBtn.click();
        await p.waitForTimeout(800);
        const kempTop = await p.$eval('#kempingowe', e => e.getBoundingClientRect().top).catch(() => null);
        note('Kempingowe section.top po kliknięciu hero', kempTop !== null ? `${Math.round(kempTop)}px` : 'null');
        await shot(p, 'S11-hero-btn-kemping');
      }
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S12 — Image aspect ratio preserved
  // ═══════════════════════════════════════════
  sprint = 'S12-image-aspect-ratio';
  log('\n══ SPRINT 12: Aspect ratio obrazków ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      const imgRatios = await p.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => {
          const bb = img.getBoundingClientRect();
          const natural = img.naturalWidth && img.naturalHeight
            ? img.naturalWidth / img.naturalHeight
            : null;
          const rendered = bb.width && bb.height
            ? bb.width / bb.height
            : null;
          return {
            src:       img.src.split('/').pop(),
            natural:   natural ? natural.toFixed(2) : 'unloaded',
            rendered:  rendered ? rendered.toFixed(2) : 'zero',
            objectFit: window.getComputedStyle(img).objectFit,
            w:         Math.round(bb.width),
            h:         Math.round(bb.height),
          };
        });
      });

      note('Obrazki z aspect ratio', `${imgRatios.filter(i => i.natural !== 'unloaded').length}/${imgRatios.length}`);

      for (const img of imgRatios) {
        if (img.natural === 'unloaded') continue;
        // Dla object-fit:cover aspect ratio rendered nie musi być równy naturalny
        // Ale sprawdź czy obraz nie jest ściskany/rozciągany jeśli bez object-fit
        if (img.objectFit === 'fill' || img.objectFit === 'none') {
          const diff = Math.abs(parseFloat(img.natural) - parseFloat(img.rendered));
          if (diff > 0.3) {
            bug(`Obrazek zniekształcony (aspect ratio)`, `${img.src}: natural=${img.natural}, rendered=${img.rendered}, objectFit=${img.objectFit}`);
          }
        }
        // Sprawdź czy obraz jest widoczny (nie za mały)
        if (img.w < 10 && img.h < 10 && img.src !== 'favicon.svg') {
          note(`Obrazek bardzo mały (może ukryty)`, `${img.src}: ${img.w}×${img.h}px`);
        }
      }

      // Logo image
      const logoImg = imgRatios.find(i => i.src.includes('logo'));
      if (logoImg) note('Logo image', `${logoImg.w}×${logoImg.h}px, objectFit=${logoImg.objectFit}`);
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S13 — Cookie consent na PP view
  // ═══════════════════════════════════════════
  sprint = 'S13-cookie-on-pp-view';
  log('\n══ SPRINT 13: Cookie consent na widoku Polityki Prywatności ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();

    // Wejdź bezpośrednio na PP (bez akceptacji cookies)
    await go(p, `${BASE}#polityka-prywatnosci`);
    await p.waitForTimeout(700);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      const banner = await p.$('[role="dialog"]');
      note('Cookie banner na widoku PP', banner ? 'widoczny' : 'brak');
      if (!banner) {
        bug('Cookie consent banner nie pojawia się na widoku Polityki Prywatności', 'Użytkownik wchodzi na PP i nie ma jak zaakceptować cookies');
      }

      // Czy link do PP w cookie consent działa kiedy już jesteśmy na PP?
      if (banner) {
        await shot(p, 'S13-cookie-on-pp');
        const ppLink = await p.$('[role="dialog"] a[href="#polityka-prywatnosci"]');
        note('Link PP w cookie banner na widoku PP', ppLink ? 'istnieje' : 'brak');
      }

      // Scroll na PP — czy header nie zakrywa tytułu polityki?
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(300);
      const ppTitle = await p.$eval('h1', e => ({
        top:  Math.round(e.getBoundingClientRect().top),
        text: e.textContent.trim(),
      })).catch(() => null);
      note('PP H1 top', ppTitle ? `${ppTitle.top}px — "${ppTitle.text}"` : 'brak');

      const headerBot = await p.$eval('[class*="HeaderBar"], header', e => Math.round(e.getBoundingClientRect().bottom)).catch(() => 0);
      if (ppTitle && ppTitle.top < headerBot) {
        bug('Tytuł PP zakryty przez header na mobile', `h1.top=${ppTitle.top}px < headerBottom=${headerBot}px`);
      } else {
        note('PP title nie zakryty', '');
      }

      await shot(p, 'S13-pp-header-overlap', true);
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S14 — Text content: spójność języka
  // ═══════════════════════════════════════════
  sprint = 'S14-language-consistency';
  log('\n══ SPRINT 14: Spójność języka i literówki ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);
      const text = await p.evaluate(() => document.body.innerText);

      // Angielskie słowa które nie powinny być na polskiej stronie
      const engWords = ['click here', 'read more', 'learn more', 'submit', 'contact us'];
      for (const w of engWords) {
        if (text.toLowerCase().includes(w)) {
          bug(`Angielski tekst na polskiej stronie: "${w}"`, '');
        }
      }

      // Spójność dat (rok 2026)
      const years = text.match(/202[0-9]/g) || [];
      const uniqueYears = [...new Set(years)];
      note('Lata wymienione na stronie', uniqueYears.join(', '));
      if (uniqueYears.length > 1) {
        bug('Niespójne lata na stronie', uniqueYears.join(', '));
      }

      // Sprawdź spójność nazwy marki w treści
      const epBrand = (text.match(/EPRZYCZEPY\.EU/g) || []).length;
      const motoBrand = (text.match(/motowycena/gi) || []).length;
      note('Wystąpienia EPRZYCZEPY.EU', `${epBrand}`);
      note('Wystąpienia motowycena', `${motoBrand}`);
      if (motoBrand > 0) bug(`Stara nazwa "motowycena" nadal widoczna (${motoBrand}x)`, '');

      // Sprawdź html lang vs treść
      const htmlLang = await p.$eval('html', e => e.lang).catch(() => '');
      note('html lang', htmlLang);
      if (htmlLang !== 'pl' && htmlLang !== 'pl-PL') {
        bug('html lang nie jest pl/pl-PL', htmlLang);
      }

      // Separator w cenach — spójność (zł vs PLN)
      const pln = (text.match(/\bPLN\b/g) || []).length;
      const zl  = (text.match(/\bzł\b/g) || []).length;
      note('Ceny w zł', `${zl}`);
      note('Ceny w PLN', `${pln}`);
      if (pln > 0 && zl > 0) bug('Niespójne oznaczenie waluty: zł i PLN mieszane', `zł:${zl}, PLN:${pln}`);
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S15 — Resize viewport podczas użytkowania
  // ═══════════════════════════════════════════
  sprint = 'S15-viewport-resize';
  log('\n══ SPRINT 15: Resize viewport podczas użytkowania ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      const errs = [];
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

      // Otwórz mobile menu na mobile viewporcie
      await p.setViewportSize({ width: 375, height: 812 });
      await p.waitForTimeout(200);
      const menuBtn = await p.$('button[aria-expanded]');
      if (menuBtn) {
        const isVisible = await menuBtn.isVisible();
        if (isVisible) {
          await menuBtn.click();
          await p.waitForTimeout(300);
          await shot(p, 'S15-menu-open-mobile');
        }
      }

      // Zmień na desktop — menu powinno się zamknąć / ukryć
      await p.setViewportSize({ width: 1280, height: 800 });
      await p.waitForTimeout(400);
      await shot(p, 'S15-after-resize-to-desktop');

      // Sprawdź stan menu po resize
      const expandedAfterResize = await p.$eval('button[aria-expanded]', e => e.getAttribute('aria-expanded')).catch(() => null);
      note('aria-expanded po resize do desktop', expandedAfterResize || 'button znikł');

      const mobileMenu = await p.$('[class*="MobileMenu"]');
      const menuVisible = mobileMenu ? await mobileMenu.isVisible() : false;
      note('MobileMenu widoczne po resize do desktop', String(menuVisible));
      if (menuVisible) bug('Mobile menu pozostaje otwarte po resize do desktop', '');

      // Sprawdź overflow po resize
      const ow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ow > 5) bug('Overflow po resize mobile→desktop', `${ow}px`);

      if (errs.length) errs.forEach(e => bug('JS error podczas resize', e));
      else note('Brak JS errors po resize', '');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S16 — Hover states na kartach przyczep
  // ═══════════════════════════════════════════
  sprint = 'S16-card-hover-states';
  log('\n══ SPRINT 16: Hover states kart i CTA ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);
      await p.evaluate(() => document.querySelector('#kempingowe')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(800);

      // Hover na kartę przyczepy
      const card = await p.$('article');
      if (card) {
        const beforeShadow = await p.$eval('article', e => window.getComputedStyle(e).boxShadow);
        await card.hover();
        await p.waitForTimeout(300);
        const afterShadow  = await p.$eval('article', e => window.getComputedStyle(e).boxShadow);
        note('Card box-shadow przed hover', beforeShadow.substring(0, 60));
        note('Card box-shadow po hover', afterShadow.substring(0, 60));
        if (beforeShadow === afterShadow) {
          note('Karta przyczepy nie zmienia box-shadow na hover', 'Brak wizualnego feedbacku hover');
        }
        await shot(p, 'S16-card-hover');
      }

      // Hover na CTA "Zadzwoń"
      const cta = await p.$('a[href*="tel"]');
      if (cta) {
        const ctaBefore = await p.$eval('a[href*="tel"]', e => window.getComputedStyle(e).backgroundColor);
        await cta.hover();
        await p.waitForTimeout(200);
        const ctaAfter  = await p.$eval('a[href*="tel"]', e => window.getComputedStyle(e).backgroundColor);
        note('CTA bg przed hover', ctaBefore);
        note('CTA bg po hover', ctaAfter);
        if (ctaBefore === ctaAfter) bug('CTA "Zadzwoń" nie zmienia tła na hover', `bg: ${ctaBefore}`);
        else note('CTA hover zmienia tło OK', '');
        await shot(p, 'S16-cta-hover');
      }

      // Hover na kontaktowy link (phone)
      await p.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(500);
      const phoneLink = await p.$('#kontakt a[href*="tel"]');
      if (phoneLink) {
        await phoneLink.hover();
        await p.waitForTimeout(200);
        await shot(p, 'S16-contact-phone-hover');
      }
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S17 — lang="pl" vs lang="pl-PL" na obu widokach
  // ═══════════════════════════════════════════
  sprint = 'S17-lang-attribute-views';
  log('\n══ SPRINT 17: lang attribute — strona główna vs PP ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      const mainLang = await p.$eval('html', e => e.lang).catch(() => '');
      note('lang na stronie głównej', mainLang);

      await p.evaluate(() => { window.location.hash = '#polityka-prywatnosci'; });
      await p.waitForTimeout(500);
      const ppLang = await p.$eval('html', e => e.lang).catch(() => '');
      note('lang na widoku PP', ppLang);

      if (mainLang !== ppLang) {
        bug('Atrybut lang zmienia się między widokami SPA', `main: ${mainLang}, PP: ${ppLang}`);
      } else note('lang spójny między widokami', mainLang);

      // index.html ma lang="pl" ale sprawdzić czy React nie nadpisuje
      if (mainLang !== 'pl' && mainLang !== 'pl-PL') {
        bug('html lang nie jest pl/pl-PL', mainLang);
      }
      // Niespójność między index.html (lang="pl") i JSON-LD (pl_PL) i og:locale (pl_PL)
      const ogLocale = await p.$eval('meta[property="og:locale"]', e => e.content).catch(() => '');
      note('og:locale', ogLocale);
      if (mainLang === 'pl' && ogLocale === 'pl_PL') {
        note('lang="pl" vs og:locale="pl_PL" — drobna niespójność formatu', 'Oba poprawne, ale niespójne');
      }
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S18 — Sprawdź dane kontaktowe WEWNĄTRZ opisów (drugi głębszy scan)
  // ═══════════════════════════════════════════
  sprint = 'S18-contact-in-descriptions';
  log('\n══ SPRINT 18: Dane kontaktowe wewnątrz opisów (głęboki scan) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      // Pobierz WSZYSTKIE tekst nodes
      const fullText = await p.evaluate(() => document.body.innerText);

      // Szukaj numerów telefonów w nieoczekiwanych miejscach
      const phonePatterns = [
        { pat: /509\s?146\s?666/g,   name: 'stary tel 509' },
        { pat: /\+48\s?509/g,         name: 'stary tel +48509' },
        { pat: /\b5\d{8}\b/g,         name: 'numer 9-cyfrowy z 5' },
      ];
      for (const pp of phonePatterns) {
        const matches = fullText.match(pp.pat);
        if (matches) bug(`Znaleziono ${pp.name} na stronie`, matches.join(', '));
        else note(`Brak ${pp.name} na stronie`);
      }

      // Szukaj emaili w nieoczekiwanych miejscach (poza sekcją kontakt)
      const emails = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      note('Wszystkie emaile na stronie', emails.join(', '));
      const wrongEmails = emails.filter(e => !e.includes('eprzyczepy.eu'));
      if (wrongEmails.length > 0) {
        bug('Inne emaile niż biuro@eprzyczepy.eu na stronie', wrongEmails.join(', '));
      } else note('Tylko biuro@eprzyczepy.eu jako email');

      // Sprawdź treść opisów pod kątem URL
      const descTexts = await p.$$eval('[class*="TrailerDescription"]', els => els.map(e => e.innerText));
      for (const desc of descTexts) {
        const urls = desc.match(/https?:\/\/[^\s]+/g) || [];
        if (urls.length > 0) bug('URL wewnątrz opisu przyczepy', urls.join(', '));
      }
      note('Opisy przeskanowane pod URL', `${descTexts.length} opisów`);

      // Sprawdź czy "Możliwość odbioru osobistego lub podstawienia" zawiera prawidłowy adres
      if (fullText.includes('Spacerowa')) note('Adres Spacerowa widoczny w opisach', '');

      await ctx.close();
    }
  }

  // ═══════════════════════════════════════════
  // S19 — Sprawdź błędne/przestarzałe URL-e w opisach
  // ═══════════════════════════════════════════
  sprint = 'S19-outdated-urls-content';
  log('\n══ SPRINT 19: Przestarzałe URL-e i referencje w treści ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      // Sprawdź wszystkie <a href> na stronie
      const allLinks = await p.$$eval('a[href]', els => els.map(e => ({
        href:    e.getAttribute('href'),
        text:    e.textContent.trim().substring(0, 40),
        target:  e.target,
        rel:     e.rel,
        visible: e.offsetParent !== null,
      })));

      note('Wszystkie linki', `${allLinks.length}`);

      // Sprawdź external links
      const externals = allLinks.filter(l => l.href?.startsWith('http'));
      note('Zewnętrzne linki', `${externals.length}`);

      for (const link of externals) {
        if (!link.target || link.target !== '_blank') {
          bug(`Zewnętrzny link bez target="_blank"`, `"${link.text}" → ${link.href}`);
        }
        if (!link.rel?.includes('noopener')) {
          bug(`Zewnętrzny link bez rel="noopener"`, `"${link.text}" → ${link.href}`);
        }
      }

      // Sprawdź calendly link
      const calendlyLink = allLinks.find(l => l.href?.includes('calendly'));
      if (calendlyLink) {
        bug('Znaleziono link Calendly (2mcode) na stronie', `${calendlyLink.href}`);
      } else note('Brak linku Calendly', '');

      // Sprawdź czy są jakieś zakomentowane / ukryte stare URL-e w HTML source
      const htmlSource = await p.evaluate(() => document.documentElement.innerHTML);
      if (htmlSource.includes('motowycena.pl')) {
        const matches = htmlSource.match(/motowycena\.pl[^"'\s<]*/g) || [];
        bug('motowycena.pl w HTML source', matches.slice(0,5).join(', '));
      } else note('Brak motowycena.pl w HTML source');

      if (htmlSource.includes('przyczepy.pl') && !htmlSource.includes('eprzyczepy.pl')) {
        const matches = htmlSource.match(/przyczepy\.pl[^"'\s<]*/g) || [];
        bug('przyczepy.pl w HTML source', matches.slice(0,3).join(', '));
      }
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════
  // S20 — Final holistic: nowe detale
  // ═══════════════════════════════════════════
  sprint = 'S20-final-new-details';
  log('\n══ SPRINT 20: Final — nowe detale i cross-check ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    const jsErrs = [];
    p.on('console', m => { if (m.type() === 'error') jsErrs.push(m.text()); });
    p.on('pageerror', e => jsErrs.push(e.message));

    await go(p);
    if (!await ok(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      // Sprawdź CORS headers
      const corsHeader = await p.evaluate(() =>
        fetch('/api/contact', { method: 'OPTIONS' }).then(r => r.headers.get('access-control-allow-origin')).catch(() => null)
      );
      note('CORS Access-Control-Allow-Origin', corsHeader || 'brak / błąd fetcha');

      // Sprawdź czy footer ma rok aktualny
      const footerText = await p.$eval('footer', e => e.textContent).catch(() => '');
      if (!footerText.includes('2026')) bug('Rok w stopce nie jest 2026', footerText.substring(0, 100));
      else note('Rok 2026 w stopce', '');

      // Sprawdź czy kaucja jest spójna w obu opisach kempingowych
      const kaucjaVals = await p.evaluate(() => {
        const matches = [];
        const all = document.body.innerText.match(/[Kk]aucja[^.]*?(\d+)\s*zł/g) || [];
        return all;
      });
      note('Wszystkie wzmi. kaucji', kaucjaVals.join(' | '));
      const kaucjaLiczby = kaucjaVals.map(v => v.match(/(\d+)\s*zł/)?.[1]).filter(Boolean);
      if (new Set(kaucjaLiczby).size > 1) {
        bug('Niespójne wartości kaucji w opisach', kaucjaLiczby.join(', '));
      } else note('Kaucja spójna', kaucjaLiczby[0] || 'nie znaleziono');

      // Sprawdź czy ContactSection ma prawidłowy padding-top (nie zakrywa contentu)
      const contactPad = await p.$eval('[class*="ContactSection"]', e => window.getComputedStyle(e).paddingTop).catch(() => 'brak');
      note('ContactSection padding-top', contactPad);

      // Sprawdź responsywność thumbnailów na wąskim ekranie
      const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const p2   = await ctx2.newPage();
      await go(p2);
      if (await ok(p2)) {
        await scrollFull(p2);
        const thumbOverflow = await p2.evaluate(() => {
          const el = document.querySelector('[class*="ThumbGrid"]');
          if (!el) return null;
          return { scroll: el.scrollWidth, client: el.clientWidth, diff: el.scrollWidth - el.clientWidth };
        });
        note('ThumbGrid overflow na mobile', thumbOverflow ? JSON.stringify(thumbOverflow) : 'nie znaleziono');
        if (thumbOverflow && thumbOverflow.diff > 2) {
          bug('ThumbGrid ma horizontal overflow na mobile', `scrollWidth=${thumbOverflow.scroll} > clientWidth=${thumbOverflow.client}`);
        }
        await shot(p2, 'S20-thumbgrid-mobile');
      }
      await ctx2.close();

      // Final screenshoty
      await shot(p, 'S20-final-desktop');

      // JS errors?
      if (jsErrs.length) jsErrs.forEach(e => bug('JS Error final', e));
      else note('Zero JS errors w całej rundzie 4');

      // Podsumowanie cross-check z poprzednimi rundami
      const fullText = await p.evaluate(() => document.body.innerText);
      note('Cross-check: motowycena w body', fullText.includes('motowycena') ? 'ZNALEZIONO' : 'OK');
      note('Cross-check: 509 146 w body', fullText.includes('509 146') ? 'ZNALEZIONO' : 'OK');
      note('Cross-check: biuro@eprzyczepy.eu', fullText.includes('biuro@eprzyczepy.eu') ? 'OK' : 'BRAK');
      note('Cross-check: 80 zł laweta', fullText.includes('80 zł') ? 'OK' : 'BRAK');
    }
    await ctx.close();
  }

  await browser.close();

  // ── ZAPIS ──────────────────────────────────
  const now = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const grouped = {};
  for (const b of bugs) {
    if (!grouped[b.sprint]) grouped[b.sprint] = [];
    grouped[b.sprint].push(b);
  }

  let md = `# BUGS RUNDA 4 — eprzyczepy.eu\n`;
  md += `> ${now} · 20 sprintów · ${bugs.length} bugów · ${notes.length} notatek · ${idx} screenshotów\n\n---\n\n`;
  md += `## Bugi (${bugs.length})\n\n`;
  let n = 1;
  for (const b of bugs) {
    md += `**B${n++}** [\`${b.sprint}\`] ${b.t}${b.d ? `\n> ${b.d}` : ''}\n\n`;
  }
  md += `---\n\n## Szczegóły per sprint\n\n`;
  for (const [sp, items] of Object.entries(grouped)) {
    md += `### ${sp}\n`;
    for (const b of items) {
      md += `- 🐛 **${b.t}**\n`;
      if (b.d) md += `  > ${b.d}\n`;
    }
    md += '\n';
  }
  md += `---\n\n## Notatki\n\n`;
  for (const n of notes) md += `- [\`${n.sprint}\`] **${n.t}**: ${n.d}\n`;
  md += `\n---\nScreenshoty: \`./bug-screenshots-r4/\` (${idx} plików)\n`;

  fs.writeFileSync(OUT, md, 'utf-8');
  log(`\n✅ BUGS-ROUND4.md — ${bugs.length} bugów, ${notes.length} notatek, ${idx} screenshotów`);
}

main().catch(e => { console.error(e); process.exit(1); });

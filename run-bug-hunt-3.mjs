/**
 * BUG HUNT RUNDA 3 — 20 sprintów
 * Zupełnie nowe scenariusze: touch targets, color contrast, heading hierarchy,
 * autocomplete, pricing, z-index, rapid clicks, throttling, print, itd.
 * Wyniki → BUGS-ROUND3.md
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE   = 'http://127.0.0.1:3005';
const SS_DIR = './bug-screenshots-r3';
const OUT    = './BUGS-ROUND3.md';
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
  const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(400);
  return r;
}

async function verifyOurSite(page) {
  const title = await page.title().catch(() => '');
  return title.includes('EPRZYCZEPY') || title.includes('Motowycena') || title.includes('Wypożyczalnia');
}

async function scrollFull(page) {
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
}

// ───────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({ headless: true });

  // ══════════════════════════════════════════════
  // S01 — Weryfikacja serwera + touch targets
  // ══════════════════════════════════════════════
  sprint = 'S01-server-verify-touch-targets';
  log('\n══ SPRINT 1: Weryfikacja serwera + touch targets (44×44px WCAG) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const p   = await ctx.newPage();
    await go(p);

    const ok = await verifyOurSite(p);
    if (!ok) { bug('ZŁY SERWER — sprint pominięty', await p.title()); await ctx.close(); }
    else {
      note('Serwer OK', await p.title());
      await scrollFull(p);

      // Touch targets — WCAG 2.5.8 minimum 24×24px, zalecane 44×44px
      const smallTargets = await p.evaluate(() => {
        const interactive = Array.from(document.querySelectorAll('a, button, input, textarea, [role="button"]'));
        return interactive
          .filter(el => {
            const bb = el.getBoundingClientRect();
            return bb.width > 0 && bb.height > 0 && (bb.width < 44 || bb.height < 44);
          })
          .map(el => ({
            tag:  el.tagName,
            text: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().substring(0, 30),
            w:    Math.round(el.getBoundingClientRect().width),
            h:    Math.round(el.getBoundingClientRect().height),
          }));
      });

      note('Interactive elements < 44px', `${smallTargets.length}`);
      for (const t of smallTargets) {
        bug(`Touch target za mały: ${t.tag} "${t.text}"`, `${t.w}×${t.h}px (min 44×44)`);
      }

      await shot(p, 'S01-touch-targets-mobile');
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S02 — Heading hierarchy
  // ══════════════════════════════════════════════
  sprint = 'S02-heading-hierarchy';
  log('\n══ SPRINT 2: Hierarchia nagłówków (h1→h2→h3) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      const headings = await p.$$eval('h1,h2,h3,h4,h5,h6', els => els.map(e => ({
        level: parseInt(e.tagName[1]),
        text:  e.textContent.trim().substring(0, 60),
        visible: e.offsetParent !== null,
      })));

      note('Wszystkie nagłówki', headings.map(h => `h${h.level}: "${h.text}"`).join(' | '));

      const h1s = headings.filter(h => h.level === 1);
      if (h1s.length === 0)  bug('Brak H1 na stronie', '');
      if (h1s.length > 1)    bug('Więcej niż jeden H1', h1s.map(h => `"${h.text}"`).join(', '));
      else                   note('H1 OK', h1s[0]?.text || '');

      // Sprawdź skoki w hierarchii (np. h1→h3 bez h2)
      let prev = 0;
      for (const h of headings) {
        if (h.level > prev + 1 && prev > 0) {
          bug(`Skok w hierarchii nagłówków: h${prev} → h${h.level}`, `"${h.text}"`);
        }
        prev = h.level;
      }

      note('Liczba nagłówków', `h1:${h1s.length} h2:${headings.filter(h=>h.level===2).length} h3:${headings.filter(h=>h.level===3).length}`);
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S03 — Autocomplete na polach formularza
  // ══════════════════════════════════════════════
  sprint = 'S03-form-autocomplete';
  log('\n══ SPRINT 3: Autocomplete atrybuty formularza ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      const fields = await p.$$eval('form input:not([type="hidden"]):not([type="checkbox"]), form textarea', els =>
        els.map(e => ({
          id:           e.id,
          type:         e.type,
          name:         e.name,
          autocomplete: e.getAttribute('autocomplete'),
          placeholder:  e.placeholder,
        }))
      );

      note('Pola formularza', `${fields.length}`);
      for (const f of fields) {
        if (!f.autocomplete || f.autocomplete === 'off') {
          bug(`Pole "${f.id || f.name}" nie ma autocomplete`, `type=${f.type}`);
        } else {
          note(`autocomplete OK: ${f.id}`, f.autocomplete);
        }
      }

      // Checkbox consent — powinien mieć name lub id
      const consent = await p.$eval('#contact-consent', e => ({
        id: e.id, name: e.name, required: e.required,
      })).catch(() => null);
      if (consent) {
        if (!consent.required) bug('Checkbox zgody RODO nie jest required', '');
        else note('Checkbox required OK', '');
      }
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S04 — Weryfikacja cen wszystkich przyczep
  // ══════════════════════════════════════════════
  sprint = 'S04-pricing-verification';
  log('\n══ SPRINT 4: Weryfikacja cen przyczep ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      const pageText = await p.evaluate(() => document.body.innerText);

      // Ceny oczekiwane (z trailers.ts)
      const expectedPrices = [
        { name: 'Tabbert Bellini',        price: '180-220 zł', desc: 'kemping premium' },
        { name: 'Lunar Clubman',           price: '160-180 zł', desc: 'kemping' },
        { name: 'Laweta samochodowa',      price: '80 zł',      desc: 'transport' },
        { name: 'Przyczepa motocyklowa',   price: '60 zł',      desc: 'transport' },
      ];

      for (const ep of expectedPrices) {
        if (!pageText.includes(ep.name.split(' ')[0])) {
          bug(`Nie znaleziono przyczepy: ${ep.name}`, '');
        } else {
          note(`Przyczepa ${ep.name}`, 'znaleziona');
        }
        if (!pageText.includes(ep.price.split('/')[0].trim())) {
          bug(`Cena "${ep.price}" nie widoczna na stronie`, `dla: ${ep.name}`);
        } else {
          note(`Cena ${ep.name}`, ep.price + ' ✓');
        }
      }

      // Stara cena lawety (90 zł) nie powinna być
      if (pageText.includes('90 zł') || pageText.includes('90zł')) {
        bug('Stara cena lawety "90 zł" widoczna na stronie', 'Powinna być 80 zł');
      } else note('Stara cena 90zł nie widoczna', '');

      await shot(p, 'S04-pricing');
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S05 — Z-index: nawigacja zakrywa content
  // ══════════════════════════════════════════════
  sprint = 'S05-zindex-stacking';
  log('\n══ SPRINT 5: Z-index i stacking kontekst ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await p.waitForTimeout(600);

      // Cookie banner + header — czy nie zachodzą na siebie
      const headerZ   = await p.$eval('[class*="HeaderBar"], header', e => parseInt(window.getComputedStyle(e).zIndex) || 0).catch(() => 0);
      const cookieZ   = await p.$eval('[role="dialog"]', e => parseInt(window.getComputedStyle(e).zIndex) || 0).catch(() => 0);
      note('Header z-index', `${headerZ}`);
      note('Cookie banner z-index', `${cookieZ}`);

      if (cookieZ > 0 && headerZ > 0 && cookieZ < headerZ) {
        bug('Cookie banner ma niższy z-index niż header', `cookie:${cookieZ} < header:${headerZ}`);
      }

      // Open mobile menu — sprawdź czy menu jest nad cookie banner
      const menuBtn = await p.$('button[aria-expanded]');
      if (menuBtn) {
        await menuBtn.click();
        await p.waitForTimeout(300);
        const menuZ = await p.$eval('[class*="MobileMenu"]', e => parseInt(window.getComputedStyle(e).zIndex) || 0).catch(() => 0);
        note('Mobile menu z-index (otwarty)', `${menuZ}`);
        await shot(p, 'S05-menu-zindex');
        await menuBtn.click();
        await p.waitForTimeout(200);
      }

      // Scroll do kontakt — czy header example zakrywa form inputs?
      await p.evaluate(() => {
        const el = document.querySelector('#kontakt');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });
      await p.waitForTimeout(400);
      await shot(p, 'S05-contact-zindex');

      // Sprawdź czy fixed header nakłada się na sekcję kontakt
      const headerBottom = await p.$eval('[class*="HeaderBar"], header', e => e.getBoundingClientRect().bottom).catch(() => 0);
      const sectionTop   = await p.$eval('#kontakt', e => e.getBoundingClientRect().top).catch(() => 999);
      if (sectionTop < headerBottom) {
        bug('Sekcja #kontakt zakryta przez sticky header', `sectionTop=${Math.round(sectionTop)}px < headerBottom=${Math.round(headerBottom)}px`);
      } else {
        note('Kontakt nie zakryty przez header', `sectionTop=${Math.round(sectionTop)}, headerBottom=${Math.round(headerBottom)}`);
      }
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S06 — Rapid clicks na hamburger menu
  // ══════════════════════════════════════════════
  sprint = 'S06-rapid-clicks-menu';
  log('\n══ SPRINT 6: Rapid clicks hamburger (race condition) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const p   = await ctx.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', e => errs.push(e.message));

    await go(p);
    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      const btn = await p.$('button[aria-expanded]');
      if (btn) {
        // 10 szybkich kliknięć
        for (let i = 0; i < 10; i++) {
          await btn.click({ delay: 30 });
        }
        await p.waitForTimeout(500);
        const expanded = await btn.getAttribute('aria-expanded');
        note('Stan menu po 10 kliknięciach', expanded);
        // Po parzystej liczbie kliknięć menu powinno być zamknięte
        if (expanded !== 'false') bug('Po 10 kliknięciach menu jest OTWARTE (powinno być zamknięte — parzysty count)', `aria-expanded=${expanded}`);
        else note('Menu stan po rapid clicks OK (closed)', '');

        await shot(p, 'S06-after-rapid-clicks');
      }

      if (errs.length) errs.forEach(e => bug('JS error podczas rapid clicks', e));
      else note('Brak JS errors po rapid clicks', '');
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S07 — Network throttle: 3G slow
  // ══════════════════════════════════════════════
  sprint = 'S07-network-throttle-3g';
  log('\n══ SPRINT 7: Throttle 3G slow — skeleton / placeholder ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const p   = await ctx.newPage();

    // Emuluj 3G: 750kbps down, 250kbps up, 100ms RTT
    const client = await ctx.newCDPSession(p);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline:            false,
      downloadThroughput: 750 * 1024 / 8,
      uploadThroughput:   250 * 1024 / 8,
      latency:            100,
    });

    const t0 = Date.now();
    await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    const domTime = Date.now() - t0;
    note('DOMContentLoaded na 3G', `${domTime}ms`);

    await shot(p, 'S07-3g-domcontentloaded');

    // Sprawdź czy strona ma jakiś skeleton/placeholder zanim załadują się obrazki
    const imgsLoaded = await p.evaluate(() =>
      Array.from(document.querySelectorAll('img')).filter(i => i.naturalWidth > 0).length
    );
    note('Obrazki załadowane po DOMContentLoaded na 3G', `${imgsLoaded}`);

    // Sprawdź czy background image hero jest widoczna (zanim js załaduje style)
    await p.waitForTimeout(2000);
    await shot(p, 'S07-3g-after-2s');

    if (domTime > 5000) bug('DOMContentLoaded > 5s na 3G', `${domTime}ms`);
    else note('DOMContentLoaded 3G akceptowalny', `${domTime}ms`);

    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S08 — Link texts (no "kliknij tutaj", "więcej")
  // ══════════════════════════════════════════════
  sprint = 'S08-link-text-quality';
  log('\n══ SPRINT 8: Jakość tekstów linków (accessibility) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      const links = await p.$$eval('a', els => els.map(e => ({
        text:       e.textContent.trim(),
        ariaLabel:  e.getAttribute('aria-label'),
        href:       e.getAttribute('href'),
        hasImg:     e.querySelector('img') !== null,
      })));

      const vague = ['kliknij', 'więcej', 'tutaj', 'czytaj', 'link', 'here', 'click'];
      for (const l of links) {
        const text = (l.ariaLabel || l.text).toLowerCase();
        for (const v of vague) {
          if (text === v || text.startsWith(v + ' ') || text.endsWith(' ' + v)) {
            bug(`Link z niejednoznacznym tekstem: "${l.text}"`, `href=${l.href}`);
          }
        }

        // Link z samą ikoną bez aria-label
        if (!l.text.trim() && !l.ariaLabel && !l.hasImg) {
          bug(`Link bez tekstu i bez aria-label`, `href=${l.href}`);
        }

        // Bardzo krótkie teksty linków
        if (l.text.trim().length === 1 && !l.ariaLabel) {
          bug(`Link z jednym znakiem bez aria-label: "${l.text}"`, `href=${l.href}`);
        }
      }

      note('Łączna liczba linków', `${links.length}`);
      note('Linki bez tekstu', `${links.filter(l => !l.text.trim() && !l.ariaLabel).length}`);
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S09 — Meta robots i indexability
  // ══════════════════════════════════════════════
  sprint = 'S09-meta-robots-indexability';
  log('\n══ SPRINT 9: Meta robots i indexability ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // meta robots
      const robots = await p.$eval('meta[name="robots"]', e => e.content).catch(() => null);
      if (!robots) {
        note('Brak meta[name="robots"]', 'domyślnie index, follow — OK');
      } else {
        note('meta robots', robots);
        if (robots.includes('noindex')) bug('meta robots = noindex — strona nie będzie indeksowana!', robots);
      }

      // X-Robots-Tag w response headers
      const resp = await p.goto(BASE, { waitUntil: 'domcontentloaded' });
      const xRobots = resp?.headers()['x-robots-tag'];
      if (xRobots) {
        note('X-Robots-Tag header', xRobots);
        if (xRobots.includes('noindex')) bug('X-Robots-Tag: noindex w HTTP header!', xRobots);
      } else note('X-Robots-Tag header', 'brak (OK)');

      // Content-Type
      const contentType = resp?.headers()['content-type'];
      note('Content-Type', contentType || 'brak');
      if (!contentType?.includes('text/html')) bug('Nieprawidłowy Content-Type dla HTML', contentType || 'brak');

      // Sprawdź czy strona jest w iframe (clickjacking)
      const xFrame = resp?.headers()['x-frame-options'];
      note('X-Frame-Options', xFrame || 'brak — możliwy clickjacking');
      if (!xFrame) bug('Brak X-Frame-Options header', 'strona może być osadzona w iframe (clickjacking risk)');

      // CSP header
      const csp = resp?.headers()['content-security-policy'];
      note('Content-Security-Policy', csp ? 'obecny' : 'brak');
      if (!csp) bug('Brak Content-Security-Policy header', 'security header missing');
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S10 — QuickHighlight bar na różnych viewport
  // ══════════════════════════════════════════════
  sprint = 'S10-quickhighlight-bar';
  log('\n══ SPRINT 10: QuickHighlight bar layout ══');
  {
    for (const vp of [
      { w: 320,  h: 568,  n: '320' },
      { w: 375,  h: 812,  n: '375' },
      { w: 768,  h: 1024, n: '768' },
      { w: 1280, h: 800,  n: '1280' },
    ]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const p   = await ctx.newPage();
      await go(p);

      if (!await verifyOurSite(p)) { await ctx.close(); continue; }

      // QuickHighlight bar
      const qh = await p.evaluate(() => {
        const el = document.evaluate(
          '//*[contains(@class,"QuickHighlight") or contains(text(),"KEMPING") or contains(text(),"LAWETA")]',
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
        ).singleNodeValue;
        if (!el) return null;
        const bb = el.getBoundingClientRect();
        const st = window.getComputedStyle(el);
        return { w: Math.round(bb.width), overflow: st.overflow, display: st.display };
      });

      // Find the bar differently
      const barInfo = await p.evaluate(() => {
        // Szukamy elementu który ma CheckCircle2 icons i teksty o kempingu/lawecie
        const els = Array.from(document.querySelectorAll('div, span')).filter(e =>
          e.textContent.includes('KEMPING') || e.textContent.includes('LAWETA') || e.textContent.includes('Kemping') || e.textContent.includes('Laweta')
        );
        if (els.length === 0) return null;
        const el = els[0];
        const bb = el.getBoundingClientRect();
        const st = window.getComputedStyle(el);
        return { w: Math.round(bb.width), h: Math.round(bb.height), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });

      if (barInfo) {
        if (barInfo.scrollWidth > barInfo.clientWidth + 2) {
          bug(`QuickHighlight bar ma overflow na ${vp.n}px`, `scrollWidth=${barInfo.scrollWidth} > clientWidth=${barInfo.clientWidth}`);
        } else {
          note(`QuickHighlight OK na ${vp.n}px`, `${barInfo.w}×${barInfo.h}`);
        }
      } else {
        note(`QuickHighlight nie znaleziony na ${vp.n}px`, '');
      }

      await shot(p, `S10-quickhighlight-${vp.n}`);
      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════
  // S11 — Logo klik: scroll do góry
  // ══════════════════════════════════════════════
  sprint = 'S11-logo-click-behavior';
  log('\n══ SPRINT 11: Logo click — scroll to top ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Przewiń na dół
      await p.evaluate(() => window.scrollTo(0, 2000));
      await p.waitForTimeout(300);
      const scrollBefore = await p.evaluate(() => window.scrollY);
      note('ScrollY przed kliknięciem logo', `${scrollBefore}px`);

      // Kliknij logo
      const logo = await p.$('[role="button"][aria-label*="Przejdź"], [class*="Logo"]');
      if (!logo) {
        bug('Logo nie znalezione jako klikalny element', '');
      } else {
        await logo.click();
        await p.waitForTimeout(800);
        const scrollAfter = await p.evaluate(() => window.scrollY);
        note('ScrollY po kliknięciu logo', `${scrollAfter}px`);
        if (scrollAfter > 100) {
          bug('Kliknięcie logo nie scrolluje na górę strony', `scrollY=${scrollAfter}px`);
        } else {
          note('Logo scroll to top OK', `scrollY=${scrollAfter}px`);
        }
      }

      // Logo na privacy policy view — czy też scrolluje na góre?
      await p.evaluate(() => window.location.hash = '#polityka-prywatnosci');
      await p.waitForTimeout(600);
      await p.evaluate(() => window.scrollTo(0, 500));
      await p.waitForTimeout(300);

      const logoOnPP = await p.$('[role="button"][aria-label*="Przejdź"], [class*="Logo"]');
      if (logoOnPP) {
        await logoOnPP.click();
        await p.waitForTimeout(700);
        const view  = await p.evaluate(() => window.location.hash);
        const scrollY = await p.evaluate(() => window.scrollY);
        note('Po kliknięciu logo na PP — hash', view);
        note('Po kliknięciu logo na PP — scrollY', `${scrollY}px`);
        if (view === '#polityka-prywatnosci') {
          bug('Logo click na PP nie wraca do widoku głównego', `hash=${view}`);
        } else {
          note('Logo click wraca z PP OK', '');
        }
      }

      await shot(p, 'S11-logo-click');
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S12 — Font rendering: czy Inter jest załadowany
  // ══════════════════════════════════════════════
  sprint = 'S12-font-loading';
  log('\n══ SPRINT 12: Ładowanie czcionki Inter ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Sprawdź czy font jest załadowany
      const fontLoaded = await p.evaluate(async () => {
        try {
          await document.fonts.load('700 16px Inter');
          const loaded = document.fonts.check('700 16px Inter');
          return loaded;
        } catch { return false; }
      });
      note('Font Inter (700) załadowany', String(fontLoaded));
      if (!fontLoaded) bug('Font Inter 700 nie jest załadowany po networkidle', 'FOUT może być widoczny');

      // font-display swap?
      const fontRequests = [];
      p.on('request', req => { if (req.url().includes('fonts.googleapis') || req.url().includes('fonts.gstatic')) fontRequests.push(req.url()); });
      await p.reload({ waitUntil: 'networkidle' });
      note('Google Fonts requests', `${fontRequests.length}: ${fontRequests.join(', ')}`);

      // Sprawdź czy font CSS ma font-display:swap
      const fontFaces = await p.evaluate(() => {
        const results = [];
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.type === CSSRule.FONT_FACE_RULE) {
                results.push({
                  family:  rule.style.fontFamily,
                  display: rule.style.fontDisplay || 'brak',
                });
              }
            }
          } catch {}
        }
        return results;
      });
      for (const ff of fontFaces) {
        note(`@font-face ${ff.family}`, `font-display: ${ff.display}`);
        if (!ff.display || ff.display === 'brak' || ff.display === 'auto') {
          bug(`Font ${ff.family} nie ma font-display: swap`, 'Może powodować FOUT/FOIT — tekst niewidoczny podczas ładowania');
        }
      }

      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════
  // S13 — Thumbnail active state persists
  // ══════════════════════════════════════════════
  sprint = 'S13-gallery-state';
  log('\n══ SPRINT 13: Galeria — stan po nawigacji ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);
      await p.evaluate(() => document.querySelector('#kempingowe')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(800);

      const thumbBtns = await p.$$('button[aria-label*="Pokaż"], button[aria-label*="zdjęcie"]');
      note('Thumbnail buttons', `${thumbBtns.length}`);

      if (thumbBtns.length >= 3) {
        // Kliknij 3. thumbnail
        await thumbBtns[2].click();
        await p.waitForTimeout(300);
        await shot(p, 'S13-gallery-thumb3');

        const mainSrc1 = await p.$eval('article:first-of-type img[loading="lazy"]', e => e.src).catch(() => '');
        note('Main img po kliknięciu thumb 3', mainSrc1.split('/').pop());

        // Nawiguj do innej sekcji i wróć — czy active thumbnail się resetuje?
        await p.click('a[href="#kontakt"]').catch(() => {});
        await p.waitForTimeout(500);
        await p.click('a[href="#kempingowe"]').catch(() => {});
        await p.waitForTimeout(800);
        await shot(p, 'S13-gallery-after-nav');

        const mainSrc2 = await p.$eval('article:first-of-type img[loading="lazy"]', e => e.src).catch(() => '');
        note('Main img po powrocie do sekcji', mainSrc2.split('/').pop());

        // Sprawdź czy aktywny thumbnail jest prawidłowo zaznaczony
        const activeThumbs = await p.$$('button[aria-pressed="true"]');
        note('Active thumb buttons', `${activeThumbs.length}`);
        if (activeThumbs.length === 0) {
          bug('Żaden thumbnail nie ma aria-pressed="true"', 'Brak stanu aktywnego dla screen readerów');
        }
      }

      // Sprawdź aria-label thumbnailów
      const thumbLabels = await p.$$eval('button[aria-label*="zdjęcie"]', els => els.map(e => e.getAttribute('aria-label')));
      note('Thumb aria-labels', thumbLabels.slice(0, 4).join(' | '));

      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════
  // S14 — Responsywność przy 480px (między mobile/tablet)
  // ══════════════════════════════════════════════
  sprint = 'S14-480px-breakpoint';
  log('\n══ SPRINT 14: Breakpoint 480px (między mobile a tablet) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 480, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      const ow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ow > 2) bug('Overflow na 480px', `${ow}px`);
      else note('Brak overflow 480px', '');

      await shot(p, 'S14-480-hero');

      // Hero buttons — stacked czy side by side?
      const btns = await p.$$('section a[href="#kempingowe"], section a[href="#kontakt"]');
      if (btns.length >= 2) {
        const r0 = await btns[0].boundingBox().catch(() => null);
        const r1 = await btns[1].boundingBox().catch(() => null);
        if (r0 && r1) {
          const sideBySide = Math.abs(r0.y - r1.y) < 10;
          note('Hero buttons na 480px', sideBySide ? 'obok siebie (row)' : 'w kolumnie (stacked)');
          if (sideBySide && (r0.width + r1.width + 20 > 480)) {
            bug('Hero buttons obok siebie na 480px — mogą wychodzić poza ekran', `btn1.w=${Math.round(r0.width)}, btn2.w=${Math.round(r1.width)}`);
          }
        }
      }

      // Sprawdź czy desktop nav widoczny na 480px
      const desktopNav = await p.evaluate(() => {
        const nav = document.querySelector('[class*="DesktopNav"]');
        if (!nav) return 'nie znaleziono';
        return window.getComputedStyle(nav).display;
      });
      note('DesktopNav display na 480px', desktopNav);
      if (desktopNav !== 'none' && desktopNav !== 'nie znaleziono') {
        bug('Desktop nav widoczny na 480px — powinien być ukryty do 768px', `display=${desktopNav}`);
      }

      await scrollFull(p);
      await shot(p, 'S14-480-full', true);
      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════
  // S15 — Form success state
  // ══════════════════════════════════════════════
  sprint = 'S15-form-success-state';
  log('\n══ SPRINT 15: Formularz — stan sukcesu i błędu ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();

    // Interceptuj request do /api/contact i zwracaj sukces
    await p.route('**/api/contact', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await go(p);
    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await p.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(400);

      // Wypełnij i wyślij formularz
      await p.fill('#contact-name', 'Jan Kowalski');
      await p.fill('#contact-phone', '+48 692 376 595');
      await p.fill('#contact-message', 'Interesuje mnie wynajem Tabberta na tydzień w lipcu.');
      await p.check('#contact-consent');
      await shot(p, 'S15-form-filled');

      await p.click('button[type="submit"]');
      await p.waitForTimeout(800);
      await shot(p, 'S15-form-after-submit');

      // Sprawdź komunikat sukcesu
      const successEl = await p.$('[role="status"]');
      if (!successEl) {
        bug('Brak komunikatu sukcesu po wysłaniu formularza', '');
      } else {
        const txt = await successEl.textContent();
        note('Komunikat sukcesu', txt.trim());
        if (!txt.includes('Dziękujemy') && !txt.includes('wysłana') && !txt.includes('wkrótce')) {
          bug('Komunikat sukcesu nie zawiera oczekiwanego tekstu', txt.trim());
        }
      }

      // Sprawdź czy pola zostały wyczyszczone
      const nameVal = await p.$eval('#contact-name', e => e.value).catch(() => 'err');
      const phoneVal = await p.$eval('#contact-phone', e => e.value).catch(() => 'err');
      const msgVal  = await p.$eval('#contact-message', e => e.value).catch(() => 'err');
      const cbVal   = await p.$eval('#contact-consent', e => e.checked).catch(() => true);

      if (nameVal)  bug('Pole "Imię" nie zostało wyczyszczone po sukcessie', `wartość: "${nameVal}"`);
      if (phoneVal) bug('Pole "Telefon" nie zostało wyczyszczone po sukcesie', `wartość: "${phoneVal}"`);
      if (msgVal)   bug('Pole "Wiadomość" nie zostało wyczyszczone po sukcesie', `wartość: "${msgVal.substring(0,30)}"`);
      if (cbVal)    bug('Checkbox zgody nie odznaczył się po sukcesie', '');

      if (!nameVal && !phoneVal && !msgVal && !cbVal) note('Formularz wyczyszczony po sukcesie OK', '');
    }

    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S16 — Form error state (server error)
  // ══════════════════════════════════════════════
  sprint = 'S16-form-error-state';
  log('\n══ SPRINT 16: Formularz — obsługa błędów serwera ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();

    // Symuluj różne błędy serwera
    const errorCases = [
      { body: { ok: false, error: 'rate_limited' }, status: 429 },
      { body: { ok: false, error: 'captcha_failed' }, status: 400 },
      { body: { ok: false, error: 'send_failed' }, status: 500 },
    ];

    for (const ec of errorCases) {
      await p.route('**/api/contact', route => {
        route.fulfill({ status: ec.status, contentType: 'application/json', body: JSON.stringify(ec.body) });
      });

      await go(p);
      if (!await verifyOurSite(p)) { bug('Zły serwer'); break; }

      await p.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(300);

      await p.fill('#contact-name', 'Test User');
      await p.fill('#contact-phone', '+48600000000');
      await p.fill('#contact-message', 'Test wiadomość testowa');
      await p.check('#contact-consent');
      await p.click('button[type="submit"]');
      await p.waitForTimeout(800);

      const errEl  = await p.$('[role="alert"]');
      const errTxt = errEl ? await errEl.textContent() : null;
      note(`Error case "${ec.body.error}"`, errTxt?.trim() || 'brak komunikatu błędu');

      if (!errEl) {
        bug(`Brak komunikatu błędu dla: ${ec.body.error}`, `HTTP ${ec.status}`);
      } else if (!errTxt?.trim()) {
        bug(`Pusty komunikat błędu dla: ${ec.body.error}`, '');
      }

      await shot(p, `S16-form-error-${ec.body.error}`);

      await p.unroute('**/api/contact');
    }

    await ctx.close();
  }

  // ══════════════════════════════════════════════
  // S17 — Sprawdzenie telefonów w trailer CTA
  // ══════════════════════════════════════════════
  sprint = 'S17-cta-phone-consistency';
  log('\n══ SPRINT 17: CTA telefony — spójność w kartach ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);

      const telLinks = await p.$$eval('a[href^="tel:"]', els => els.map(e => ({
        href:    e.href,
        text:    e.textContent.trim(),
        visible: e.offsetParent !== null,
      })));

      note('Wszystkie linki tel:', `${telLinks.length}`);

      const expectedNum = '+48692376595';
      const wrong = telLinks.filter(l => !l.href.includes(expectedNum.replace('+', '')));
      if (wrong.length > 0) {
        bug('Linki tel: z nieprawidłowym numerem', wrong.map(l => l.href).join(', '));
      } else {
        note('Wszystkie tel: linki OK', expectedNum);
      }

      // Sprawdź mailto links
      const mailLinks = await p.$$eval('a[href^="mailto:"]', els => els.map(e => ({
        href: e.href, text: e.textContent.trim(),
      })));
      note('Linki mailto:', `${mailLinks.length}`);
      const wrongMail = mailLinks.filter(l => !l.href.includes('biuro@eprzyczepy.eu'));
      if (wrongMail.length > 0) {
        bug('Mailto: z nieprawidłowym emailem', wrongMail.map(l => l.href).join(', '));
      } else {
        note('Mailto links OK', 'biuro@eprzyczepy.eu');
      }

      // Sprawdź czy "Zadzwoń" w kartach i kontakt mają TEN SAM numer
      const displayed = await p.$$eval('a[href^="tel:"] [class*="Value"], a[href^="tel:"] + div', els =>
        els.map(e => e.textContent.trim())
      );
      note('Wyświetlane numery (visible text)', displayed.join(' | '));

      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════
  // S18 — Print stylesheet
  // ══════════════════════════════════════════════
  sprint = 'S18-print-view';
  log('\n══ SPRINT 18: Widok do druku ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Emuluj media print
      await p.emulateMedia({ media: 'print' });
      await shot(p, 'S18-print-hero', true);

      // Sprawdź co jest widoczne w trybie druku
      const printVisible = await p.evaluate(() => {
        const els = Array.from(document.querySelectorAll('[class*="Header"], [class*="Cookie"], button, nav'));
        return els.filter(e => window.getComputedStyle(e).display !== 'none').length;
      });
      note('Elementy UI widoczne w print mode', `${printVisible}`);
      if (printVisible > 5) {
        bug('Dużo elementów UI widocznych w print mode', `${printVisible} elementów — brak @media print { display:none }`);
      }

      // Czy fixed header jest widoczny w print?
      const headerInPrint = await p.$eval('[class*="HeaderBar"], header', e => window.getComputedStyle(e).display).catch(() => 'none');
      note('Header w print mode', headerInPrint);
      if (headerInPrint !== 'none') {
        bug('Sticky header widoczny w trybie druku', 'Może wydrukować się na każdej stronie');
      }

      await p.emulateMedia({ media: 'screen' });
      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════
  // S19 — Kaucja i warunki w opisach przyczep
  // ══════════════════════════════════════════════
  sprint = 'S19-trailer-terms-content';
  log('\n══ SPRINT 19: Treść opisów — kaucja, warunki ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p);

    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      await scrollFull(p);
      const text = await p.evaluate(() => document.body.innerText);

      // Kaucja
      if (text.includes('kaucja') || text.includes('Kaucja')) {
        note('Kaucja widoczna w opisach', '✓');
      }

      // Sprawdź numeryczne wartości kaucji
      const kaucjaMatches = text.match(/[Kk]aucja[^.]*?(\d+)\s*zł/g);
      if (kaucjaMatches) note('Kaucja wartości', kaucjaMatches.join(' | '));

      // Opłata serwisowa
      if (text.includes('opłata serwisowa') || text.includes('250')) {
        note('Opłata serwisowa widoczna', '✓');
      }

      // Sprawdź czy są dane kontaktowe WEWNĄTRZ opisów (stary numer/email)
      const descEls = await p.$$eval('[class*="TrailerDescription"], [class*="Description"]', els =>
        els.map(e => e.innerText)
      );

      for (const desc of descEls) {
        if (desc.includes('509')) {
          bug('Stary numer tel 509... w opisie przyczepy', desc.substring(0, 80));
        }
        if (desc.includes('motowycena')) {
          bug('Stara domena motowycena w opisie przyczepy', desc.substring(0, 80));
        }
      }
      if (descEls.length > 0) note('Opisy przyczep przeskanowane', `${descEls.length} opisów`);

      // Sprawdź czy opis lawety ma poprawne dane DMC
      if (text.includes('2000KG') || text.includes('2000 KG') || text.includes('2000kg')) {
        note('DMC Lawety widoczne', '✓');
      }

      await shot(p, 'S19-trailer-descriptions');
      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════
  // S20 — Final: sticky header height po scrollu
  // ══════════════════════════════════════════════
  sprint = 'S20-sticky-header-consistency';
  log('\n══ SPRINT 20: Sticky header — wysokość i spójność przy scrollu ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    const jsErrs = [];
    p.on('console', m => { if (m.type() === 'error') jsErrs.push(m.text()); });
    p.on('pageerror', e => jsErrs.push(e.message));

    await go(p);
    if (!await verifyOurSite(p)) { bug('Zły serwer'); await ctx.close(); }
    else {
      // Header height na starcie
      const hAt0 = await p.$eval('[class*="HeaderBar"], header', e => e.getBoundingClientRect().height).catch(() => 0);
      note('Header height @ scroll=0', `${Math.round(hAt0)}px`);

      // Header height po scrollu 500px
      await p.evaluate(() => window.scrollTo(0, 500));
      await p.waitForTimeout(400);
      const hAt500 = await p.$eval('[class*="HeaderBar"], header', e => e.getBoundingClientRect().height).catch(() => 0);
      note('Header height @ scroll=500', `${Math.round(hAt500)}px`);

      if (Math.abs(hAt0 - hAt500) > 5) {
        bug('Header zmienia wysokość po scrollu', `${Math.round(hAt0)}px → ${Math.round(hAt500)}px`);
      } else {
        note('Header height spójna po scrollu', '');
      }

      // Header height na mobile
      await ctx.close();
      const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const p2   = await ctx2.newPage();
      await go(p2);
      if (await verifyOurSite(p2)) {
        const mhAt0 = await p2.$eval('[class*="HeaderBar"], header', e => e.getBoundingClientRect().height).catch(() => 0);
        note('Header height mobile @ scroll=0', `${Math.round(mhAt0)}px`);
        await p2.evaluate(() => window.scrollTo(0, 500));
        await p2.waitForTimeout(300);
        const mhAt500 = await p2.$eval('[class*="HeaderBar"], header', e => e.getBoundingClientRect().height).catch(() => 0);
        note('Header height mobile @ scroll=500', `${Math.round(mhAt500)}px`);
        if (Math.abs(mhAt0 - mhAt500) > 5) {
          bug('Header mobile zmienia wysokość po scrollu', `${Math.round(mhAt0)}px → ${Math.round(mhAt500)}px`);
        }
        await shot(p2, 'S20-mobile-header');
      }
      await ctx2.close();

      // Final screenshoty każdego viewportu
      for (const vp of [375, 768, 1280]) {
        const c = await browser.newContext({ viewport: { width: vp, height: 900 } });
        const pg = await c.newPage();
        await go(pg);
        if (await verifyOurSite(pg)) {
          await scrollFull(pg);
          await shot(pg, `S20-final-full-${vp}`, true);
        }
        await c.close();
      }

      if (jsErrs.length) jsErrs.forEach(e => bug('JS Error (final S20)', e));
      else note('Zero JS errors w całej rundzie 3', '');
    }
  }

  await browser.close();

  // ══════════════════════════════════════════════
  // ZAPIS BUGS-ROUND3.md
  // ══════════════════════════════════════════════
  const now = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const grouped = {};
  for (const b of bugs) {
    if (!grouped[b.sprint]) grouped[b.sprint] = [];
    grouped[b.sprint].push(b);
  }

  let md = `# BUGS RUNDA 3 — eprzyczepy.eu
> ${now} · 20 sprintów · ${bugs.length} bugów · ${notes.length} notatek · ${idx} screenshotów
> Screenshoty: \`./bug-screenshots-r3/\`

---

## Podsumowanie (${bugs.length} bugów)

`;

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

  md += `---\n\n## Notatki diagnostyczne\n\n`;
  for (const n of notes) {
    md += `- [\`${n.sprint}\`] **${n.t}**: ${n.d}\n`;
  }

  md += `\n---\n\n## Screenshoty (${idx} w \`./bug-screenshots-r3/\`)\n`;

  fs.writeFileSync(OUT, md, 'utf-8');
  log(`\n✅ BUGS-ROUND3.md — ${bugs.length} bugów, ${notes.length} notatek, ${idx} screenshotów`);
}

main().catch(e => { console.error(e); process.exit(1); });

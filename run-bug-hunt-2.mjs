/**
 * BUG HUNT RUNDA 2 — 20 sprintów
 * Tylko dokumentuje, nic nie zmienia.
 * Wyniki → BUGS-ROUND2.md
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE   = 'http://127.0.0.1:3001';
const SS_DIR = './bug-screenshots-r2';
const OUT    = './BUGS-ROUND2.md';
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

let idx = 0;
const bugs  = [];
const notes = [];
let sprint  = '';

const log  = m => process.stdout.write(m + '\n');
const bug  = (t, d = '', ss = null) => { bugs.push({ sprint, t, d, ss }); log(`  🐛 [${sprint}] ${t}${d ? ' — ' + d : ''}`); };
const note = (t, d = '')           => { notes.push({ sprint, t, d });     log(`  📝 [${sprint}] ${t}${d ? ': ' + d : ''}`); };

async function shot(page, name, full = false) {
  const f = path.join(SS_DIR, `${String(idx++).padStart(3,'0')}-${name}.png`);
  await page.screenshot({ path: f, fullPage: full });
  return path.basename(f);
}

async function go(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function scrollTo(page, sel) {
  await page.evaluate(s => {
    const el = document.querySelector(s);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, sel).catch(() => {});
  await page.waitForTimeout(600);
}

// ───────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({ headless: true });

  // ══════════════════════════════════════════════════════
  // S01 — iPhone SE 320px (najmniejszy realny viewport)
  // ══════════════════════════════════════════════════════
  sprint = 'S01-iphone-se-320';
  log('\n══ SPRINT 1: iPhone SE 320×568 ══');
  {
    const ctx = await browser.newContext({ viewport: { width:320, height:568 } });
    const p   = await ctx.newPage();
    await go(p, BASE);

    const ow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (ow > 2) bug('Horizontal overflow na 320px', `${ow}px`);
    else note('Brak overflow 320px');

    await shot(p, 'S01-320-hero');

    // Hero text readable?
    const h1  = await p.$eval('h1', e => ({ fs: window.getComputedStyle(e).fontSize, text: e.textContent.trim() })).catch(() => null);
    if (h1) {
      const fsNum = parseFloat(h1.fs);
      if (fsNum < 28) bug('H1 za mały na 320px', `${h1.fs}`);
      else note('H1 font-size 320px', h1.fs);
    }

    // Hero buttons stacked?
    const btns = await p.$$('section a[href="#kempingowe"], section a[href="#kontakt"]');
    if (btns.length >= 2) {
      const r0 = await btns[0].boundingBox();
      const r1 = await btns[1].boundingBox();
      if (r0 && r1 && r0.x === r1.x && r1.y > r0.y + r0.height - 5) note('Hero buttons stacked OK na 320px');
      else if (r0 && r1 && Math.abs(r0.y - r1.y) < 10) bug('Hero buttons obok siebie na 320px — mogą się nakładać', `y0=${r0.y} y1=${r1.y}`);
    }

    // Cookie banner fits?
    await p.waitForTimeout(600);
    const banner = await p.$('[role="dialog"]');
    if (banner) {
      const bb = await banner.boundingBox();
      if (bb && bb.width > 320) bug('Cookie banner szerszy niż 320px viewport', `${bb.width}px`);
      else note('Cookie banner mieści się w 320px');
      await shot(p, 'S01-320-cookie');
    }

    await scrollTo(p, '#kontakt');
    await shot(p, 'S01-320-contact');

    // Form fields full width?
    const inp = await p.$('input[id="contact-name"]');
    if (inp) {
      const bb = await inp.boundingBox();
      if (bb && bb.width < 260) bug('Input pola za wąskie na 320px', `${bb.width}px`);
      else note('Input width 320px', bb ? `${Math.round(bb.width)}px` : '?');
    }

    await shot(p, 'S01-320-full', true);
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S02 — iPhone 14 Pro 430px landscape
  // ══════════════════════════════════════════════════════
  sprint = 'S02-mobile-landscape-844';
  log('\n══ SPRINT 2: Mobile landscape 844×390 ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
    const p   = await ctx.newPage();
    await go(p, BASE);

    const ow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (ow > 2) bug('Overflow na landscape 844×390', `${ow}px`);
    else note('Brak overflow landscape');

    // Hero height - should not be 100vh (too tall in landscape)
    const heroH = await p.$eval('section:first-of-type', e => e.getBoundingClientRect().height).catch(() => 0);
    note('Hero height w landscape', `${Math.round(heroH)}px`);
    if (heroH > 600) bug('Hero section za wysoki w landscape mobile', `${Math.round(heroH)}px — użytkownik widzi tylko hero, musi scrollować`);

    await shot(p, 'S02-landscape-hero');
    await shot(p, 'S02-landscape-full', true);
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S03 — scroll-margin-top dokładny pomiar
  // ══════════════════════════════════════════════════════
  sprint = 'S03-scroll-margin-precision';
  log('\n══ SPRINT 3: scroll-margin-top — dokładny pomiar ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p, BASE);

    const headerH = await p.$eval('header, [class*="HeaderBar"]', e => e.getBoundingClientRect().height).catch(() => 104);
    note('Header height', `${Math.round(headerH)}px`);

    for (const id of ['kempingowe', 'transportowe', 'kontakt']) {
      await p.evaluate(s => {
        const el = document.querySelector(s);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, `#${id}`);
      await p.waitForTimeout(400);

      const top = await p.$eval(`#${id}`, e => e.getBoundingClientRect().top).catch(() => null);
      const smt = await p.$eval(`#${id}`, e => window.getComputedStyle(e).scrollMarginTop).catch(() => 'brak');

      note(`#${id} — scroll-margin-top`, smt);
      note(`#${id} — getBCR().top po scrollIntoView`, top !== null ? `${Math.round(top)}px` : 'null');

      if (top !== null && top < 0) bug(`#${id} chowa się za header po scrollIntoView`, `top=${Math.round(top)}px, header=${Math.round(headerH)}px`);
      if (top !== null && top > headerH + 30) bug(`#${id} za daleko od krawędzi — widać za mało sekcji`, `top=${Math.round(top)}px przy headerH=${Math.round(headerH)}px`);

      await shot(p, `S03-scroll-${id}`);
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S04 — alt texty wszystkich obrazków
  // ══════════════════════════════════════════════════════
  sprint = 'S04-img-alt-texts';
  log('\n══ SPRINT 4: Alt texty obrazków ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p, BASE);

    // Scroll to load all
    await p.evaluate(async () => {
      for (let i = 0; i < 20; i++) { window.scrollBy(0, 500); await new Promise(r => setTimeout(r, 80)); }
    });
    await p.waitForTimeout(500);

    const imgs = await p.$$eval('img', els => els.map(e => ({
      src: e.src.split('/').pop(),
      alt: e.alt,
      role: e.getAttribute('role'),
      ariaHidden: e.getAttribute('aria-hidden'),
    })));

    note('Łączna liczba img', `${imgs.length}`);

    for (const img of imgs) {
      if (!img.alt && img.ariaHidden !== 'true' && img.role !== 'presentation') {
        bug('Obrazek bez alt i bez aria-hidden', `src: ${img.src}`);
      }
      if (img.alt && img.alt.length > 125) {
        bug('Alt text za długi (>125 znaków)', `src: ${img.src}, alt: "${img.alt.substring(0, 60)}..."`);
      }
    }

    const withAlt    = imgs.filter(i => i.alt).length;
    const withoutAlt = imgs.filter(i => !i.alt).length;
    note('Obrazki z alt', `${withAlt}/${imgs.length}`);
    note('Obrazki bez alt', `${withoutAlt}/${imgs.length}`);
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S05 — kontrast tekstu (kluczowe elementy)
  // ══════════════════════════════════════════════════════
  sprint = 'S05-text-contrast';
  log('\n══ SPRINT 5: Kontrast tekstu ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p, BASE);

    // Sprawdź kolory kluczowych elementów przez getComputedStyle
    const checks = await p.evaluate(() => {
      const results = [];
      const toCheck = [
        { sel: 'h1',                            label: 'H1 hero' },
        { sel: 'nav a:first-child',             label: 'Nav link' },
        { sel: '[class*="SectionLead"]',         label: 'Section lead text' },
        { sel: '[class*="ContactLead"]',         label: 'Contact lead' },
        { sel: '[class*="FormLabel"]',           label: 'Form label' },
        { sel: '[class*="ConsentLabel"]',        label: 'Consent label' },
        { sel: '[class*="FooterCopy"]',          label: 'Footer copy' },
        { sel: '[class*="TrailerDescription"]',  label: 'Trailer description' },
        { sel: '[class*="ContactLabel"]',        label: 'Contact meta label' },
      ];
      for (const { sel, label } of toCheck) {
        const el = document.querySelector(sel);
        if (!el) { results.push({ label, found: false }); continue; }
        const st  = window.getComputedStyle(el);
        const bg  = window.getComputedStyle(el.closest('[style*="background"]') || document.body).backgroundColor;
        results.push({ label, found: true, color: st.color, bg: st.backgroundColor, fontSize: st.fontSize, fontWeight: st.fontWeight });
      }
      return results;
    });

    for (const c of checks) {
      if (!c.found) note(`Selektor nie znaleziony`, c.label);
      else note(`${c.label}`, `color=${c.color}, bg=${c.bg}, ${c.fontSize}/${c.fontWeight}`);
    }

    // Manual kontrastowe problemy do sprawdzenia
    // ContactLabel: opacity 0.5 na białym tle w ciemnej sekcji → może mieć zły kontrast
    const contactLabelOpacity = await p.$eval('[class*="ContactLabel"]', e => window.getComputedStyle(e).opacity).catch(() => null);
    if (contactLabelOpacity && parseFloat(contactLabelOpacity) < 0.6) {
      bug('ContactLabel ma opacity < 0.6 — możliwy problem z kontrastem WCAG', `opacity: ${contactLabelOpacity}`);
    }

    // Hero subtitle na tle dark gradient
    const heroSub = await p.$eval('[class*="HeroSubtitle"]', e => window.getComputedStyle(e).color).catch(() => null);
    note('Hero subtitle color', heroSub || 'nie znaleziono');

    await shot(p, 'S05-hero-contrast');
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S06 — formularz: edge case inputs
  // ══════════════════════════════════════════════════════
  sprint = 'S06-form-edge-cases';
  log('\n══ SPRINT 6: Formularz — edge cases ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    const consoleErrs = [];
    p.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });

    await go(p, BASE);
    await scrollTo(p, '#kontakt');

    const name  = await p.$('#contact-name');
    const phone = await p.$('#contact-phone');
    const msg   = await p.$('#contact-message');
    const cb    = await p.$('#contact-consent');
    const sub   = await p.$('button[type="submit"]');

    if (!name || !phone || !msg || !cb || !sub) { bug('Nie znaleziono pól formularza (edge case test)'); }
    else {
      // Test 1: bardzo długa wiadomość (5001 znaków — przekracza limit serwera)
      const longMsg = 'A'.repeat(5001);
      await name.fill('Test User');
      await phone.fill('+48600000000');
      await msg.fill(longMsg);
      await cb.check();
      note('Długość wiadomości w polu', `${longMsg.length} znaków`);
      // Sprawdź czy input ma maxlength lub ograniczenie
      const maxLen = await p.$eval('#contact-message', e => e.maxLength);
      if (maxLen === -1 || maxLen > 5000) {
        bug('Pole wiadomości nie ma maxlength — użytkownik może wpisać >5000 znaków (serwer odrzuci)', `maxLength=${maxLen}`);
      } else note('Textarea maxlength OK', `${maxLen}`);

      await shot(p, 'S06-form-long-msg');

      // Test 2: znaki specjalne w imieniu
      await name.fill('<script>alert(1)</script>');
      await phone.fill('+48600000000');
      await msg.fill('Test wiadomość');
      await shot(p, 'S06-form-special-chars');
      // Sprawdź czy nie ma XSS renderowanego
      const nameVal = await p.$eval('#contact-name', e => e.value);
      note('Wartość pola name ze znakami specjalnymi', nameVal);

      // Test 3: tylko spacje w imieniu
      await name.fill('   ');
      await phone.fill('+48600000000');
      await msg.fill('Test');
      await cb.check();
      await sub.click();
      await p.waitForTimeout(400);
      const validMsg = await p.$eval('#contact-name', e => e.validationMessage).catch(() => '');
      note('Walidacja: same spacje w imieniu', validMsg || 'brak walidacji');
      // HTML5 required nie łapie samych spacji → bug jeśli nie ma custom walidacji
      await shot(p, 'S06-form-spaces-only');

      // Test 4: email w polu telefonu
      await name.fill('Jan Kowalski');
      await phone.fill('niejestemtelefonem@example.com');
      await msg.fill('Test');
      await cb.check();
      const telType = await p.$eval('#contact-phone', e => e.type);
      note('Typ inputa telefon', telType); // type="tel" pozwala na wszystko — można wpisać email
      if (telType === 'tel') bug('Pole telefon type="tel" — przeglądarka nie waliduje formatu, można wpisać co chcesz', 'Brak custom walidacji formatu numeru');

      // Test 5: formularz po sukcesie — czy pola się czyszczą
      // (nie możemy wywołać prawdziwego POST bez SMTP, ale sprawdzamy czy stan jest "idle")
      const statusEl = await p.$('[role="status"], [role="alert"]');
      note('Status formularza po edge testach', statusEl ? 'widoczny komunikat' : 'brak komunikatu');
    }

    if (consoleErrs.length) consoleErrs.forEach(e => bug('Console error w trakcie edge case form test', e));
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S07 — focus trap w mobile menu
  // ══════════════════════════════════════════════════════
  sprint = 'S07-focus-trap-menu';
  log('\n══ SPRINT 7: Focus trap / dostępność mobile menu ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const p   = await ctx.newPage();
    await go(p, BASE);
    await p.waitForTimeout(600);

    // Dismiss cookie banner first
    const rejectBtn = await p.$('button:has-text("Odrzuć")');
    if (rejectBtn) await rejectBtn.click().catch(() => {});
    await p.waitForTimeout(300);

    const menuBtn = await p.$('button[aria-expanded]');
    if (!menuBtn) { bug('Brak przycisku menu (focus trap test)'); }
    else {
      await menuBtn.click();
      await p.waitForTimeout(300);
      await shot(p, 'S07-menu-open');

      // Tab inside menu — czy focus zostaje w menu?
      await p.keyboard.press('Tab');
      const f1 = await p.evaluate(() => document.activeElement?.textContent?.trim());
      note('Focus po Tab (menu otwarty)', f1 || 'brak');

      await p.keyboard.press('Tab');
      const f2 = await p.evaluate(() => document.activeElement?.textContent?.trim());
      note('Focus po 2x Tab', f2 || 'brak');

      await p.keyboard.press('Tab');
      const f3 = await p.evaluate(() => document.activeElement?.textContent?.trim());
      note('Focus po 3x Tab', f3 || 'brak');

      // Escape zamyka menu?
      await p.keyboard.press('Escape');
      await p.waitForTimeout(300);
      const expanded = await menuBtn.getAttribute('aria-expanded');
      if (expanded !== 'false') bug('Escape nie zamyka mobile menu', `aria-expanded=${expanded}`);
      else note('Escape zamyka menu OK');

      await shot(p, 'S07-after-escape');
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S08 — tytuł strony na widoku polityki prywatności
  // ══════════════════════════════════════════════════════
  sprint = 'S08-title-on-pp-view';
  log('\n══ SPRINT 8: Title/URL na widoku Polityki Prywatności ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p, `${BASE}#polityka-prywatnosci`);
    await p.waitForTimeout(600);

    const title = await p.title();
    note('Tytuł strony na widoku PP', title);
    // SPA — title nie zmienia się, zawsze pokazuje główny tytuł
    if (!title.includes('Prywatności') && !title.includes('EPRZYCZEPY')) {
      bug('Tytuł strony nie aktualizuje się na widoku Polityki Prywatności', `title="${title}"`);
    }
    // Sprawdź czy to SPA - title pewnie zostaje ten sam
    note('SPA — title nie zmienia się (oczekiwane)', title);

    // URL — czy hash jest #polityka-prywatnosci?
    const url = p.url();
    note('URL na widoku PP', url);
    if (!url.includes('#polityka-prywatnosci')) bug('URL nie zawiera #polityka-prywatnosci na widoku PP', url);

    // Back button na górze i dole?
    const backBtns = await p.$$('button:has-text("Wróć")');
    note('Liczba przycisków Wróć', `${backBtns.length}`);
    if (backBtns.length < 2) bug('Brak drugiego przycisku Wróć na dole Polityki Prywatności', `znaleziono ${backBtns.length}`);

    // Sprawdź czy PP nie ma nav header zakrywający content
    const ppWrapTop = await p.$eval('[class*="Wrapper"]', e => e.getBoundingClientRect().top).catch(() => null);
    note('PP wrapper top offset', ppWrapTop !== null ? `${Math.round(ppWrapTop)}px` : 'brak');

    await shot(p, 'S08-pp-title-url');
    await shot(p, 'S08-pp-full', true);
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S09 — opisopisy przyczep: overflow na małych ekranach
  // ══════════════════════════════════════════════════════
  sprint = 'S09-description-overflow';
  log('\n══ SPRINT 9: Opisy przyczep — overflow / czytelność ══');
  {
    for (const vp of [{ w: 375, h: 812, n: 'mobile' }, { w: 768, h: 1024, n: 'tablet' }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const p   = await ctx.newPage();
      await go(p, BASE);
      await p.evaluate(async () => {
        for (let i = 0; i < 15; i++) { window.scrollBy(0, 400); await new Promise(r => setTimeout(r, 60)); }
      });
      await p.waitForTimeout(600);

      const descs = await p.$$eval('[class*="TrailerDescription"], [class*="Description"]', els =>
        els.map(e => ({
          overflowX: window.getComputedStyle(e).overflowX,
          scrollWidth: e.scrollWidth,
          clientWidth: e.clientWidth,
          text: e.textContent.trim().substring(0, 40),
        }))
      );

      for (const d of descs) {
        if (d.scrollWidth > d.clientWidth + 2) {
          bug(`Opis przyczepy ma horizontal scroll na ${vp.n}`, `"${d.text}..." scrollWidth=${d.scrollWidth} > clientWidth=${d.clientWidth}`);
        }
      }
      note(`Opisy przyczep overflow check ${vp.n}`, `${descs.length} elementów`);

      // Sprawdź czy długie słowa (np. ceny, tech specs) się łamią
      const longWords = await p.evaluate(() => {
        const els = document.querySelectorAll('[class*="TrailerDescription"]');
        const issues = [];
        for (const el of els) {
          const st = window.getComputedStyle(el);
          if (st.overflowWrap !== 'anywhere' && st.wordBreak !== 'break-word' && st.wordBreak !== 'break-all') {
            issues.push(el.textContent.trim().substring(0, 30));
          }
        }
        return issues;
      });
      if (longWords.length > 0) bug(`TrailerDescription bez overflow-wrap na ${vp.n}`, longWords.join(', '));

      await shot(p, `S09-desc-${vp.n}`);
      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════════════
  // S10 — header sticky: czy zakrywa content przy anchorach
  // ══════════════════════════════════════════════════════
  sprint = 'S10-sticky-header-overlap';
  log('\n══ SPRINT 10: Sticky header — czy zakrywa content ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p, BASE);

    // Przewiń do każdej sekcji przez anchor i sprawdź czy header ją zakrywa
    for (const id of ['kempingowe', 'transportowe', 'kontakt']) {
      await p.evaluate(s => {
        const el = document.querySelector(s);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, `#${id}`);
      await p.waitForTimeout(400);

      const result = await p.evaluate(s => {
        const section = document.querySelector(s);
        const header  = document.querySelector('header') || document.querySelector('[class*="Header"]');
        if (!section || !header) return null;
        const sTop  = section.getBoundingClientRect().top;
        const hBot  = header.getBoundingClientRect().bottom;
        return { sTop: Math.round(sTop), hBot: Math.round(hBot), hidden: sTop < hBot };
      }, `#${id}`);

      if (!result) { note(`#${id} — nie znaleziono elementu`); continue; }

      if (result.hidden) {
        bug(`Nagłówek sekcji #${id} chowany za sticky header`, `sectionTop=${result.sTop}px < headerBottom=${result.hBot}px`);
      } else {
        note(`#${id} — nie zakryty przez header`, `sTop=${result.sTop}, hBot=${result.hBot}`);
      }

      await shot(p, `S10-sticky-${id}`);
    }
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S11 — dark mode (prefers-color-scheme: dark)
  // ══════════════════════════════════════════════════════
  sprint = 'S11-dark-mode';
  log('\n══ SPRINT 11: Dark mode (prefers-color-scheme: dark) ══');
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'dark',
    });
    const p = await ctx.newPage();
    await go(p, BASE);

    await shot(p, 'S11-dark-mode-hero');

    // Sprawdź czy strona ma jakiekolwiek dark mode CSS
    const hasDarkCSS = await p.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const r of rules) {
            if (r.conditionText?.includes('prefers-color-scheme: dark')) return true;
          }
        } catch {}
      }
      return false;
    });

    if (!hasDarkCSS) {
      bug('Brak obsługi prefers-color-scheme: dark w CSS', 'Strona nie ma dark mode — może wyglądać jaskrawo u użytkowników z dark mode systemu');
    } else {
      note('Dark mode CSS znaleziony');
    }

    // Sprawdź czy tło jest białe (brak adaptacji)
    const bodyBg = await p.$eval('body', e => window.getComputedStyle(e).backgroundColor).catch(() => '');
    note('Body background w dark mode', bodyBg);
    if (bodyBg === 'rgb(255, 255, 255)' || bodyBg === 'rgba(255, 255, 255, 1)') {
      bug('Strona ma białe tło w trybie ciemnym — brak adaptacji dark mode', bodyBg);
    }

    await shot(p, 'S11-dark-mode-full', true);
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S12 — tabindex order na formularzu
  // ══════════════════════════════════════════════════════
  sprint = 'S12-tabindex-form';
  log('\n══ SPRINT 12: Tab order formularza ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p, BASE);
    await scrollTo(p, '#kontakt');

    // Zbierz kolejność focus przez Tab
    const order = [];
    // Kliknij pierwszy input żeby zacząć od formularza
    await p.click('#contact-name').catch(() => {});
    for (let i = 0; i < 8; i++) {
      const focused = await p.evaluate(() => {
        const el = document.activeElement;
        return el ? (el.id || el.name || el.tagName + ':' + el.type || el.textContent?.trim().substring(0, 20)) : 'none';
      });
      order.push(focused);
      await p.keyboard.press('Tab');
      await p.waitForTimeout(50);
    }
    note('Tab order w formularzu', order.join(' → '));

    // Sprawdź czy checkbox jest przed submit
    const cbIdx   = order.findIndex(o => o.includes('contact-consent') || o === 'contact-consent');
    const subIdx  = order.findIndex(o => o.includes('submit') || o === 'BUTTON:submit');
    if (cbIdx !== -1 && subIdx !== -1 && cbIdx > subIdx) {
      bug('Checkbox zgody jest po przycisku Submit w tab order', `cb pos=${cbIdx}, submit pos=${subIdx}`);
    } else note('Tab order: checkbox przed submit OK');

    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S13 — szybkość wczytywania + render-blocking
  // ══════════════════════════════════════════════════════
  sprint = 'S13-performance-timing';
  log('\n══ SPRINT 13: Timing wczytywania strony ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    const start = Date.now();
    await go(p, BASE);
    const loadTime = Date.now() - start;
    note('Czas go() + networkidle', `${loadTime}ms`);

    // Performance timing API
    const timing = await p.evaluate(() => {
      const t = performance.timing;
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(t.domContentLoadedEventEnd - t.navigationStart),
        load: Math.round(t.loadEventEnd - t.navigationStart),
        fcp: Math.round(nav?.responseEnd - nav?.startTime || 0),
      };
    });
    note('DOMContentLoaded', `${timing.domContentLoaded}ms`);
    note('Load event', `${timing.load}ms`);

    if (timing.domContentLoaded > 3000) bug('DOMContentLoaded > 3s', `${timing.domContentLoaded}ms`);
    if (timing.load > 5000) bug('Load event > 5s', `${timing.load}ms`);

    // Render-blocking resources
    const blocking = await p.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.renderBlockingStatus === 'blocking')
        .map(r => r.name.split('/').pop());
    });
    if (blocking.length > 0) bug('Render-blocking resources wykryte', blocking.join(', '));
    else note('Brak render-blocking resources');

    // Łączny transfer
    const totalBytes = await p.evaluate(() =>
      performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0)
    );
    note('Łączny transfer (bytes)', `${Math.round(totalBytes / 1024)} KB`);
    if (totalBytes > 2 * 1024 * 1024) bug('Łączny transfer > 2MB', `${Math.round(totalBytes/1024)}KB`);

    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S14 — trailer cards: szczegóły treści
  // ══════════════════════════════════════════════════════
  sprint = 'S14-trailer-content-detail';
  log('\n══ SPRINT 14: Szczegóły treści kart przyczep ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p   = await ctx.newPage();
    await go(p, BASE);
    await p.evaluate(async () => {
      for (let i = 0; i < 20; i++) { window.scrollBy(0, 400); await new Promise(r => setTimeout(r, 60)); }
    });
    await p.waitForTimeout(600);

    const cards = await p.$$('article');
    note('Liczba kart', `${cards.length}`);
    if (cards.length !== 4) bug('Oczekiwano 4 kart (2 kemping + 2 transport)', `znaleziono ${cards.length}`);

    // Sprawdź każdą kartę
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const text = await card.textContent();

      // H3 title
      const h3 = await card.$eval('h3', e => e.textContent.trim()).catch(() => null);
      if (!h3) { bug(`Karta ${i+1}: brak h3`, ''); continue; }
      note(`Karta ${i+1}`, h3);

      // Cena — szukamy tekstu ze "zł"
      if (!text.includes('zł')) bug(`Karta ${i+1} (${h3}): brak ceny zł`, '');
      else note(`Karta ${i+1} cena`, text.match(/[\d\s]+zł[^)]+/)?.[0]?.trim() || 'znaleziono');

      // Badge (Kemping/Transport)
      const badge = await card.$eval('[class*="Badge"], [class*="badge"]', e => e.textContent.trim()).catch(() => null);
      if (!badge) bug(`Karta ${i+1} (${h3}): brak badge (Kemping/Transport)`, '');
      else note(`Karta ${i+1} badge`, badge);

      // Zdjęcia są załadowane?
      const imgOk = await card.$$eval('img', imgs => imgs.every(img => img.naturalWidth > 0));
      if (!imgOk) bug(`Karta ${i+1} (${h3}): zdjęcia nie załadowane`, '');
      else note(`Karta ${i+1} zdjęcia OK`, '');

      // CTA href
      const cta = await card.$eval('a[href*="tel"]', e => e.getAttribute('href')).catch(() => null);
      if (!cta) bug(`Karta ${i+1} (${h3}): brak CTA tel:`, '');
    }

    await shot(p, 'S14-cards-loaded');
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S15 — hero image cover / object-fit na mobile
  // ══════════════════════════════════════════════════════
  sprint = 'S15-hero-img-cover';
  log('\n══ SPRINT 15: Hero image object-fit i wymiary ══');
  {
    for (const vp of [{ w: 375, h: 812, n: 'mobile' }, { w: 1280, h: 800, n: 'desktop' }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const p   = await ctx.newPage();
      await go(p, BASE);

      const heroImg = await p.$('section img').catch(() => null);
      if (!heroImg) { bug(`Hero img nie znaleziony na ${vp.n}`); await ctx.close(); continue; }

      const styles = await p.$eval('section img', e => {
        const st = window.getComputedStyle(e);
        const bb = e.getBoundingClientRect();
        return { objectFit: st.objectFit, width: Math.round(bb.width), height: Math.round(bb.height), natural: `${e.naturalWidth}x${e.naturalHeight}` };
      });
      note(`Hero img ${vp.n}`, `objectFit=${styles.objectFit}, rendered=${styles.width}x${styles.height}, natural=${styles.natural}`);

      if (styles.objectFit !== 'cover') bug(`Hero img objectFit nie jest "cover" na ${vp.n}`, styles.objectFit);
      if (styles.height < 300) bug(`Hero img za niski na ${vp.n}`, `${styles.height}px`);
      if (styles.width < vp.w - 5) bug(`Hero img nie pokrywa pełnej szerokości na ${vp.n}`, `${styles.width}px < ${vp.w}px`);

      await shot(p, `S15-hero-${vp.n}`);
      await ctx.close();
    }
  }

  // ══════════════════════════════════════════════════════
  // S16 — link "Polityka prywatności" w stopce i consent
  // ══════════════════════════════════════════════════════
  sprint = 'S16-pp-links';
  log('\n══ SPRINT 16: Linki do Polityki Prywatności ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    await go(p, BASE);

    // Wszystkie linki do PP
    const ppLinks = await p.$$eval('a[href="#polityka-prywatnosci"]', els => els.map(e => ({
      text: e.textContent.trim(), visible: e.offsetParent !== null, location: e.closest('footer') ? 'footer' : e.closest('[role="dialog"]') ? 'cookie-banner' : e.closest('form') ? 'form' : 'inne',
    })));
    note('Linki do #polityka-prywatnosci', JSON.stringify(ppLinks));
    if (ppLinks.length === 0) bug('Brak linków do Polityki Prywatności na stronie głównej', '');

    const footerPPLink = ppLinks.find(l => l.location === 'footer');
    if (!footerPPLink) bug('Brak linku PP w stopce', '');
    else note('Link PP w stopce OK', footerPPLink.text);

    const formPPLink = ppLinks.find(l => l.location === 'form');
    if (!formPPLink) {
      // Może być w consent checkbox area
      await scrollTo(p, '#kontakt');
      const consentText = await p.$eval('[class*="ConsentLabel"]', e => e.innerHTML).catch(() => '');
      if (!consentText.includes('polityka-prywatnosci') && !consentText.includes('Polityk')) {
        bug('Brak linku do PP w checkboxie zgody RODO', '');
      } else note('Link PP w consent OK', '');
    }

    // Sprawdź czy cookie banner ma link PP
    await p.goto(BASE, { waitUntil: 'networkidle' }); // fresh page
    await p.waitForTimeout(700);
    const cookiePPLink = await p.$('[role="dialog"] a[href="#polityka-prywatnosci"]');
    if (!cookiePPLink) bug('Brak linku do PP w cookie consent bannerze', '');
    else note('Link PP w cookie banner OK', await cookiePPLink.textContent());

    await shot(p, 'S16-pp-links');
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S17 — animacje: czy są widoczne / nie blokują
  // ══════════════════════════════════════════════════════
  sprint = 'S17-animations';
  log('\n══ SPRINT 17: Animacje motion/react ══');
  {
    // Test z prefers-reduced-motion
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const p = await ctx.newPage();
    await go(p, BASE);
    await shot(p, 'S17-reduced-motion');

    // Sprawdź czy animacje są respektowane
    const hasReducedCSS = await p.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const r of rules) {
            if (r.conditionText?.includes('prefers-reduced-motion')) return true;
          }
        } catch {}
      }
      return false;
    });

    if (!hasReducedCSS) {
      bug('Brak obsługi prefers-reduced-motion w CSS', 'Animacje mogą być nieprzyjemne dla osób z vestibular disorder');
    } else note('prefers-reduced-motion CSS znaleziony');

    // Motion library — czy Framer Motion respektuje reduced-motion?
    // Framer Motion automatycznie wyłącza animacje przy reduced-motion=reduce
    note('Framer Motion (motion/react)', 'automatycznie respektuje prefers-reduced-motion');

    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S18 — sprawdź czy Turnstile captcha działa
  // ══════════════════════════════════════════════════════
  sprint = 'S18-turnstile-captcha';
  log('\n══ SPRINT 18: Turnstile / captcha ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    const requests = [];
    p.on('request', req => { if (req.url().includes('turnstile')) requests.push(req.url()); });

    await go(p, BASE);
    await p.waitForTimeout(1000);

    // Czy Turnstile się ładuje?
    const turnstileScript = await p.$('script[src*="turnstile"]');
    const turnstileWidget = await p.$('[class*="Turnstile"], iframe[src*="challenges.cloudflare"]');

    note('Turnstile script w DOM', turnstileScript ? 'tak' : 'nie');
    note('Turnstile widget renderowany', turnstileWidget ? 'tak' : 'nie');
    note('Turnstile network requests', requests.length ? requests[0] : 'brak');

    if (!turnstileScript && requests.length === 0) {
      bug('Turnstile captcha nie ładuje się', 'TURNSTILE_SITE_KEY prawdopodobnie niezdefiniowany — formularz wyśle bez captcha na produkcji lub zablokuje');
    }

    // Sprawdź env var w kliencie
    const siteKey = await p.evaluate(() => {
      // App.tsx odczytuje process.env.TURNSTILE_SITE_KEY przez Vite
      // Jeśli jest undefined → widget się nie wyrenderuje
      return window.__TURNSTILE_SITE_KEY__ || null;
    });
    note('TURNSTILE_SITE_KEY w window', siteKey || 'undefined (normalnie dla dev)');

    await scrollTo(p, '#kontakt');
    await shot(p, 'S18-captcha-area');
    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S19 — 404 i błędne URL
  // ══════════════════════════════════════════════════════
  sprint = 'S19-404-and-bad-urls';
  log('\n══ SPRINT 19: 404 i błędne URL-e ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();

    // Sprawdź czy strona ma obsługę 404
    const resp = await p.goto(`${BASE}/nieistniejaca-strona`, { waitUntil: 'domcontentloaded' });
    const status = resp?.status() ?? 0;
    note('HTTP status dla nieistniejącej strony', `${status}`);
    if (status === 200) {
      bug('Vite dev serwer zwraca 200 dla /nieistniejaca-strona', 'Na produkcji (Node.js) to może być problem — SPA powinien zwracać index.html ze statusem 200, ale expressowy serwer musi to obsłużyć');
    }
    await shot(p, 'S19-404-page');

    // Sprawdź wszystkie href na stronie głównej
    await go(p, BASE);
    const allLinks = await p.$$eval('a[href]', els => els.map(e => ({
      href: e.getAttribute('href'),
      text: e.textContent.trim().substring(0, 30),
      external: e.href.startsWith('http'),
    })));

    note('Łączna liczba linków', `${allLinks.length}`);

    // External links — powinny mieć target=_blank i rel=noopener
    const externalLinks = await p.$$eval('a[href^="http"]', els => els.map(e => ({
      href: e.href,
      target: e.target,
      rel: e.rel,
      text: e.textContent.trim().substring(0, 30),
    })));
    note('Zewnętrzne linki', `${externalLinks.length}`);
    for (const link of externalLinks) {
      if (link.target !== '_blank') bug('Zewnętrzny link bez target="_blank"', `"${link.text}" → ${link.href}`);
      if (!link.rel.includes('noopener')) bug('Zewnętrzny link bez rel="noopener"', `"${link.text}" → ${link.href}`);
    }

    // Sprawdź 2mcode.pl link w stopce
    const credLink = await p.$('a[href*="2mcode"]');
    if (credLink) {
      const target = await credLink.getAttribute('target');
      const rel    = await credLink.getAttribute('rel');
      note('2mcode.pl link target', target || 'brak');
      note('2mcode.pl link rel', rel || 'brak');
    }

    await ctx.close();
  }

  // ══════════════════════════════════════════════════════
  // S20 — finalna weryfikacja całościowa
  // ══════════════════════════════════════════════════════
  sprint = 'S20-final-holistic';
  log('\n══ SPRINT 20: Finalna weryfikacja całościowa ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p   = await ctx.newPage();
    const allErrors = [];
    p.on('console', m => { if (m.type() === 'error') allErrors.push(m.text()); });
    p.on('pageerror', e => allErrors.push('pageerror: ' + e.message));

    await go(p, BASE);

    // Sprawdź favicon
    const favicon = await p.$('link[rel*="icon"]');
    if (!favicon) bug('Brak tagu favicon');
    else {
      const fhref = await favicon.getAttribute('href');
      note('Favicon href', fhref);
      // sprawdź czy plik istnieje
      const favResp = await p.evaluate(href => fetch(href).then(r => r.status).catch(() => 0), fhref);
      if (favResp !== 200) bug('Favicon zwraca nie-200', `${fhref} → ${favResp}`);
      else note('Favicon dostępny', fhref);
    }

    // Sprawdź czy og:image plik istnieje
    const ogImg = await p.$eval('meta[property="og:image"]', e => e.content).catch(() => '');
    note('og:image URL', ogImg);
    // Nie możemy fetchować zewnętrznych URL (eprzyczepy.eu nie istnieje jeszcze)
    // Ale lokalnie: /og-image.jpg
    const ogLocal = await p.evaluate(() => fetch('/og-image.jpg').then(r => r.status).catch(() => 0));
    if (ogLocal !== 200) bug('Lokalny /og-image.jpg nie istnieje lub zwraca błąd', `status: ${ogLocal}`);
    else note('og-image.jpg dostępny lokalnie', `status: ${ogLocal}`);

    // Sprawdź lang na html
    const lang = await p.$eval('html', e => e.lang).catch(() => '');
    if (!lang) bug('Brak lang na <html>', '');
    else note('html lang', lang);

    // Sprawdź czy meta viewport jest ok
    const viewport = await p.$eval('meta[name="viewport"]', e => e.content).catch(() => '');
    note('meta viewport', viewport);
    if (!viewport.includes('width=device-width')) bug('meta viewport nie zawiera width=device-width', viewport);

    // Sprawdź theme-color
    const themeColor = await p.$eval('meta[name="theme-color"]', e => e.content).catch(() => '');
    note('theme-color', themeColor);

    // Sprawdź czy sitemap.xml dostępny
    const sitemapStatus = await p.evaluate(() => fetch('/sitemap.xml').then(r => r.status).catch(() => 0));
    if (sitemapStatus !== 200) bug('/sitemap.xml zwraca nie-200', `status: ${sitemapStatus}`);
    else note('sitemap.xml dostępny', `status: ${sitemapStatus}`);

    // Sprawdź robots.txt
    const robotsStatus = await p.evaluate(() => fetch('/robots.txt').then(r => r.status).catch(() => 0));
    if (robotsStatus !== 200) bug('/robots.txt zwraca nie-200', `status: ${robotsStatus}`);
    else note('robots.txt dostępny', `status: ${robotsStatus}`);

    // Finalne screenshoty każdego breakpointa
    await shot(p, 'S20-final-1280');
    await ctx.close();

    for (const vp of [{ w:375, n:'375' }, { w:768, n:'768' }, { w:1920, n:'1920' }]) {
      const c2 = await browser.newContext({ viewport: { width: vp.w, height: 900 } });
      const p2 = await c2.newPage();
      await go(p2, BASE);
      await p2.evaluate(async () => {
        for (let i = 0; i < 30; i++) { window.scrollBy(0, 400); await new Promise(r => setTimeout(r, 40)); }
      });
      await p2.waitForTimeout(800);
      await shot(p2, `S20-final-${vp.n}`, true);
      await c2.close();
    }

    if (allErrors.length) allErrors.forEach(e => bug('JS Error (final)', e));
    else note('Brak JS errors w finalnej rundzie');
  }

  await browser.close();

  // ══════════════════════════════════════════════════════
  // ZAPIS BUGS-ROUND2.md
  // ══════════════════════════════════════════════════════
  const now = new Date().toLocaleDateString('pl-PL', {
    year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'
  });

  const grouped = {};
  for (const b of bugs) {
    if (!grouped[b.sprint]) grouped[b.sprint] = [];
    grouped[b.sprint].push(b);
  }

  let md = `# BUGS RUNDA 2 — eprzyczepy.eu
> Audyt automatyczny · ${now} · 20 sprintów · ${bugs.length} bugów · ${notes.length} notatek · ${idx} screenshotów
> Screenshoty: \`./bug-screenshots-r2/\`

---

## Podsumowanie — znalezione bugi (${bugs.length})

`;

  const allBugsList = [...bugs];
  for (let i = 0; i < allBugsList.length; i++) {
    const b = allBugsList[i];
    md += `**B${i+1}** [${b.sprint}] ${b.t}${b.d ? `  \n> ${b.d}` : ''}\n\n`;
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
    md += `- [${n.sprint}] **${n.t}**: ${n.d}\n`;
  }

  md += `\n---\n\n## Screenshoty (${idx} plików w \`./bug-screenshots-r2/\`)\n`;

  fs.writeFileSync(OUT, md, 'utf-8');
  log(`\n✅ BUGS-ROUND2.md — ${bugs.length} bugów, ${notes.length} notatek, ${idx} screenshotów`);
}

main().catch(e => { console.error(e); process.exit(1); });

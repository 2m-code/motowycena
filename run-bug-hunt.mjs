/**
 * BUG HUNT — 20 sprintów
 * Tylko dokumentuje, nic nie zmienia.
 * Wyniki → BUGS.md
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:3001';
const SS_DIR = './bug-screenshots';
const BUGS_FILE = './BUGS.md';
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

let ssIdx = 0;
const bugs = [];
const notes = [];
let currentSprint = '';

function log(msg) { process.stdout.write(msg + '\n'); }

async function ss(page, name) {
  const file = path.join(SS_DIR, `${String(ssIdx++).padStart(3,'0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return path.basename(file);
}
async function ssFull(page, name) {
  const file = path.join(SS_DIR, `${String(ssIdx++).padStart(3,'0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return path.basename(file);
}

function bug(title, details, screenshot = null) {
  const entry = { sprint: currentSprint, title, details, screenshot };
  bugs.push(entry);
  log(`  🐛 BUG [${currentSprint}]: ${title}`);
  if (details) log(`     ${details}`);
}
function note(title, details) {
  notes.push({ sprint: currentSprint, title, details });
  log(`  📝 NOTE [${currentSprint}]: ${title}`);
}

async function goto(page, url, wait = 'networkidle') {
  await page.goto(url, { waitUntil: wait, timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}

// ─────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({ headless: true });

  // ═══════════════════════════════════════
  // SPRINT 1 — Desktop hero & above fold
  // ═══════════════════════════════════════
  currentSprint = 'S01-desktop-hero';
  log('\n══ SPRINT 1: Desktop hero & above fold (1280×800) ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errs = []; page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
    page.on('pageerror', e => bug('JS pageerror', e.message));

    await goto(page, BASE);
    const s1 = await ss(page, 'S01-hero-desktop');

    // Title
    const title = await page.title();
    if (!title.includes('EPRZYCZEPY')) bug('Tytuł strony nie zawiera EPRZYCZEPY.EU', `Tytuł: "${title}"`);
    else note('Tytuł strony OK', title);

    // Hero h1
    const h1 = await page.$eval('h1', el => el.textContent.trim()).catch(() => null);
    if (!h1) bug('Brak tagu H1 na stronie', '');
    else note('H1 OK', h1);

    // Hero image loaded
    const heroImg = await page.$('section img[fetchpriority="high"], section img[fetchPriority="high"]');
    if (!heroImg) {
      // try alt approach
      const anyHeroImg = await page.$('img[alt*="Tabbert"], img[alt*="przyczepa"]');
      if (!anyHeroImg) bug('Hero image nie znaleziona', 'Brak img z fetchPriority high lub alt=Tabbert');
    }

    // Nav visible
    const navLinks = await page.$$eval('nav a', els => els.map(e => e.textContent.trim()));
    if (navLinks.length === 0) bug('Brak linków nawigacyjnych', '');
    else note('Nav linki', navLinks.join(', '));

    // Navbar height
    const headerH = await page.$eval('header', el => el.getBoundingClientRect().height).catch(() => 0);
    if (headerH > 130) bug('Header za wysoki', `${headerH}px — może zasłaniać content`);
    else note('Header height OK', `${headerH}px`);

    // Cookie banner pojawia się
    await page.waitForTimeout(600);
    const cookieBanner = await page.$('[role="dialog"]');
    if (!cookieBanner) bug('Cookie consent banner nie pojawia się', 'Brak elementu role=dialog po 600ms');
    else note('Cookie banner OK', 'widoczny');

    // Console errors
    if (errs.length) errs.forEach(e => bug('Console error', e));
    else note('Brak console errors', '');

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 2 — Desktop full scroll
  // ═══════════════════════════════════════
  currentSprint = 'S02-desktop-fullscroll';
  log('\n══ SPRINT 2: Desktop — full page scroll ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    // Scroll section by section
    for (const anchor of ['#kempingowe', '#transportowe', '#kontakt']) {
      await page.evaluate(a => {
        const el = document.querySelector(a);
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, anchor);
      await page.waitForTimeout(600);
      const name = anchor.replace('#','');
      await ss(page, `S02-scroll-${name}`);
    }

    // Full page screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const fullImg = await ssFull(page, 'S02-fullpage');

    // Check sections exist
    for (const id of ['kempingowe', 'transportowe', 'kontakt']) {
      const el = await page.$(`#${id}`);
      if (!el) bug(`Sekcja #${id} nie istnieje w DOM`, '');
      else note(`Sekcja #${id} OK`, '');
    }

    // Footer exists
    const footer = await page.$('footer');
    if (!footer) bug('Brak elementu footer', '');

    // Footer copyright text
    const footerText = await page.$eval('footer', el => el.textContent).catch(() => '');
    if (!footerText.includes('EPRZYCZEPY')) bug('Footer nie zawiera EPRZYCZEPY.EU', `Text: ${footerText.substring(0,100)}`);
    else note('Footer brand OK', '');

    // Horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) bug('Horizontal overflow na desktop', `${overflow}px nadmiaru`);
    else note('Brak overflow desktop', '');

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 3 — Mobile 375px
  // ═══════════════════════════════════════
  currentSprint = 'S03-mobile-375';
  log('\n══ SPRINT 3: Mobile 375×812 ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await goto(page, BASE);
    await ss(page, 'S03-mobile-hero');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) bug('Horizontal overflow na mobile 375px', `${overflow}px nadmiaru`);
    else note('Brak overflow mobile', '');

    // Mobile menu button visible
    const menuBtn = await page.$('button[aria-label*="menu"], button[aria-label*="Menu"]');
    if (!menuBtn) bug('Brak przycisku mobile menu', '');
    else {
      const visible = await menuBtn.isVisible();
      if (!visible) bug('Przycisk mobile menu niewidoczny', '');
      else note('Mobile menu button OK', '');
    }

    // Desktop nav hidden on mobile
    const desktopNav = await page.$eval('nav', el => {
      const s = window.getComputedStyle(el);
      return s.display;
    }).catch(() => 'unknown');
    // DesktopNav is display:none on mobile (it's inside a styled component)
    note('Desktop nav display na mobile', desktopNav);

    // Hero buttons stacked or visible
    await page.evaluate(() => window.scrollTo(0, 200));
    await ss(page, 'S03-mobile-below-hero');

    // Scroll to contact
    await page.evaluate(() => {
      const el = document.querySelector('#kontakt');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(400);
    await ss(page, 'S03-mobile-contact');

    // Contact form visible
    const form = await page.$('form');
    if (!form) bug('Formularz kontaktowy nie istnieje na mobile', '');
    else note('Formularz widoczny na mobile', '');

    await ssFull(page, 'S03-mobile-full');
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 4 — Tablet 768px
  // ═══════════════════════════════════════
  currentSprint = 'S04-tablet-768';
  log('\n══ SPRINT 4: Tablet 768×1024 ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await ctx.newPage();
    await goto(page, BASE);
    await ss(page, 'S04-tablet-hero');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) bug('Horizontal overflow na tablecie 768px', `${overflow}px nadmiaru`);
    else note('Brak overflow tablet', '');

    // At 768 - check if desktop nav or mobile menu is shown
    const menuBtn = await page.$('button[aria-label*="menu"], button[aria-label*="Menu"]');
    const menuBtnVisible = menuBtn ? await menuBtn.isVisible() : false;
    note('Mobile menu button na 768px visible', String(menuBtnVisible));

    await page.evaluate(() => {
      const el = document.querySelector('#kempingowe');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(600);
    await ss(page, 'S04-tablet-campers');

    await page.evaluate(() => {
      const el = document.querySelector('#transportowe');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(600);
    await ss(page, 'S04-tablet-transport');

    await ssFull(page, 'S04-tablet-full');
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 5 — Mobile menu open/close
  // ═══════════════════════════════════════
  currentSprint = 'S05-mobile-menu';
  log('\n══ SPRINT 5: Mobile menu open/close ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await goto(page, BASE);
    await page.waitForTimeout(500);

    const menuBtn = await page.$('button[aria-expanded]');
    if (!menuBtn) {
      bug('Brak przycisku menu z aria-expanded', '');
    } else {
      const expandedBefore = await menuBtn.getAttribute('aria-expanded');
      if (expandedBefore !== 'false') bug('aria-expanded nie jest false przy zamkniętym menu', `wartość: ${expandedBefore}`);

      await menuBtn.click();
      await page.waitForTimeout(300);
      await ss(page, 'S05-menu-open');

      const expandedAfter = await menuBtn.getAttribute('aria-expanded');
      if (expandedAfter !== 'true') bug('aria-expanded nie zmienia się na true po otwarciu menu', `wartość: ${expandedAfter}`);

      // Menu items visible
      const menuItems = await page.$$('nav a, [class*="MobileNav"] a, [class*="MobileMenu"] a');
      note('Menu items po otwarciu', `${menuItems.length} linków`);

      // Close via button
      await menuBtn.click();
      await page.waitForTimeout(300);
      await ss(page, 'S05-menu-closed');
      const expandedClosed = await menuBtn.getAttribute('aria-expanded');
      if (expandedClosed !== 'false') bug('Menu nie zamyka się po ponownym kliknięciu', `aria-expanded: ${expandedClosed}`);
      else note('Mobile menu open/close OK', '');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 6 — Nawigacja (anchor scrolling)
  // ═══════════════════════════════════════
  currentSprint = 'S06-nav-scrolling';
  log('\n══ SPRINT 6: Anchor scroll navigation ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    for (const anchor of ['#kempingowe', '#transportowe', '#kontakt']) {
      await page.click(`a[href="${anchor}"]`).catch(() => {});
      await page.waitForTimeout(700);
      const scrollY = await page.evaluate(() => window.scrollY);
      const sectionEl = await page.$(anchor);
      if (!sectionEl) { bug(`Sekcja ${anchor} nie istnieje`, ''); continue; }
      const sectionTop = await page.evaluate(el => el.getBoundingClientRect().top, sectionEl);
      // After scroll, section should be near top (within header height ~110px)
      if (Math.abs(sectionTop) > 150) {
        bug(`Scroll do ${anchor} niedokładny`, `section.top = ${Math.round(sectionTop)}px po kliknięciu (powinno być ~0-120)`);
      } else {
        note(`Scroll ${anchor} OK`, `section.top = ${Math.round(sectionTop)}px`);
      }
      await ss(page, `S06-after-click-${anchor.replace('#','')}`);
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 7 — Galeryjka zdjęć (thumbnails)
  // ═══════════════════════════════════════
  currentSprint = 'S07-image-gallery';
  log('\n══ SPRINT 7: Image gallery — thumbnail clicking ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    await page.evaluate(() => {
      const el = document.querySelector('#kempingowe');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(800);
    await ss(page, 'S07-gallery-before');

    // Find thumbnail buttons
    const thumbBtns = await page.$$('button[aria-label*="zdjęcie"], button[aria-label*="Pokaż"]');
    note('Thumbnail buttons found', `${thumbBtns.length}`);

    if (thumbBtns.length === 0) {
      bug('Nie znaleziono przycisków thumbnailów', 'Możliwe że obrazki nie wczytały się');
    } else {
      // Click second thumb
      const mainImgBefore = await page.$eval('article img[loading="lazy"]', el => el.src).catch(() => null);
      if (thumbBtns.length > 1) {
        await thumbBtns[1].click();
        await page.waitForTimeout(300);
        const mainImgAfter = await page.$eval('article img[loading="lazy"]', el => el.src).catch(() => null);
        if (mainImgBefore === mainImgAfter) {
          bug('Kliknięcie thumbnailem nie zmienia głównego zdjęcia', `przed: ${mainImgBefore}, po: ${mainImgAfter}`);
        } else {
          note('Gallery switch OK', `${mainImgBefore} → ${mainImgAfter}`);
        }
        await ss(page, 'S07-gallery-after-click');
      }
    }

    // Check for broken images after scroll (images in viewport)
    const brokenAfterScroll = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => img.complete && img.naturalWidth === 0 && img.src)
        .map(img => img.src);
    });
    if (brokenAfterScroll.length > 0) {
      bug('Broken images po scrollu do sekcji', brokenAfterScroll.join(', '));
    } else {
      note('Wszystkie obrazki po scrollu OK', '');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 8 — Formularz kontaktowy (walidacja)
  // ═══════════════════════════════════════
  currentSprint = 'S08-form-validation';
  log('\n══ SPRINT 8: Formularz — walidacja pól ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);
    await page.evaluate(() => {
      const el = document.querySelector('#kontakt');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    await ss(page, 'S08-form-initial');

    // Check all required fields present
    const nameInput = await page.$('input[name="name"], input[id="contact-name"]');
    const phoneInput = await page.$('input[name="phone"], input[id="contact-phone"]');
    const msgArea = await page.$('textarea[name="message"], textarea[id="contact-message"]');
    const consentCb = await page.$('input[type="checkbox"][id="contact-consent"]');
    const submitBtn = await page.$('button[type="submit"]');

    if (!nameInput) bug('Brak pola "Imię" w formularzu', '');
    if (!phoneInput) bug('Brak pola "Telefon" w formularzu', '');
    if (!msgArea) bug('Brak pola "Wiadomość" w formularzu', '');
    if (!consentCb) bug('Brak checkboxa zgody RODO', '');
    if (!submitBtn) bug('Brak przycisku Submit', '');
    else note('Wszystkie pola formularza obecne', '');

    // Submit empty — HTML5 validation should fire
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(300);
      await ss(page, 'S08-form-submit-empty');
      // Check if name field has validation message
      const validationMsg = await page.$eval('input[id="contact-name"]', el => el.validationMessage).catch(() => '');
      if (!validationMsg) bug('Brak walidacji HTML5 na pustym formularzu', 'validationMessage puste');
      else note('HTML5 validation OK', validationMsg);
    }

    // Fill form with short invalid data (phone too short)
    if (nameInput && phoneInput && msgArea && consentCb) {
      await nameInput.fill('A'); // too short
      await phoneInput.fill('123');
      await msgArea.fill('test');
      await consentCb.check();
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        await ss(page, 'S08-form-invalid-data');
      }

      // Fill valid data
      await nameInput.fill('Jan Kowalski');
      await phoneInput.fill('+48 692 376 595');
      await msgArea.fill('Pytanie o dostępność Tabberta na weekend.');
      await ss(page, 'S08-form-filled');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 9 — Polityka prywatności
  // ═══════════════════════════════════════
  currentSprint = 'S09-privacy-policy';
  log('\n══ SPRINT 9: Polityka prywatności ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, `${BASE}#polityka-prywatnosci`);
    await page.waitForTimeout(600);
    await ss(page, 'S09-privacy-policy');

    const ppTitle = await page.$('h1');
    if (!ppTitle) bug('Brak H1 na stronie polityki prywatności', '');
    else {
      const text = await ppTitle.textContent();
      note('PP h1', text.trim());
    }

    // Check for old domain refs
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('motowycena.pl')) {
      const matches = bodyText.match(/motowycena\.pl[^\s]*/g) || [];
      bug('Polityka Prywatności nadal zawiera motowycena.pl', matches.join(', '));
    } else note('PP nie zawiera motowycena.pl', '');

    if (bodyText.includes('Google Analytics')) {
      bug('PP nadal wymienia Google Analytics', 'Wzmianka powinna być usunięta');
    } else note('PP nie zawiera GA', '');

    if (!bodyText.includes('eprzyczepy.eu')) {
      bug('PP nie zawiera eprzyczepy.eu', '');
    } else note('PP zawiera eprzyczepy.eu', '');

    // Back button
    const backBtn = await page.$('button');
    if (!backBtn) bug('Brak przycisku Wróć na PP', '');

    await ssFull(page, 'S09-privacy-full');
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 10 — Cookie consent behavior
  // ═══════════════════════════════════════
  currentSprint = 'S10-cookie-consent';
  log('\n══ SPRINT 10: Cookie consent ══');
  {
    // Test fresh (no localStorage)
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);
    await page.waitForTimeout(700);

    const banner = await page.$('[role="dialog"]');
    if (!banner) { bug('Cookie banner nie pojawia się', ''); }
    else {
      await ss(page, 'S10-cookie-banner');

      // Accept
      const acceptBtn = await page.$('button:has-text("Akceptuj")');
      if (!acceptBtn) bug('Brak przycisku Akceptuj w cookie banner', '');
      else {
        await acceptBtn.click();
        await page.waitForTimeout(400);
        const bannerAfter = await page.$('[role="dialog"]');
        if (bannerAfter) bug('Cookie banner nie znika po kliknięciu Akceptuj', '');
        else note('Cookie banner znika po accept', '');

        // Reload - should not appear again
        await goto(page, BASE);
        await page.waitForTimeout(700);
        const bannerReload = await page.$('[role="dialog"]');
        if (bannerReload) bug('Cookie banner pojawia się ponownie po odświeżeniu mimo akceptacji', '');
        else note('Cookie consent persist OK', '');
      }
    }
    await ctx.close();

    // Test reject
    const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page2 = await ctx2.newPage();
    await goto(page2, BASE);
    await page2.waitForTimeout(700);
    const banner2 = await page2.$('[role="dialog"]');
    if (banner2) {
      const rejectBtn = await page2.$('button:has-text("Odrzuć")');
      if (!rejectBtn) bug('Brak przycisku Odrzuć w cookie banner (mobile)', '');
      else {
        await rejectBtn.click();
        await page2.waitForTimeout(400);
        const gone = await page2.$('[role="dialog"]');
        if (gone) bug('Cookie banner nie znika po Odrzuć', '');
        else note('Cookie reject OK na mobile', '');
      }
    }
    await ctx2.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 11 — Keyboard navigation
  // ═══════════════════════════════════════
  currentSprint = 'S11-keyboard-nav';
  log('\n══ SPRINT 11: Keyboard navigation & focus ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    const focused1 = await page.evaluate(() => document.activeElement?.tagName + ' ' + (document.activeElement?.getAttribute('href') || document.activeElement?.getAttribute('aria-label') || ''));
    note('Pierwszy Tab focus', focused1);

    // Check logo is keyboard accessible
    const logo = await page.$('[role="button"][aria-label*="Przejdź"]');
    if (!logo) bug('Logo nie ma role=button ani aria-label', '');
    else {
      const tabIdx = await logo.getAttribute('tabindex');
      if (tabIdx === null) bug('Logo/button nie ma tabindex', '');
      else note('Logo tabindex OK', tabIdx);
    }

    // Check submit button accessible
    const submit = await page.$('button[type="submit"]');
    if (submit) {
      const disabled = await submit.getAttribute('disabled');
      note('Submit button disabled attr', String(disabled));
    }

    // Check form labels match inputs
    const labels = await page.$$eval('form label', els => els.map(e => ({ for: e.getAttribute('for'), text: e.textContent.trim() })));
    for (const label of labels) {
      if (!label.for) {
        bug('Label bez atrybutu for', `"${label.text}"`);
      } else {
        const input = await page.$(`#${label.for}`);
        if (!input) bug(`Label for="${label.for}" nie ma pasującego inputa`, '');
      }
    }
    note('Sprawdzono labels', `${labels.length} labelów`);

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 12 — Images all viewports
  // ═══════════════════════════════════════
  currentSprint = 'S12-images';
  log('\n══ SPRINT 12: Images — wszystkie viewporty po scrollu ══');
  for (const vp of [{ w:375, h:812, name:'mobile' }, { w:768, h:1024, name:'tablet' }, { w:1280, h:800, name:'desktop' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    // Scroll to bottom slowly to trigger lazy load
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let pos = 0;
        const step = () => {
          pos += 300;
          window.scrollTo(0, pos);
          if (pos < document.body.scrollHeight) requestAnimationFrame(step);
          else resolve(undefined);
        };
        requestAnimationFrame(step);
      });
    });
    await page.waitForTimeout(1000);

    const broken = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
        .map(img => ({ src: img.src, alt: img.alt }))
    );
    if (broken.length > 0) {
      bug(`Broken images na ${vp.name} po pełnym scrollu`, JSON.stringify(broken));
    } else {
      note(`Wszystkie obrazki OK na ${vp.name}`, '');
    }

    await ssFull(page, `S12-full-${vp.name}`);
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 13 — Trailer cards layout
  // ═══════════════════════════════════════
  currentSprint = 'S13-trailer-cards';
  log('\n══ SPRINT 13: Trailer cards layout & content ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    await page.evaluate(() => {
      document.querySelector('#kempingowe')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(800);
    await ss(page, 'S13-campers');

    const cards = await page.$$('article');
    note('Liczba kart przyczep', `${cards.length}`);

    // Check each card has title, price, CTA
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const h3 = await card.$('h3');
      if (!h3) bug(`Karta ${i+1}: brak h3 (tytuł)`, '');

      const price = await card.$eval('[class*="Price"], [class*="price"]', el => el.textContent).catch(() => null);
      if (!price) bug(`Karta ${i+1}: brak ceny`, '');

      const cta = await card.$('a[href*="tel"]');
      if (!cta) bug(`Karta ${i+1}: brak przycisku CTA (tel)`, '');
      else {
        const href = await cta.getAttribute('href');
        if (!href.includes('692376595') && !href.includes('692 376 595')) {
          bug(`Karta ${i+1}: numer telefonu w CTA niepoprawny`, `href="${href}"`);
        } else note(`Karta ${i+1} tel OK`, href);
      }
    }

    // Check "Zadzwoń" text in CTA
    const ctaTexts = await page.$$eval('a[href*="tel"]', els => els.map(e => e.textContent.trim()));
    note('CTA texts', ctaTexts.join(', '));

    await page.evaluate(() => {
      document.querySelector('#transportowe')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(800);
    await ss(page, 'S13-transport');

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 14 — Contact info correctness
  // ═══════════════════════════════════════
  currentSprint = 'S14-contact-data';
  log('\n══ SPRINT 14: Dane kontaktowe na stronie ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);
    await page.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(500);
    await ss(page, 'S14-contact');

    const pageText = await page.evaluate(() => document.body.innerText);

    // Phone number
    if (!pageText.includes('692 376 595') && !pageText.includes('692376595')) {
      bug('Numer telefonu +48 692 376 595 nie widoczny na stronie', '');
    } else note('Telefon 692 376 595 widoczny', '');

    // Email
    if (!pageText.includes('biuro@eprzyczepy.eu')) {
      bug('Email biuro@eprzyczepy.eu nie widoczny na stronie', '');
    } else note('Email biuro@eprzyczepy.eu widoczny', '');

    // Address
    if (!pageText.includes('Spacerowa') || !pageText.includes('63-430')) {
      bug('Adres (Spacerowa / 63-430) nie widoczny', '');
    } else note('Adres widoczny', '');

    // Check tel href
    const telLinks = await page.$$eval('a[href^="tel:"]', els => els.map(e => e.href));
    note('Tel links', telLinks.join(', '));
    for (const link of telLinks) {
      if (!link.includes('692376595')) {
        bug('Link tel: zawiera zły numer', link);
      }
    }

    // Check mailto href
    const mailLinks = await page.$$eval('a[href^="mailto:"]', els => els.map(e => e.href));
    note('Mailto links', mailLinks.join(', '));
    for (const link of mailLinks) {
      if (!link.includes('biuro@eprzyczepy.eu')) {
        bug('Link mailto: zawiera zły email', link);
      }
    }

    // Check old phone NOT on page
    if (pageText.includes('509 146 666') || pageText.includes('509146666')) {
      bug('Stary numer 509 146 666 nadal widoczny na stronie', '');
    } else note('Stary telefon nie widoczny', '');

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 15 — Animacje & UX hover
  // ═══════════════════════════════════════
  currentSprint = 'S15-animations-hover';
  log('\n══ SPRINT 15: Hover states & animacje ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    // Hover nav links
    const navLinks = await page.$$('nav a');
    for (const link of navLinks) {
      await link.hover();
      await page.waitForTimeout(100);
    }
    await ss(page, 'S15-nav-hover');

    // Hover CTA buttons in hero
    const heroBtns = await page.$$('section a[href="#kempingowe"], section a[href="#kontakt"]');
    for (const btn of heroBtns.slice(0,2)) {
      await btn.hover().catch(() => {});
      await page.waitForTimeout(100);
    }
    await ss(page, 'S15-hero-btn-hover');

    // Scroll to contact, hover phone link
    await page.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(500);
    const phoneLink = await page.$('a[href*="tel"]');
    if (phoneLink) {
      await phoneLink.hover();
      await page.waitForTimeout(200);
      await ss(page, 'S15-phone-hover');
    }

    // Check submit button hover
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.hover();
      await page.waitForTimeout(200);
      await ss(page, 'S15-submit-hover');
    }

    note('Hover states sprawdzone manualnie ze screenshotów', '');
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 16 — Privacy policy navigate back
  // ═══════════════════════════════════════
  currentSprint = 'S16-pp-back-nav';
  log('\n══ SPRINT 16: Polityka prywatności — nawigacja ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    // Click privacy link in cookie banner or footer
    const ppLink = await page.$('a[href="#polityka-prywatnosci"]');
    if (!ppLink) {
      bug('Brak linku do polityki prywatności na stronie', '');
    } else {
      await ppLink.click();
      await page.waitForTimeout(500);
      await ss(page, 'S16-pp-view');

      // Check back button works
      const backBtn = await page.$('button:has-text("Wróć")');
      if (!backBtn) {
        bug('Brak przycisku Wróć na polityce prywatności', '');
      } else {
        await backBtn.click();
        await page.waitForTimeout(500);
        await ss(page, 'S16-back-to-main');
        const h1 = await page.$('h1');
        const h1text = h1 ? await h1.textContent() : '';
        if (h1text.includes('Polityka')) {
          bug('Po kliknięciu Wróć nadal widoczna Polityka Prywatności', '');
        } else note('Nawigacja PP → main OK', '');
      }
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 17 — Meta tags & SEO
  // ═══════════════════════════════════════
  currentSprint = 'S17-meta-seo';
  log('\n══ SPRINT 17: Meta tags & SEO ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    const getMeta = async (sel) => page.$eval(sel, el => el.content || el.getAttribute('href')).catch(() => null);

    const canonical = await getMeta('link[rel="canonical"]');
    if (!canonical?.includes('eprzyczepy.eu')) bug('Canonical nie zawiera eprzyczepy.eu', canonical);
    else note('Canonical OK', canonical);

    const ogTitle = await getMeta('meta[property="og:title"]');
    if (!ogTitle?.includes('EPRZYCZEPY')) bug('og:title nie zawiera EPRZYCZEPY', ogTitle);
    else note('og:title OK', ogTitle);

    const ogImage = await getMeta('meta[property="og:image"]');
    if (!ogImage?.includes('eprzyczepy.eu')) bug('og:image URL nie zawiera eprzyczepy.eu', ogImage);
    else note('og:image OK', ogImage);

    const ogImageAlt = await getMeta('meta[property="og:image:alt"]');
    if (!ogImageAlt) bug('Brak meta og:image:alt', '');
    else note('og:image:alt OK', ogImageAlt);

    const desc = await getMeta('meta[name="description"]');
    if (!desc) bug('Brak meta description', '');
    else {
      if (!desc.includes('692 376 595')) bug('Meta description zawiera zły telefon', desc);
      else note('Meta description telefon OK', '');
      if (desc.includes('509 146')) bug('Meta description nadal ma stary telefon 509 146', desc);
      if (desc.length > 160) bug('Meta description za długi', `${desc.length} znaków (max 160)`);
      else note('Meta description długość OK', `${desc.length} znaków`);
    }

    // Preload hero image
    const preload = await page.$('link[rel="preload"][as="image"]');
    if (!preload) bug('Brak preload dla hero image w head', 'Może wpłynąć na LCP');
    else note('Preload hero image OK', '');

    // JSON-LD check
    const jsonLd = await page.$eval('script[type="application/ld+json"]', el => el.textContent).catch(() => '');
    if (!jsonLd) bug('Brak JSON-LD structured data', '');
    else {
      const ld = JSON.parse(jsonLd);
      if (ld.telephone !== '+48692376595') bug('JSON-LD telephone zły', ld.telephone);
      else note('JSON-LD telephone OK', ld.telephone);
      if (!ld.email?.includes('eprzyczepy')) bug('JSON-LD email zły', ld.email);
      else note('JSON-LD email OK', ld.email);
      if (ld.url?.includes('motowycena')) bug('JSON-LD url zawiera motowycena.pl', ld.url);
      else note('JSON-LD url OK', ld.url);
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 18 — Wide screen 1920px
  // ═══════════════════════════════════════
  currentSprint = 'S18-widescreen-1920';
  log('\n══ SPRINT 18: Widescreen 1920×1080 ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();
    await goto(page, BASE);
    await ss(page, 'S18-wide-hero');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) bug('Horizontal overflow na 1920px', `${overflow}px`);
    else note('Brak overflow 1920px', '');

    // Content too wide?
    const mainWidth = await page.$eval('main, [class*="Container"], header > *', el => el.getBoundingClientRect().width).catch(() => 0);
    note('Main container width na 1920', `${mainWidth}px`);
    if (mainWidth > 1400) bug('Kontener treści za szeroki na 1920px', `${mainWidth}px — brak max-width`);

    await page.evaluate(() => document.querySelector('#kempingowe')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(600);
    await ss(page, 'S18-wide-campers');

    await ssFull(page, 'S18-wide-full');
    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 19 — Drobne bugi UX / copy
  // ═══════════════════════════════════════
  currentSprint = 'S19-ux-copy';
  log('\n══ SPRINT 19: UX / copy / drobne detale ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await goto(page, BASE);

    const pageText = await page.evaluate(() => document.body.innerText);

    // Check "Ul." vs "ul."
    if (pageText.includes('Ul. Spacerowa')) {
      bug('"Ul. Spacerowa" — wielka litera U w skrócie ulicy (powinno być ul.)', 'Niestandardowy zapis');
    } else note('"ul." — małe u OK', '');

    // Check priceShort for laweta
    if (!pageText.includes('80 zł')) {
      bug('Cena lawety 80 zł nie widoczna na stronie', '');
    } else note('Cena lawety 80 zł OK', '');

    // Check hero kicker text
    if (pageText.includes('Tabbert, Lunar, Dethleffs')) {
      note('Hero opis z markami OK', '');
    } else {
      bug('Hero opis nie zawiera "Tabbert, Lunar, Dethleffs"', '');
    }

    // Check "Zadzwoń" buttons
    const callBtns = await page.$$eval('a[href*="tel"]', els => els.length);
    note('Przyciski "Zadzwoń"', `${callBtns} sztuk`);

    // Check EPRZYCZEPY.EU in footer copyright
    if (pageText.includes('2026 EPRZYCZEPY.EU')) {
      note('Copyright 2026 EPRZYCZEPY.EU OK', '');
    } else {
      bug('Copyright w stopce nie zawiera "2026 EPRZYCZEPY.EU"', '');
    }

    // Scroll down slowly and check for any visual glitches
    await page.evaluate(() => document.querySelector('#transportowe')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(700);
    await ss(page, 'S19-transport-section');

    // Check transport trailer names visible
    if (pageText.includes('Laweta') || pageText.includes('laweta')) {
      note('Laweta sekcja widoczna', '');
    } else bug('Słowo "Laweta" nie widoczne na stronie', '');

    if (pageText.includes('Motocykl') || pageText.includes('motocykl')) {
      note('Przyczepa motocyklowa widoczna', '');
    } else bug('Przyczepa motocyklowa nie widoczna na stronie', '');

    await ctx.close();
  }

  // ═══════════════════════════════════════
  // SPRINT 20 — Performance & final check
  // ═══════════════════════════════════════
  currentSprint = 'S20-performance-final';
  log('\n══ SPRINT 20: Performance hints & final check ══');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    // Collect resource timing
    await goto(page, BASE);
    const resourceData = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries
        .filter(e => e.initiatorType === 'img')
        .map(e => ({ name: e.name.split('/').pop(), duration: Math.round(e.duration) }))
        .sort((a,b) => b.duration - a.duration)
        .slice(0, 5);
    });
    note('Top 5 najwolniejszych obrazków (ms)', JSON.stringify(resourceData));

    // Check image sizes (all imgs on page)
    const imgCount = await page.evaluate(() => document.querySelectorAll('img').length);
    note('Łączna liczba img na stronie', `${imgCount}`);

    // Check if images have width/height attributes (prevents CLS)
    const imgsWithoutDimensions = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => !img.getAttribute('width') && !img.getAttribute('height'))
        .map(img => img.src.split('/').pop() || img.alt)
    );
    if (imgsWithoutDimensions.length > 0) {
      bug('Obrazki bez atrybutów width/height (CLS risk)', imgsWithoutDimensions.join(', '));
    } else note('Wszystkie obrazki mają wymiary', '');

    // Check font loading
    const fontLinks = await page.$$eval('link[rel="stylesheet"][href*="fonts"]', els => els.map(e => e.href));
    note('Font links', fontLinks.join(', '));
    if (fontLinks.length > 0) {
      bug('Google Fonts ładowane przez zewnętrzny link (opóźnienie)', `Rozważ: font-display:swap, preconnect (już jest), lub wbuduj font lokalnie`);
    }

    // Final console errors check
    const finalErrors = [];
    page.on('console', m => { if (m.type()==='error') finalErrors.push(m.text()); });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (finalErrors.length > 0) {
      finalErrors.forEach(e => bug('Console error (final reload)', e));
    } else note('Brak console errors po reload', '');

    await ssFull(page, 'S20-final-desktop');
    await ctx.close();
  }

  await browser.close();

  // ═══════════════════════════════════════
  // ZAPISZ BUGS.MD
  // ═══════════════════════════════════════
  const now = new Date().toLocaleDateString('pl-PL', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  const critical = bugs.filter(b => {
    const t = b.title.toLowerCase();
    return t.includes('broken') || t.includes('pageerror') || t.includes('overflow') || t.includes('zły') || t.includes('nie wyskok') || t.includes('nie');
  });

  let md = `# BUGS — eprzyczepy.eu / motowycena.pl
> Audyt automatyczny · ${now} · 20 sprintów · ${bugs.length} bugów · tylko obserwacja, bez zmian

---

## Podsumowanie

| | |
|---|---|
| **Łączna liczba bugów** | ${bugs.length} |
| **Notatek / OK** | ${notes.length} |
| **Screenshotów** | ${ssIdx} |
| **Data** | ${now} |

---

## Wszystkie bugi (chronologicznie)

`;

  const sprintGroups = {};
  for (const b of bugs) {
    if (!sprintGroups[b.sprint]) sprintGroups[b.sprint] = [];
    sprintGroups[b.sprint].push(b);
  }

  for (const [sprint, items] of Object.entries(sprintGroups)) {
    md += `### ${sprint.replace(/-/g,' ').toUpperCase()}\n\n`;
    for (const item of items) {
      md += `- **${item.title}**\n`;
      if (item.details) md += `  - ${item.details}\n`;
      if (item.screenshot) md += `  - Screenshot: \`${item.screenshot}\`\n`;
    }
    md += '\n';
  }

  md += `---\n\n## Notatki / co działa\n\n`;
  for (const n of notes) {
    md += `- [${n.sprint}] **${n.title}**: ${n.details}\n`;
  }

  md += `\n---\n\n## Screenshoty\n\nZapisane w \`./bug-screenshots/\` (${ssIdx} plików)\n`;

  fs.writeFileSync(BUGS_FILE, md, 'utf-8');
  log(`\n✅ BUGS.md zapisany — ${bugs.length} bugów, ${notes.length} notatek, ${ssIdx} screenshotów`);
}

main().catch(e => { console.error(e); process.exit(1); });

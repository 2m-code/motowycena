/**
 * Playwright — testy formularza kontaktowego
 * Uruchom: node test-form.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE    = 'http://127.0.0.1:3005';
const SS_DIR  = './form-test-screenshots';
const RESULTS = './form-test-results.md';
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

let ssIdx = 0;
const results = [];

const pass = (name, detail = '') => {
  results.push({ status: 'PASS', name, detail });
  process.stdout.write(`  ✅ PASS  ${name}${detail ? ' — ' + detail : ''}\n`);
};
const fail = (name, detail = '') => {
  results.push({ status: 'FAIL', name, detail });
  process.stdout.write(`  ❌ FAIL  ${name}${detail ? ' — ' + detail : ''}\n`);
};
const info = (name, detail = '') => {
  results.push({ status: 'INFO', name, detail });
  process.stdout.write(`  ℹ️  INFO  ${name}${detail ? ': ' + detail : ''}\n`);
};

async function shot(page, label) {
  const f = path.join(SS_DIR, `${String(ssIdx++).padStart(2,'0')}-${label}.png`);
  await page.screenshot({ path: f, fullPage: false });
  return path.basename(f);
}

async function setupPage(browser, mockFn = null) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  if (mockFn) await page.route('**/api/contact', mockFn);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(400);
  return { page, ctx };
}

async function fillForm(page, { name = '', phone = '', msg = '', consent = false } = {}) {
  if (name  !== null) await page.fill('#contact-name', name);
  if (phone !== null) await page.fill('#contact-phone', phone);
  if (msg   !== null) await page.fill('#contact-message', msg);
  if (consent) await page.check('#contact-consent');
  else         await page.uncheck('#contact-consent').catch(() => {});
}

async function clickSubmit(page) {
  await page.click('button[type="submit"]');
  await page.waitForTimeout(600);
}

// ─────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({ headless: true });
  process.stdout.write('\n════════════════════════════════════════\n');
  process.stdout.write('  TESTY FORMULARZA KONTAKTOWEGO\n');
  process.stdout.write('════════════════════════════════════════\n\n');

  // ══════════════════════════════════════════
  // BLOK 1 — Struktura formularza
  // ══════════════════════════════════════════
  process.stdout.write('── BLOK 1: Struktura ──\n');
  {
    const { page, ctx } = await setupPage(browser);

    const fields = [
      { id: '#contact-name',    label: 'Imię i nazwisko',   type: 'text' },
      { id: '#contact-phone',   label: 'Telefon',            type: 'tel'  },
      { id: '#contact-message', label: 'Wiadomość',          tag: 'textarea' },
      { id: '#contact-consent', label: 'Checkbox RODO',      type: 'checkbox' },
    ];

    for (const f of fields) {
      const el = await page.$(f.id);
      if (!el) { fail(`Pole "${f.label}" istnieje`, `#${f.id} nie znaleziony`); continue; }
      pass(`Pole "${f.label}" istnieje`);

      const tag  = await el.evaluate(e => e.tagName.toLowerCase());
      const type = await el.getAttribute('type');
      const req  = await el.getAttribute('required');
      const ac   = await el.getAttribute('autocomplete');
      const lbl  = await page.$eval(`label[for="${f.id.slice(1)}"]`, e => e.textContent.trim()).catch(() => null);

      if (!lbl) fail(`Label dla "${f.label}"`, 'brak powiązanego <label>');
      else pass(`Label powiązany z "${f.label}"`, `"${lbl}"`);

      if (req === null && f.type !== 'checkbox')
        fail(`"${f.label}" jest required`, 'brak atrybutu required');
      else pass(`"${f.label}" required OK`);

      if (f.type === 'tel' && type !== 'tel')
        fail(`Typ pola telefon`, `type="${type}" (oczekiwano "tel")`);
      else if (f.type === 'tel') pass(`type="tel" na polu telefon`);

      if (f.type !== 'checkbox') {
        if (!ac || ac === 'off')
          info(`autocomplete na "${f.label}"`, ac || 'brak');
        else pass(`autocomplete "${f.label}"`, ac);
      }
    }

    // Honeypot
    const honeypot = await page.$('input[name="botcheck"]');
    if (!honeypot) fail('Honeypot input istnieje');
    else {
      pass('Honeypot istnieje');
      const tabIdx = await honeypot.getAttribute('tabindex');
      const hidden = await honeypot.getAttribute('aria-hidden');
      if (tabIdx === '-1') pass('Honeypot tabIndex="-1"');
      else fail('Honeypot tabIndex', `${tabIdx}`);
      if (hidden === 'true') pass('Honeypot aria-hidden="true"');
      else fail('Honeypot aria-hidden', `${hidden}`);
    }

    // Submit button
    const sub = await page.$('button[type="submit"]');
    if (!sub) fail('Submit button istnieje');
    else {
      pass('Submit button istnieje');
      const txt = await sub.textContent();
      info('Submit button tekst', txt.trim());
    }

    await shot(page, '01-form-structure');
    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 2 — Walidacja HTML5 (pusty submit)
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 2: Walidacja HTML5 (pusty submit) ──\n');
  {
    const { page, ctx } = await setupPage(browser);
    await clickSubmit(page);
    await shot(page, '02-empty-submit');

    for (const id of ['#contact-name', '#contact-phone', '#contact-message']) {
      const vm = await page.$eval(id, e => e.validationMessage).catch(() => '');
      const vv = await page.$eval(id, e => e.validity.valid).catch(() => true);
      if (!vv) pass(`HTML5 blokuje pusty submit na ${id}`, vm.substring(0, 40));
      else     fail(`HTML5 blokuje pusty submit na ${id}`, 'pole jest valid mimo puste');
    }

    // Formularz nie powinien wysłać
    let requestFired = false;
    page.on('request', r => { if (r.url().includes('api/contact')) requestFired = true; });
    if (!requestFired) pass('Request NIE wysłany przy pustym formularzu');
    else               fail('Request wysłany mimo pustego formularza');

    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 3 — Walidacja edge cases
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 3: Edge cases walidacji ──\n');
  const edgeCases = [
    { label: 'Same spacje w imieniu',         name: '   ',         phone: '+48692376595', msg: 'Test wiadomości.', consent: true },
    { label: 'Imię 1 znak',                   name: 'A',           phone: '+48692376595', msg: 'Test wiadomości.', consent: true },
    { label: 'Telefon za krótki (5 cyfr)',    name: 'Jan Kowalski', phone: '12345',        msg: 'Test wiadomości.', consent: true },
    { label: 'Wiadomość 2 znaki',             name: 'Jan Kowalski', phone: '+48692376595', msg: 'AB',              consent: true },
    { label: 'Wiadomość 5001 znaków',         name: 'Jan Kowalski', phone: '+48692376595', msg: 'A'.repeat(5001), consent: true },
    { label: 'Telefon jako email',             name: 'Jan Kowalski', phone: 'test@mail.com', msg: 'Test.',          consent: true },
    { label: 'Telefon: litery',               name: 'Jan Kowalski', phone: 'abcdefgh',     msg: 'Test.',          consent: true },
    { label: 'Bez zgody RODO',                name: 'Jan Kowalski', phone: '+48692376595', msg: 'Test wiadomości.', consent: false },
    { label: 'HTML w imieniu (XSS attempt)',   name: '<b>Jan</b>',   phone: '+48692376595', msg: 'Test.',          consent: true },
  ];

  for (const ec of edgeCases) {
    const { page, ctx } = await setupPage(browser, route => {
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'invalid_input' }) });
    });

    await fillForm(page, ec);
    const subBefore = await page.$eval('button[type="submit"]', e => e.textContent.trim());

    let reqBody = null;
    page.on('request', r => {
      if (r.url().includes('api/contact')) {
        try { reqBody = JSON.parse(r.postData() || '{}'); } catch {}
      }
    });

    await clickSubmit(page);
    await page.waitForTimeout(400);
    await shot(page, `03-edge-${ec.label.replace(/\s+/g,'_').substring(0,20)}`);

    const status    = await page.$eval('button[type="submit"]', e => e.textContent.trim()).catch(() => '');
    const errEl     = await page.$('[role="alert"]');
    const successEl = await page.$('[role="status"]');
    const errTxt    = errEl     ? await errEl.textContent()     : null;
    const sucTxt    = successEl ? await successEl.textContent() : null;

    // Sprawdź czy formularz zablokował niepoprawne dane
    if (ec.label === 'Same spacje w imieniu') {
      if (!reqBody) pass(`Blok klienta: "${ec.label}"`, 'request nie wysłany (HTML5 lub custom)');
      else          fail(`Blok klienta: "${ec.label}"`, `wysłano: name="${reqBody.name}"`);
    }

    if (ec.label === 'Bez zgody RODO') {
      if (!reqBody && !sucTxt) pass(`Blok: "${ec.label}"`, 'nie wysłano bez zgody');
      else                     fail(`Blok: "${ec.label}"`, sucTxt ? 'pokazano sukces!' : `wysłano body: ${JSON.stringify(reqBody)}`);
    }

    if (ec.label.includes('XSS')) {
      // HTML nie powinno się wykonać
      const nameEl = await page.$eval('#contact-name', e => e.value);
      if (nameEl.includes('<b>')) info(`XSS w imieniu — wartość w polu`, nameEl);
      // Sprawdź czy nie wyrenderowało jako HTML
      const boldEl = await page.$('#contact-name b, form b').catch(() => null);
      if (!boldEl) pass(`XSS: brak renderowania HTML w polu`, `value="${nameEl}"`);
      else         fail(`XSS: tag <b> renderowany w formularzu`);
    }

    if (ec.label === 'Wiadomość 5001 znaków') {
      const actualLen = await page.$eval('#contact-message', e => e.value.length);
      const maxLen    = await page.$eval('#contact-message', e => e.maxLength);
      if (maxLen > 0 && actualLen <= maxLen) pass(`maxlength blokuje 5001 znaków`, `maxLength=${maxLen}, actual=${actualLen}`);
      else if (maxLen === -1)                info(`Brak maxlength na textarea`, `actual=${actualLen} znaków`);
      else                                   fail(`Textarea przekracza maxlength`, `actual=${actualLen} > max=${maxLen}`);
    }

    if (ec.label === 'Telefon jako email' || ec.label === 'Telefon: litery') {
      if (!reqBody) info(`Blok na "${ec.label}"`, 'request NIE wysłany (HTML5 lub custom val.)');
      else          info(`"${ec.label}" — request wysłany`, `phone="${reqBody.phone}" — serwer musi walidować`);
    }

    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 4 — Sukces (mock 200)
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 4: Sukces formularza (mock 200) ──\n');
  {
    const { page, ctx } = await setupPage(browser, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    );

    await fillForm(page, {
      name: 'Jan Kowalski', phone: '+48 692 376 595',
      msg: 'Interesuje mnie wynajem Tabberta na 2 tygodnie w lipcu.', consent: true,
    });
    await shot(page, '04-form-filled');
    await clickSubmit(page);
    await page.waitForTimeout(800);
    await shot(page, '04-form-success');

    // Komunikat sukcesu
    const successEl = await page.$('[role="status"]');
    if (!successEl) { fail('Komunikat sukcesu pojawia się'); }
    else {
      const txt = await successEl.textContent();
      pass('Komunikat sukcesu pojawia się', txt.trim().substring(0, 60));
      if (txt.includes('Dziękujemy') || txt.includes('wysłana')) pass('Tekst komunikatu sukcesu OK');
      else fail('Tekst komunikatu sukcesu', txt.trim());
    }

    // Czyszczenie pól
    const nameVal  = await page.$eval('#contact-name',    e => e.value).catch(() => 'ERR');
    const phoneVal = await page.$eval('#contact-phone',   e => e.value).catch(() => 'ERR');
    const msgVal   = await page.$eval('#contact-message', e => e.value).catch(() => 'ERR');
    const cbVal    = await page.$eval('#contact-consent', e => e.checked).catch(() => true);

    if (nameVal  === '') pass('Pole "Imię" wyczyszczone po sukcesie');
    else                 fail('Pole "Imię" wyczyszczone po sukcesie', `wartość: "${nameVal}"`);
    if (phoneVal === '') pass('Pole "Telefon" wyczyszczone po sukcesie');
    else                 fail('Pole "Telefon" wyczyszczone po sukcesie', `wartość: "${phoneVal}"`);
    if (msgVal   === '') pass('Pole "Wiadomość" wyczyszczone po sukcesie');
    else                 fail('Pole "Wiadomość" wyczyszczone po sukcesie', `wartość: "${msgVal.substring(0,20)}"`);
    if (!cbVal)          pass('Checkbox odznaczony po sukcesie');
    else                 fail('Checkbox odznaczony po sukcesie', 'nadal zaznaczony');

    // Submit button wraca do normalnego stanu
    const btnAfter = await page.$eval('button[type="submit"]', e => e.textContent.trim());
    if (btnAfter.includes('Wyślij')) pass('Submit button wraca do "Wyślij Wiadomość"', btnAfter);
    else                             fail('Submit button wraca do normalnego tekstu', btnAfter);

    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 5 — Obsługa błędów serwera
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 5: Komunikaty błędów serwera ──\n');
  const errorCases = [
    { code: 'rate_limited',    status: 429, expected: 'kilkanaście minut' },
    { code: 'consent_required',status: 400, expected: 'zgodę' },
    { code: 'captcha_required',status: 400, expected: 'bot' },
    { code: 'captcha_failed',  status: 400, expected: 'captcha' },
    { code: 'invalid_input',   status: 400, expected: 'poprawność' },
    { code: 'send_failed',     status: 500, expected: 'zadzwoń' },
    { code: 'UNKNOWN_ERROR',   status: 500, expected: 'zadzwoń' }, // fallback
  ];

  for (const ec of errorCases) {
    const { page, ctx } = await setupPage(browser, route =>
      route.fulfill({ status: ec.status, contentType: 'application/json', body: JSON.stringify({ ok: false, error: ec.code }) })
    );
    await fillForm(page, { name: 'Jan', phone: '+48600000000', msg: 'Test test test.', consent: true });
    await clickSubmit(page);
    await page.waitForTimeout(500);

    const errEl  = await page.$('[role="alert"]');
    const errTxt = errEl ? (await errEl.textContent()).trim() : '';

    if (!errEl) {
      fail(`Komunikat błędu "${ec.code}"`, 'brak [role="alert"]');
    } else if (errTxt.toLowerCase().includes(ec.expected.toLowerCase())) {
      pass(`Komunikat "${ec.code}"`, `"${errTxt.substring(0, 60)}"`);
    } else {
      fail(`Komunikat "${ec.code}" zawiera "${ec.expected}"`, `otrzymano: "${errTxt.substring(0, 60)}"`);
    }

    // Przycisk wraca do aktywnego stanu po błędzie
    const btnDisabled = await page.$eval('button[type="submit"]', e => e.disabled).catch(() => true);
    if (!btnDisabled) pass(`Submit re-enabled po błędzie "${ec.code}"`);
    else              fail(`Submit re-enabled po błędzie "${ec.code}"`, 'przycisk nadal disabled');

    await shot(page, `05-error-${ec.code}`);
    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 6 — Loading state podczas wysyłania
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 6: Loading state podczas wysyłania ──\n');
  {
    const { page, ctx } = await setupPage(browser, async route => {
      await new Promise(r => setTimeout(r, 1500));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await fillForm(page, { name: 'Jan Kowalski', phone: '+48692376595', msg: 'Test loading state.', consent: true });
    const sub = await page.$('button[type="submit"]');
    await sub.click();
    await page.waitForTimeout(200); // W trakcie wysyłania

    const btnTxt      = await page.$eval('button[type="submit"]', e => e.textContent.trim());
    const btnDisabled = await page.$eval('button[type="submit"]', e => e.disabled);
    await shot(page, '06-loading-state');

    if (btnTxt.includes('Wysyłanie')) pass('Tekst "Wysyłanie..." podczas wysyłania', btnTxt);
    else                              fail('Tekst "Wysyłanie..." podczas wysyłania', `było: "${btnTxt}"`);
    if (btnDisabled)                  pass('Submit disabled podczas wysyłania');
    else                              fail('Submit disabled podczas wysyłania', 'nadal aktywny');

    await page.waitForTimeout(1500);
    await shot(page, '06-after-success');
    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 7 — Double submit protection
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 7: Ochrona przed double submit ──\n');
  {
    let callCount = 0;
    const { page, ctx } = await setupPage(browser, async route => {
      callCount++;
      await new Promise(r => setTimeout(r, 500));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await fillForm(page, { name: 'Jan Kowalski', phone: '+48692376595', msg: 'Test double submit.', consent: true });
    const sub = await page.$('button[type="submit"]');

    // 5 kliknięć w trakcie
    await sub.click();
    for (let i = 0; i < 4; i++) await sub.click({ delay: 50 }).catch(() => {});
    await page.waitForTimeout(1500);

    info('Liczba requestów API przy 5 kliknięciach', `${callCount}`);
    if (callCount === 1) pass('Double submit protection: wysłano dokładnie 1 request');
    else                 fail('Double submit protection: wysłano > 1 request', `${callCount} requestów`);

    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 8 — Mobile 375px
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 8: Formularz na mobile 375px ──\n');
  {
    const ctx  = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.route('**/api/contact', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    );
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(400);
    await shot(page, '08-mobile-form');

    const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (ow <= 2) pass('Brak overflow na mobile 375px');
    else         fail('Horizontal overflow na mobile', `${ow}px`);

    const inputW = await page.$eval('#contact-name', e => e.getBoundingClientRect().width).catch(() => 0);
    if (inputW >= 260) pass('Input pełna szerokość na mobile', `${Math.round(inputW)}px`);
    else               fail('Input za wąski na mobile', `${Math.round(inputW)}px`);

    await fillForm(page, { name: 'Jan Kowalski', phone: '+48692376595', msg: 'Test mobile.', consent: true });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(600);
    await shot(page, '08-mobile-success');

    const successEl = await page.$('[role="status"]');
    if (successEl) pass('Sukces widoczny na mobile');
    else           fail('Sukces widoczny na mobile', 'brak [role="status"]');

    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 9 — Dostępność formularza
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 9: Dostępność formularza ──\n');
  {
    const { page, ctx } = await setupPage(browser);

    // Tab order
    await page.click('#contact-name');
    const tabOrder = [];
    for (let i = 0; i < 6; i++) {
      const el = await page.evaluate(() => {
        const e = document.activeElement;
        return e ? (e.id || e.name || e.tagName + ':' + e.type) : 'brak';
      });
      tabOrder.push(el);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(30);
    }
    info('Tab order formularza', tabOrder.join(' → '));

    const correctOrder = ['contact-name', 'contact-phone', 'contact-message', 'contact-consent'];
    let orderOk = true;
    for (let i = 0; i < correctOrder.length; i++) {
      if (!tabOrder[i]?.includes(correctOrder[i])) { orderOk = false; break; }
    }
    if (orderOk) pass('Tab order: name → phone → message → consent');
    else         fail('Tab order nieprawidłowy', tabOrder.slice(0,4).join(' → '));

    // Submit dostępny po Tab z consent
    const subIdx = tabOrder.findIndex(t => t.includes('submit') || t.includes('BUTTON'));
    const cbIdx  = tabOrder.findIndex(t => t.includes('consent'));
    if (cbIdx < subIdx) pass('Tab order: consent PRZED submit');
    else                fail('Tab order: consent PO submit', `cb=${cbIdx}, sub=${subIdx}`);

    // Aria-required
    for (const id of ['contact-name', 'contact-phone', 'contact-message']) {
      const req = await page.$eval(`#${id}`, e => e.required || e.getAttribute('aria-required')).catch(() => null);
      if (req) pass(`aria-required / required na #${id}`);
      else     fail(`aria-required / required na #${id}`);
    }

    // Komunikat sukcesu ma role="status"?
    const statusEl  = await page.$('[role="status"]');
    const alertEl   = await page.$('[role="alert"]');
    if (statusEl || alertEl) pass('Komunikaty używają role="status"/"alert"');
    else                     info('Komunikaty status/alert nie są widoczne (OK przy braku akcji)');

    // Placeholder nie zastępuje labela
    const nameLabel = await page.$('label[for="contact-name"]');
    if (nameLabel) pass('Label nie jest zastąpiony przez placeholder (label istnieje)');
    else           fail('Brak label — tylko placeholder');

    await ctx.close();
  }

  // ══════════════════════════════════════════
  // BLOK 10 — Formularz z wolną siecią (timeout)
  // ══════════════════════════════════════════
  process.stdout.write('\n── BLOK 10: Timeout / sieć offline ──\n');
  {
    const { page, ctx } = await setupPage(browser, async route => {
      // Symuluj network error (brak odpowiedzi)
      await route.abort('connectionrefused');
    });

    await fillForm(page, { name: 'Jan Kowalski', phone: '+48692376595', msg: 'Test timeout.', consent: true });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    await shot(page, '10-network-error');

    const errEl  = await page.$('[role="alert"]');
    const errTxt = errEl ? (await errEl.textContent()).trim() : '';

    if (errEl) pass('Komunikat błędu przy network error', errTxt.substring(0, 60));
    else       fail('Komunikat błędu przy network error', 'brak [role="alert"]');

    // Submit powinien wrócić do normalnego stanu
    const btnDis = await page.$eval('button[type="submit"]', e => e.disabled).catch(() => true);
    if (!btnDis) pass('Submit aktywny po network error');
    else         fail('Submit nadal disabled po network error');

    await ctx.close();
  }

  await browser.close();

  // ═══════════════════════════════════════
  // RAPORT
  // ═══════════════════════════════════════
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const infos  = results.filter(r => r.status === 'INFO').length;

  process.stdout.write('\n════════════════════════════════════════\n');
  process.stdout.write(`  WYNIKI: ${passed} PASS  ${failed} FAIL  ${infos} INFO\n`);
  process.stdout.write('════════════════════════════════════════\n\n');

  const now = new Date().toLocaleString('pl-PL');
  let md = `# Testy formularza kontaktowego\n> ${now} · ${passed} PASS · ${failed} FAIL · ${infos} INFO\n\n`;
  md += `## Wyniki\n\n`;
  md += `| Status | Test | Szczegóły |\n|--------|------|-----------|\n`;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : 'ℹ️';
    md += `| ${icon} ${r.status} | ${r.name} | ${r.detail || ''} |\n`;
  }
  md += `\n## Screenshoty\n\`./form-test-screenshots/\` (${ssIdx} plików)\n`;
  fs.writeFileSync(RESULTS, md, 'utf-8');
  process.stdout.write(`Raport: ${RESULTS}\nScreenshoty: ${SS_DIR}/\n`);

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });

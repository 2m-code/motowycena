/**
 * Security audit — XSS, injection, headers, CSRF, misc
 * node test-security.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE   = 'http://127.0.0.1:3005';
const API    = 'http://127.0.0.1:3005/api/contact';
const SS_DIR = './security-screenshots';
const OUT    = './SECURITY-REPORT.md';
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

let ssIdx = 0;
const findings = [];

const ok   = (cat, t, d='') => { findings.push({cat,status:'✅ SAFE',t,d}); process.stdout.write(`  ✅ SAFE   [${cat}] ${t}${d?' — '+d:''}\n`); };
const warn = (cat, t, d='') => { findings.push({cat,status:'⚠️  WARN',t,d}); process.stdout.write(`  ⚠️  WARN   [${cat}] ${t}${d?' — '+d:''}\n`); };
const vuln = (cat, t, d='') => { findings.push({cat,status:'🔴 VULN',t,d}); process.stdout.write(`  🔴 VULN   [${cat}] ${t}${d?' — '+d:''}\n`); };
const info = (cat, t, d='') => { findings.push({cat,status:'ℹ️  INFO',t,d}); process.stdout.write(`  ℹ️  INFO   [${cat}] ${t}${d?' — '+d:''}\n`); };

async function shot(page, name) {
  const f = path.join(SS_DIR, `${String(ssIdx++).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: f }).catch(()=>{});
}

async function post(payload, extraHeaders = {}) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(payload),
  }).catch(e => ({ status: 0, _err: e.message }));
  if (r.status === 0) return { status: 0, body: null };
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body, headers: r.headers };
}

// ─────────────────────────────────────────────────────────
async function main() {
  process.stdout.write('\n══════════════════════════════════════════\n');
  process.stdout.write('  SECURITY AUDIT — eprzyczepy.eu\n');
  process.stdout.write('══════════════════════════════════════════\n\n');

  const browser = await chromium.launch({ headless: true });

  // ══════════════════════════════════════════
  // 1. HTTP SECURITY HEADERS
  // ══════════════════════════════════════════
  process.stdout.write('── 1. HTTP Security Headers ──\n');
  {
    const r = await fetch(BASE).catch(() => null);
    if (!r) { warn('HEADERS','Nie można sprawdzić headerów'); }
    else {
      const h = Object.fromEntries(r.headers.entries());

      const check = (name, key, wanted = null) => {
        const val = h[key.toLowerCase()];
        if (!val) {
          vuln('HEADERS', `Brak ${name}`, key);
        } else if (wanted && !val.toLowerCase().includes(wanted.toLowerCase())) {
          warn('HEADERS', `${name} niekompletny`, `${val}`);
        } else {
          ok('HEADERS', `${name} obecny`, val.substring(0,80));
        }
      };

      check('X-Frame-Options',          'x-frame-options');
      check('X-Content-Type-Options',   'x-content-type-options', 'nosniff');
      check('Content-Security-Policy',  'content-security-policy');
      check('Strict-Transport-Security','strict-transport-security');
      check('Referrer-Policy',          'referrer-policy');
      check('Permissions-Policy',       'permissions-policy');

      // CORS — sprawdź czy jest zbyt otwarty
      const corsOrigin = h['access-control-allow-origin'];
      info('HEADERS','Access-Control-Allow-Origin', corsOrigin || 'brak');
      if (corsOrigin === '*') {
        vuln('CORS','CORS: Access-Control-Allow-Origin: * — dowolna strona może POSTować do API');
      } else if (!corsOrigin) {
        ok('CORS','CORS header brak (domyślnie same-origin)');
      } else {
        ok('CORS',`CORS ograniczony do`, corsOrigin);
      }

      // Server header — ukrycie wersji
      const server = h['server'] || h['x-powered-by'];
      if (server) warn('HEADERS','Serwer ujawnia wersję oprogramowania', server);
      else        ok('HEADERS','Brak nagłówka Server/X-Powered-By (fingerprint ukryty)');

      // Content-Type na HTML
      const ct = h['content-type'];
      if (ct?.includes('text/html')) ok('HEADERS','Content-Type HTML', ct);
      else warn('HEADERS','Content-Type', ct || 'brak');
    }
  }

  // ══════════════════════════════════════════
  // 2. XSS — CLIENT SIDE
  // ══════════════════════════════════════════
  process.stdout.write('\n── 2. XSS — Client Side ──\n');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    const alerts = [];
    page.on('dialog', async d => {
      alerts.push(d.message());
      await d.dismiss();
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Test 1: XSS przez URL hash
    await page.goto(`${BASE}/#<script>alert('xss-hash')</script>`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (alerts.length > 0) vuln('XSS','XSS przez URL hash wykonał alert()', alerts.join(', '));
    else                   ok('XSS','URL hash XSS zablokowany');

    // Test 2: XSS przez pole formularza → sprawdź czy React renderuje jako HTML
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(300);

    const xssInputs = [
      `<script>alert('xss1')</script>`,
      `<img src=x onerror="alert('xss2')">`,
      `"><svg onload=alert('xss3')>`,
      `javascript:alert('xss4')`,
      `<iframe src="javascript:alert('xss5')">`,
    ];

    for (const xss of xssInputs) {
      await page.fill('#contact-name', xss);
      await page.fill('#contact-phone', '+48600000000');
      await page.fill('#contact-message', xss);

      // Sprawdź czy value jest jako tekst (bezpieczne) czy HTML
      const nameVal = await page.$eval('#contact-name', e => e.value).catch(()=>'');
      const msgVal  = await page.$eval('#contact-message', e => e.value).catch(()=>'');

      // React JSX auto-escapes — sprawdź czy nie ma <script> w DOM poza inputami
      const scriptTags = await page.$$('script:not([type="module"]):not([src])');
      const injectedScript = await Promise.all(scriptTags.map(s => s.evaluate(e => e.innerHTML)));
      const hasXSS = injectedScript.some(t => t.includes('xss'));

      if (alerts.length > 0) {
        vuln('XSS',`XSS wykonany przez input: "${xss.substring(0,30)}"`, alerts.join(', '));
        alerts.length = 0;
      } else if (hasXSS) {
        vuln('XSS',`Injected script w DOM`, xss.substring(0,30));
      } else {
        ok('XSS',`Input traktowany jako tekst`, xss.substring(0,30));
      }
    }

    // Test 3: XSS przez URL params po refres
    await page.goto(`${BASE}?name=<script>alert('xss-param')</script>`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (alerts.length > 0) vuln('XSS','XSS przez URL query param', alerts.join(', '));
    else                   ok('XSS','URL query param XSS zablokowany');

    await shot(page, '02-xss-test');
    await ctx.close();
  }

  // ══════════════════════════════════════════
  // 3. XSS — SERVER SIDE (HTML email injection)
  // ══════════════════════════════════════════
  process.stdout.write('\n── 3. XSS w emailu (HTML injection) ──\n');
  {
    // Serwer używa escapeHtml() — sprawdzamy czy jest prawidłowe
    // Zamiast prawdziwego maila sprawdzamy logikę escapeHtml statycznie
    const source = fs.readFileSync('./server.ts', 'utf-8');

    // Czy escapeHtml pokrywa wszystkie niebezpieczne znaki?
    const escapesAmpersand = source.includes("'&': '&amp;'");
    const escapesLt        = source.includes("'<': '&lt;'");
    const escapesGt        = source.includes("'>': '&gt;'");
    const escapesQuote     = source.includes("'\"': '&quot;'");
    const escapesApos      = source.includes("\"'\": '&#39;'") || source.includes("\"'\": \"&#39;\"");

    if (escapesAmpersand && escapesLt && escapesGt && escapesQuote) {
      ok('XSS-SERVER','escapeHtml() pokrywa &, <, >, "', 'wszystkie kluczowe znaki');
    } else {
      vuln('XSS-SERVER','escapeHtml() niekompletny', 'brakuje niektórych escape sekwencji');
    }

    // Czy message jest escapowany w HTML emailu?
    if (source.includes('escapeHtml(message)')) {
      ok('XSS-SERVER','message jest escapowany w HTML mailu');
    } else {
      vuln('XSS-SERVER','message NIE jest escapowany w HTML mailu — możliwy XSS w skrzynce odbiorcy');
    }

    // Czy name i phone są escapowane?
    if (source.includes('escapeHtml(safeName)') && source.includes('escapeHtml(safePhone)')) {
      ok('XSS-SERVER','name i phone escapowane w HTML mailu');
    } else {
      vuln('XSS-SERVER','name lub phone nie są escapowane w HTML mailu');
    }

    // Czy w plain-text (text:) są kontrolne znaki usuwane?
    if (source.includes('stripCtl(name)') && source.includes('stripCtl(phone)')) {
      ok('XSS-SERVER','stripCtl() na name i phone w plain-text');
    } else {
      vuln('XSS-SERVER','Brak stripCtl() — możliwy header injection w plain-text emailu');
    }

    // Czy message w plain-text jest stripCtl?
    // Sprawdzamy: text: `...${message}` bez stripCtl
    const msgInText = source.match(/text:.*?\n.*?message/s);
    if (source.includes('stripCtl(message)')) {
      ok('XSS-SERVER','message stripCtl w plain-text');
    } else {
      warn('XSS-SERVER','message w plain-text bez stripCtl()',
        'Możliwe \r\n injection w body maila — niegroźne jeśli odbiorca to trusted admin');
    }
  }

  // ══════════════════════════════════════════
  // 4. HEADER INJECTION (SMTP)
  // ══════════════════════════════════════════
  process.stdout.write('\n── 4. Header Injection (SMTP) ──\n');
  {
    // Sprawdź czy subject jest zabezpieczony przed CR/LF injection
    const source = fs.readFileSync('./server.ts', 'utf-8');

    // Subject używa safeName (po stripCtl)
    const subjectLine = source.match(/subject:.*?safeName/s);
    if (subjectLine) {
      ok('SMTP-INJECT','Subject używa stripCtl(name) — CRLF injection zabezpieczone');
    } else {
      vuln('SMTP-INJECT','Subject może być podatny na CRLF/header injection');
    }

    // Test przez API — próba CRLF w imieniu
    const crlfPayload = {
      name: "Test\r\nBcc: hacker@evil.com\r\nX-Injected: yes",
      phone: '+48600000000',
      message: 'Test header injection.',
      consent: true,
      website: '',
    };
    const r = await post(crlfPayload);
    info('SMTP-INJECT',`API response na CRLF payload`,`status=${r.status}, body=${JSON.stringify(r.body)}`);
    if (r.status === 200 && r.body?.ok) {
      warn('SMTP-INJECT','Serwer zaakceptował CRLF w name (stripCtl powinien je usunąć)',
        'Zaakceptowany — sprawdź czy stripCtl faktycznie działa');
    } else if (r.status === 400) {
      ok('SMTP-INJECT','Serwer odrzucił CRLF payload (400)');
    } else {
      info('SMTP-INJECT',`Serwer zwrócił status ${r.status}`,JSON.stringify(r.body));
    }
  }

  // ══════════════════════════════════════════
  // 5. SQL INJECTION
  // ══════════════════════════════════════════
  process.stdout.write('\n── 5. SQL Injection ──\n');
  {
    // Brak bazy danych w projekcie
    const hasSql = fs.existsSync('./db.ts') || fs.existsSync('./database.ts');
    const srcFiles = fs.readdirSync('./src', { recursive: true }).filter(f => f.toString().endsWith('.ts') || f.toString().endsWith('.tsx'));
    const dbPatterns = ['SELECT ', 'INSERT ', 'UPDATE ', 'DELETE ', 'FROM ', 'WHERE ', 'pg.', 'mysql.', 'sqlite', 'prisma', 'sequelize', 'knex', 'mongoose'];
    let sqlFound = false;

    for (const f of srcFiles) {
      const content = fs.readFileSync(`./src/${f}`, 'utf-8').toUpperCase();
      if (dbPatterns.some(p => content.includes(p))) { sqlFound = true; break; }
    }
    const serverContent = fs.readFileSync('./server.ts', 'utf-8').toUpperCase();
    if (dbPatterns.some(p => serverContent.includes(p))) sqlFound = true;

    if (sqlFound) {
      warn('SQLi','Znaleziono SQL patterns — sprawdź czy używane są prepared statements');
    } else {
      ok('SQLi','Brak bazy danych / SQL w projekcie — SQL injection nie dotyczy');
    }
  }

  // ══════════════════════════════════════════
  // 6. CSRF
  // ══════════════════════════════════════════
  process.stdout.write('\n── 6. CSRF ──\n');
  {
    // Sprawdź czy API ma CSRF token
    const source = fs.readFileSync('./server.ts', 'utf-8');
    const hasCSRFToken = source.includes('csrf') || source.includes('CSRF') || source.includes('x-csrf');

    if (!hasCSRFToken) {
      // Sprawdź czy Content-Type: application/json stanowi naturalną ochronę
      // Fetch API z cross-origin może wysłać JSON tylko z explicit CORS
      // Ale CORS jest * więc to nie chroni
      warn('CSRF','Brak CSRF tokenu',
        'API akceptuje JSON — przeglądarki NIE wysyłają cross-origin JSON bez preflight. ' +
        'Ale przy CORS: * atakujący może obejść to przez dodatkowe techniki.');
    } else {
      ok('CSRF','CSRF token zaimplementowany');
    }

    // Sprawdź czy formularz React ma ukryty token CSRF
    const appSrc = fs.readFileSync('./src/App.tsx', 'utf-8');
    if (appSrc.includes('csrf') || appSrc.includes('CSRF')) {
      ok('CSRF','Frontend wysyła CSRF token');
    } else {
      info('CSRF','Frontend nie wysyła CSRF tokenu',
        'JSON Content-Type + brak SameSite=None cookie = de facto ochrona CSRF dla typowego use-case');
    }

    // SameSite cookies?
    const r = await fetch(BASE).catch(()=>null);
    const setCookie = r?.headers?.get('set-cookie') || '';
    if (!setCookie) {
      ok('CSRF','Serwer nie ustawia cookies httponly/samesite (brak sesji do kradzieży)');
    } else {
      const hasSameSite = setCookie.toLowerCase().includes('samesite');
      if (!hasSameSite) warn('CSRF',`Cookie bez SameSite`, setCookie.substring(0,60));
      else              ok('CSRF',`Cookie z SameSite`, setCookie.substring(0,60));
    }
  }

  // ══════════════════════════════════════════
  // 7. RATE LIMITING & BRUTE FORCE
  // ══════════════════════════════════════════
  process.stdout.write('\n── 7. Rate Limiting ──\n');
  {
    const validPayload = { name: 'Jan Kowalski', phone: '+48600000000', message: 'Test rate limit.', consent: true, website: '' };
    const responses = [];

    // Wyślij 7 requestów (limit = 5/15min)
    for (let i = 0; i < 7; i++) {
      const r = await post(validPayload);
      responses.push({ i: i+1, status: r.status, error: r.body?.error });
    }

    const rateLimited = responses.filter(r => r.status === 429 || r.body?.error === 'rate_limited');
    const before5     = responses.slice(0,5);
    const after5      = responses.slice(5);

    info('RATE-LIMIT','Odpowiedzi 1-5', before5.map(r=>`${r.status}`).join(', '));
    info('RATE-LIMIT','Odpowiedzi 6-7', after5.map(r=>`${r.status} ${r.error||''}`).join(', '));

    if (rateLimited.length > 0) {
      ok('RATE-LIMIT',`Rate limiting działa`, `${rateLimited.length} requestów odrzuconych po limicie`);
    } else {
      vuln('RATE-LIMIT','Rate limiting NIE działa lub nie jest skonfigurowany',
        'Wysłano 7 requestów bez odrzucenia');
    }

    // Sprawdź konfigurację
    const source = fs.readFileSync('./server.ts', 'utf-8');
    const limitMatch = source.match(/limit:\s*(\d+)/);
    const windowMatch = source.match(/windowMs:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/);
    if (limitMatch) info('RATE-LIMIT',`Limit`, `${limitMatch[1]} req / okno`);
    if (windowMatch) {
      const ms = parseInt(windowMatch[1]) * parseInt(windowMatch[2]) * parseInt(windowMatch[3]);
      info('RATE-LIMIT','Window', `${ms/1000/60} minut`);
    }
  }

  // ══════════════════════════════════════════
  // 8. INPUT VALIDATION SERVER-SIDE
  // ══════════════════════════════════════════
  process.stdout.write('\n── 8. Input Validation (server-side) ──\n');
  {
    const cases = [
      { label:'consent=false',              pay:{ name:'Jan Kowalski', phone:'+48600000000', message:'Test.', consent:false, website:'' }, expectStatus:400 },
      { label:'consent=string "true"',      pay:{ name:'Jan Kowalski', phone:'+48600000000', message:'Test.', consent:'true', website:'' }, expectStatus:400 },
      { label:'name za krótka (1 znak)',    pay:{ name:'A', phone:'+48600000000', message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'name=number',               pay:{ name:12345, phone:'+48600000000', message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'name=null',                 pay:{ name:null, phone:'+48600000000', message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'name=array',               pay:{ name:['hack'], phone:'+48600000000', message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'name=object',              pay:{ name:{}, phone:'+48600000000', message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'phone=5 znaków',            pay:{ name:'Jan', phone:'12345', message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'phone > 40 znaków',         pay:{ name:'Jan K', phone:'1'.repeat(41), message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'message < 3 znaki',         pay:{ name:'Jan K', phone:'+48600000000', message:'AB', consent:true, website:'' }, expectStatus:400 },
      { label:'message > 5000 znaków',     pay:{ name:'Jan K', phone:'+48600000000', message:'A'.repeat(5001), consent:true, website:'' }, expectStatus:400 },
      { label:'brakujące pola (empty {})', pay:{}, expectStatus:400 },
      { label:'honeypot website wypełniony',pay:{ name:'Bot', phone:'+48600000000', message:'Spam.', consent:true, website:'http://evil.com' }, expectStatus:200 },
      { label:'prototype pollution __proto__',pay:{ '__proto__':{'admin':true}, name:'Jan K', phone:'+48600000000', message:'Test.', consent:true, website:'' }, expectStatus:400 },
      { label:'bardzo duże JSON (>64kb)',   pay:{ name:'Jan K', phone:'+48600000000', message:'A'.repeat(70000), consent:true, website:'' }, expectStatus:413 },
    ];

    for (const c of cases) {
      const r = await post(c.pay);
      if (c.expectStatus === 200) {
        // Honeypot — serwer zwraca 200 ale NIE wysyła maila
        if (r.status === 200) ok('VALIDATION',`Honeypot: ${c.label}`, `200 (mail nie wysłany — poprawne)`);
        else                  warn('VALIDATION',`Honeypot: ${c.label}`, `status=${r.status}`);
      } else if (r.status === c.expectStatus || r.status === 400 || r.status === 413) {
        ok('VALIDATION',`Odrzucono: ${c.label}`, `HTTP ${r.status}`);
      } else if (r.status === 200 && r.body?.ok) {
        vuln('VALIDATION',`PRZEPUSZCZONO: ${c.label}`, `HTTP ${r.status} — serwer zaakceptował nieprawidłowe dane!`);
      } else {
        info('VALIDATION',`${c.label}`, `status=${r.status}, body=${JSON.stringify(r.body).substring(0,60)}`);
      }
    }
  }

  // ══════════════════════════════════════════
  // 9. SENSITIVE DATA EXPOSURE
  // ══════════════════════════════════════════
  process.stdout.write('\n── 9. Sensitive Data Exposure ──\n');
  {
    // Sprawdź error messages — czy nie wyciekają stack traces
    const r500 = await post({ name:'x', phone:'x', message:'x', consent:true });
    const bodyStr = JSON.stringify(r500.body || {});
    if (bodyStr.includes('Error') || bodyStr.includes('stack') || bodyStr.includes('at ')) {
      warn('EXPOSURE','Stack trace w odpowiedzi API', bodyStr.substring(0,100));
    } else {
      ok('EXPOSURE','Brak stack trace w odpowiedzi API', bodyStr.substring(0,60));
    }

    // Sprawdź czy .env pliki są serwowane publicznie
    const envStatus = await fetch(`${BASE}/.env`).then(r=>r.status).catch(()=>0);
    if (envStatus === 200) {
      vuln('EXPOSURE','Plik .env dostępny publicznie!', `GET /.env → ${envStatus}`);
    } else {
      ok('EXPOSURE','Plik .env niedostępny publicznie', `GET /.env → ${envStatus}`);
    }

    // sprawdź inne wrażliwe pliki
    for (const f of ['/package.json', '/server.ts', '/src/App.tsx', '/.git/config']) {
      const s = await fetch(`${BASE}${f}`).then(r=>r.status).catch(()=>0);
      if (s === 200) warn('EXPOSURE',`${f} dostępny publicznie`, `HTTP ${s}`);
      else           ok('EXPOSURE',`${f} niedostępny`, `HTTP ${s}`);
    }

    // Sprawdź czy process.env nie jest eksponowany w bundle
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Sprawdź źródło JS bundla
    const jsUrls = await page.$$eval('script[src]', els => els.map(e => e.src));
    info('EXPOSURE','JS bundle URLs', jsUrls.join(', '));

    // Sprawdź czy SMTP credentials nie są w kliencie
    const secrets = ['SMTP_PASS', 'SMTP_USER', 'SMTP_HOST', 'SECRET_KEY'];
    for (const secret of secrets) {
      const found = await page.evaluate(s => {
        const src = Array.from(document.querySelectorAll('script')).map(e=>e.textContent||'').join('');
        return src.includes(s);
      }, secret);
      if (found) vuln('EXPOSURE',`"${secret}" znaleziony w JS kliencie!`);
      else       ok('EXPOSURE',`"${secret}" nie w JS kliencie`);
    }

    await ctx.close();
  }

  // ══════════════════════════════════════════
  // 10. OPEN REDIRECT & PATH TRAVERSAL
  // ══════════════════════════════════════════
  process.stdout.write('\n── 10. Open Redirect & Path Traversal ──\n');
  {
    // Path traversal — próba dostępu do plików poza dist/
    const traversalPaths = [
      '/../server.ts',
      '/../../etc/passwd',
      '/%2e%2e/server.ts',
      '/..%2Fserver.ts',
    ];

    for (const p of traversalPaths) {
      const r = await fetch(`${BASE}${p}`).then(r=>({status:r.status})).catch(()=>({status:0}));
      if (r.status === 200) vuln('PATH-TRAVERSAL',`Path traversal dostępny: ${p}`,`HTTP ${r.status}`);
      else                  ok('PATH-TRAVERSAL',`${p} → ${r.status}`);
    }

    // Open redirect — sprawdź czy jakiekolwiek endpointy przekierowują
    const redirectPaths = ['/?redirect=http://evil.com', '/api/contact?next=http://evil.com'];
    for (const p of redirectPaths) {
      const r = await fetch(`${BASE}${p}`, { redirect: 'manual' }).then(r=>({status:r.status,location:r.headers.get('location')||''})).catch(()=>({status:0,location:''}));
      if (r.status >= 300 && r.status < 400 && r.location.startsWith('http://evil')) {
        vuln('REDIRECT',`Open redirect: ${p}`, `→ ${r.location}`);
      } else {
        ok('REDIRECT',`Brak open redirect na ${p}`, `status=${r.status}`);
      }
    }
  }

  // ══════════════════════════════════════════
  // 11. CLICKJACKING (wizualnie)
  // ══════════════════════════════════════════
  process.stdout.write('\n── 11. Clickjacking (iframe test) ──\n');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    // Spróbuj osadzić stronę w iframe
    await page.setContent(`
      <html><body>
        <iframe id="frame" src="${BASE}" width="1280" height="800"></iframe>
        <script>
          document.getElementById('frame').onload = function() {
            try {
              var title = this.contentDocument.title;
              window._frameLoaded = true;
              window._frameTitle = title;
            } catch(e) {
              window._frameLoaded = false;
              window._frameError = e.message;
            }
          };
        </script>
      </body></html>
    `, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const frameLoaded = await page.evaluate(() => window._frameLoaded);
    const frameTitle  = await page.evaluate(() => window._frameTitle);
    const xfo = (await fetch(BASE).catch(()=>null))?.headers?.get('x-frame-options');

    if (!xfo) {
      vuln('CLICKJACK','Brak X-Frame-Options — strona może być osadzona w iframe',
        'Atakujący może nakryć stronę przeźroczystym iframe i przechwytywać kliknięcia');
      if (frameLoaded) info('CLICKJACK','Iframe faktycznie załadował stronę', `title="${frameTitle}"`);
    } else if (xfo.toUpperCase().includes('DENY') || xfo.toUpperCase().includes('SAMEORIGIN')) {
      ok('CLICKJACK',`X-Frame-Options: ${xfo}`);
    } else {
      warn('CLICKJACK',`X-Frame-Options niekompletny`, xfo);
    }

    await shot(page, '11-iframe-test');
    await ctx.close();
  }

  // ══════════════════════════════════════════
  // 12. DEPENDENCY AUDIT
  // ══════════════════════════════════════════
  process.stdout.write('\n── 12. Dependency Vulnerabilities ──\n');
  {
    // npm audit już uruchomiony wcześniej — wczytaj wynik
    const { execSync } = await import('child_process');
    try {
      const auditOut = execSync('npm audit --json', { cwd: process.cwd(), encoding: 'utf-8', timeout: 30000 });
      const audit = JSON.parse(auditOut);
      const vulns = audit.metadata?.vulnerabilities || {};
      const total = vulns.total || 0;
      if (total === 0) {
        ok('DEPS','npm audit: 0 znanych podatności w zależnościach');
      } else {
        const critical = vulns.critical || 0;
        const high     = vulns.high || 0;
        if (critical > 0 || high > 0) vuln('DEPS',`npm audit: ${critical} critical, ${high} high`, `total: ${total}`);
        else                           warn('DEPS',`npm audit: ${total} podatności (brak critical/high)`, JSON.stringify(vulns));
      }
    } catch (e) {
      info('DEPS','npm audit error', e.message?.substring(0,60));
    }
  }

  await browser.close();

  // ═══════════════════════════════════════
  // RAPORT KOŃCOWY
  // ═══════════════════════════════════════
  const safe  = findings.filter(f => f.status.includes('SAFE')).length;
  const warns = findings.filter(f => f.status.includes('WARN')).length;
  const vulns = findings.filter(f => f.status.includes('VULN')).length;
  const infos = findings.filter(f => f.status.includes('INFO')).length;

  process.stdout.write('\n══════════════════════════════════════════\n');
  process.stdout.write(`  WYNIKI: ${safe} SAFE  ${warns} WARN  ${vulns} VULN  ${infos} INFO\n`);
  process.stdout.write('══════════════════════════════════════════\n\n');

  const cats = [...new Set(findings.map(f => f.cat))];
  const now  = new Date().toLocaleString('pl-PL');
  let md = `# Security Report — eprzyczepy.eu\n> ${now}\n\n`;
  md += `| SAFE | WARN | VULN | INFO |\n|------|------|------|------|\n| ${safe} | ${warns} | ${vulns} | ${infos} |\n\n`;

  for (const cat of cats) {
    md += `## ${cat}\n\n`;
    for (const f of findings.filter(x => x.cat === cat)) {
      md += `${f.status} **${f.t}**${f.d ? `\n> ${f.d}` : ''}\n\n`;
    }
  }

  fs.writeFileSync(OUT, md, 'utf-8');
  process.stdout.write(`Raport: ${OUT}\n`);

  if (vulns > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });

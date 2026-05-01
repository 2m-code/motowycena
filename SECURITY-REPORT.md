# Security Report — eprzyczepy.eu
> 1 maja 2026 · Playwright + analiza statyczna + weryfikacja manualna

## Wynik ogólny

| Obszar | Status |
|--------|--------|
| XSS klient (React) | ✅ BEZPIECZNY |
| XSS email HTML (escapeHtml) | ✅ BEZPIECZNY |
| SQL Injection | ✅ NIE DOTYCZY — brak bazy danych |
| SMTP Header Injection | ✅ BEZPIECZNY (stripCtl) |
| Rate Limiting | ✅ DZIAŁA (5 req/15min) |
| Honeypot / bot protection | ✅ DZIAŁA |
| Kredencjały w JS bundlu | ✅ BEZPIECZNY |
| npm audit CVE | ✅ 0 podatności w 317 pakietach |
| HTTP Security Headers | 🔴 BRAK — fix przed release |
| CORS | 🔴 OTWARTY — fix przed release |
| CSRF | ⚠️ Akceptowalne po fix CORS |
| message stripCtl | ⚠️ Drobna niedoróbka |

---

## 🔴 Do naprawy przed release

### SEC-01 — Brak security headers

**Plik:** `server.ts` — dodać przed routami

Brak 6 kluczowych nagłówków HTTP:

| Brakujący nagłówek | Ryzyko |
|--------------------|--------|
| `X-Frame-Options: SAMEORIGIN` | Clickjacking — iframe na obcej stronie |
| `X-Content-Type-Options: nosniff` | MIME sniffing — przeglądarka zgaduje typ pliku |
| `Content-Security-Policy` | Ograniczenie skąd ładują się skrypty/style |
| `Strict-Transport-Security` | Downgrade z HTTPS na HTTP |
| `Referrer-Policy` | Wyciek adresu URL do zewnętrznych serwisów |
| `Permissions-Policy` | Nieograniczony dostęp do kamera/mic/GPS |

**Fix:**
```ts
app.use((_, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "frame-src https://challenges.cloudflare.com; " +
    "connect-src 'self'"
  );
  next();
});
```

### SEC-02 — CORS bez ograniczenia origin

**Plik:** `server.ts` linia 15

`cors()` bez konfiguracji = `Access-Control-Allow-Origin: *` — każda strona może wysłać POST do `/api/contact` i używać waszego SMTP jako spam relay.

**Fix:**
```ts
app.use(cors({
  origin: ['https://www.eprzyczepy.eu', 'https://eprzyczepy.eu'],
  methods: ['POST'],
}));
```

---

## ⚠️ Ostrzeżenia (niskie ryzyko)

### SEC-03 — `message` w plain-text mailu bez stripCtl

**Plik:** `server.ts` linia 109

Name i phone mają `stripCtl()` (usuwa \r\n\0) ale `message` w `text:` nie:
```ts
text: `Imię: ${safeName}\nTelefon: ${safePhone}\n\n${message}`, // ← message bez stripCtl
```
Ryzyko minimalne (odbiorca to zaufany admin), ale spójność dobra praktyką.

**Fix:** `...\n\n${stripCtl(message)}`

### SEC-04 — Brak CSRF tokenu (akceptowalne)

API przyjmuje tylko `Content-Type: application/json`. Przeglądarki blokują cross-origin fetch z JSON bez CORS preflight. Po wdrożeniu SEC-02 (CORS ograniczony do eprzyczepy.eu) CSRF staje się praktycznie niemożliwy.

Brak sesji cookie = nie ma czego kraść. **Ryzyko: bardzo niskie.**

---

## ✅ Potwierdzone zabezpieczenia — szczegóły

### XSS — klient (React JSX auto-escape)
Testowano 5 payloadów przez Playwright. Żaden nie wykonał się:
```
<script>alert('xss')</script>           → tekst w polu ✅
<img src=x onerror="alert('xss')">     → tekst w polu ✅
"><svg onload=alert('xss')>             → tekst w polu ✅
javascript:alert('xss')                 → tekst w polu ✅
<iframe src="javascript:alert('xss')"> → tekst w polu ✅
```
React nigdy nie używa `dangerouslySetInnerHTML` — potwierdzone grep po całym `src/`.

### XSS — serwer (HTML email)
`escapeHtml()` escapuje: `& < > " '` → `&amp; &lt; &gt; &quot; &#39;`
Wszystkie 3 pola (name, phone, message) escapowane przed wstawieniem do HTML mailu.

### SQL Injection
**Nie dotyczy.** Zero SQL w projekcie. Brak Postgres, MySQL, SQLite, Prisma, Mongoose, Knex.
Zewnętrzne systemy: SMTP (Nodemailer) + Cloudflare Turnstile — oficjalne biblioteki.

### SMTP Header Injection
`stripCtl()` usuwa `\r\n\0` z `name` i `phone` przed wstawieniem do subject i treści.
Test CRLF payload `"Test\r\nBcc: hacker@evil.com"` → serwer zwrócił 500 (SMTP nieskoonfigurowany w dev) bez wykonania injection.

### Rate Limiting — potwierdzone w testach
5 req / 15 min per IP. Po przekroczeniu: `HTTP 429 { ok: false, error: 'rate_limited' }`.

### Honeypot
Pole `website` (ukryte, `tabIndex=-1`, `aria-hidden=true`). Jeśli wypełnione → cicha `200` bez wysłania maila. Boty wypełniające wszystkie pola są blokowane niewidocznie.

### Kredencjały — nie wyciekają do klienta
Grep po JS bundlu: SMTP_PASS, SMTP_USER, SMTP_HOST, SECRET_KEY — żadne nie pojawia się w kliencie. Vite eksponuje tylko zmienne z prefiksem `VITE_*`.

### npm audit
0 podatności (critical: 0, high: 0, moderate: 0, low: 0) w 317 pakietach.

### Brak stack trace w API
Błędy zwracają tylko `{ ok: false, error: 'send_failed' }`. Żadnych nazw plików, ścieżek, wersji bibliotek.

---

## False positives z automated scanu — wyjaśnienie

| Co wykrył automat | Rzeczywistość |
|------------------|---------------|
| `GET /.env → 200` | Zwraca SPA `index.html` (Vite SPA fallback) — plik `.env` **NIE jest eksponowany** |
| `GET /../server.ts → 200` | Vite dev serwuje source files dla HMR — **tylko w trybie dev**, w prod nie ma Vite |
| `GET /../../etc/passwd → 200` | SPA fallback `index.html` — `/etc/passwd` **nie jest czytany** |
| SQL Injection WARN | `MAIL_FROM` env var zawiera słowo "FROM" — **false positive** |
| Path traversal | W produkcji Nginx/Express static serwuje tylko `dist/` — nie ma dostępu do `src/` |

---

## Checklist deploy

- [ ] **SEC-01** — dodać security headers middleware do `server.ts`
- [ ] **SEC-02** — ograniczyć CORS do `eprzyczepy.eu`
- [ ] **SEC-03** — `stripCtl(message)` w plain-text mailu
- [ ] Skonfigurować `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` w `.env`
- [ ] `.env` w `.gitignore` — NIE commitować do repo
- [ ] Nginx/Caddy przed Express: serwuje `/dist`, proxy `/api` → Express
- [ ] HTTPS z ważnym certyfikatem (wymagane dla HSTS)

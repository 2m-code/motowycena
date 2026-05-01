# Do naprawy — eprzyczepy.eu
> Branch: `fix/bugs-audit` · Audyt: 80 sprintów Playwright · maj 2026

---

## 🔴 Przed release

- [ ] **scroll-margin-top** — header przykrywa każdą sekcję po kliknięciu nav (potwierdzone 4×)
  ```css
  /* App.tsx — CampingSection, TransportSection, ContactSection */
  scroll-margin-top: 130px;
  ```

- [ ] **CORS otwarty** — `cors()` bez origin = spam relay przez wasz SMTP
  ```ts
  // server.ts linia 15
  app.use(cors({ origin: ['https://www.eprzyczepy.eu', 'https://eprzyczepy.eu'], methods: ['POST'] }));
  ```

- [ ] **Security headers** — brak X-Frame-Options, CSP, HSTS, Referrer-Policy, Permissions-Policy
  ```ts
  // server.ts — przed routami
  app.use((_, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; " +
      "img-src 'self' data:; frame-src https://challenges.cloudflare.com; connect-src 'self'"
    );
    next();
  });
  ```

- [ ] **message stripCtl** — CRLF w treści maila plain-text
  ```ts
  // server.ts linia 109
  text: `Imię: ${safeName}\nTelefon: ${safePhone}\n\n${stripCtl(message)}`,
  ```

---

## 🟡 Ważne

- [ ] **Touch target: hamburger 40px** → `padding: 0.625rem` w `MobileMenuButton`
- [ ] **Touch target: X cookie banner 32px** → `width/height: 2.75rem` w `CloseBtn`
- [ ] **Touch target: checkbox RODO 16px** → wrapper min 44×44px lub custom styled
- [ ] **Touch target: cookie buttons 42px** → `padding: 0.875rem 1.25rem` w `baseBtn`
- [ ] **Touch target: linki stopki 14px** → `padding: 0.5rem 0` w `FooterLink`, `FooterCreditBrand`
- [ ] **Touch target: link PP w consent 36px** → `padding: 0.25rem 0` na `ConsentLabel a`

- [ ] **Walidacja telefonu** — `type="tel"` nie sprawdza formatu, można wpisać "abc"
  ```ts
  // App.tsx — handleContactSubmit przed fetch
  if (!/^\+?[\d\s\-()]{9,}$/.test(formPhone.trim())) {
    setFormErrorCode('invalid_input'); setFormStatus('error'); return;
  }
  ```

- [ ] **Same spacje w imieniu** — `"   "` przechodzi HTML5 `required`
  ```ts
  // App.tsx — handleContactSubmit przed fetch
  if (formName.trim().length < 2) {
    setFormErrorCode('invalid_input'); setFormStatus('error'); return;
  }
  ```

- [ ] **Textarea bez maxlength** — serwer odrzuca >5000 ale klient nie ogranicza
  ```tsx
  // App.tsx — FormTextarea
  <FormTextarea maxLength={5000} ...>
  ```

- [ ] **Input formularza 211px na mobile** — za dużo zagnieżdżonego paddingu
  ```ts
  // App.tsx — ContactForm
  ${media.sm} { padding: 1.5rem; }  // było 2rem
  ```

- [ ] **Focus trap mobile menu** — Tab po 2. naciśnięciu gubi fokus poza menu

- [ ] **aria-expanded desync po resize** — menu otwarte na mobile → resize → `aria-expanded=true` mimo ukrytego menu
  ```ts
  // App.tsx
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setIsMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  ```

- [ ] **Google Fonts render-blocking** — blokuje DOMContentLoaded na słabym łączu
  ```html
  <!-- index.html — zamień <link rel="stylesheet"> na: -->
  <link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"/>
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"/></noscript>
  ```

---

## 🔵 Minor (po release)

- [ ] **Skip link** — brak "Przejdź do treści" + `<main>` bez id
- [ ] **`<nav>` bez aria-label** → `<DesktopNav aria-label="Nawigacja główna">`
- [ ] **Obrazki bez width/height** — CLS (strona skacze podczas ładowania), dotyczy wszystkich `<img>`
- [ ] **og:image:alt brak** → `<meta property="og:image:alt" content="Wypożyczalnia przyczep — EPRZYCZEPY.EU"/>`
- [ ] **Preload hero image** → `<link rel="preload" as="image" href="/trailers/T1.jpg"/>` w `<head>`
- [ ] **Focus po Escape** — nie wraca na hamburger button po zamknięciu menu
- [ ] **apple-touch-icon brak** → `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` + PNG 180×180
- [ ] **favicon.ico brak** → dodać `public/favicon.ico` (fallback dla starych przeglądarek)
- [ ] **Brak @media print** — sticky header drukuje się na każdej stronie
- [ ] **Consent link 36px** — link PP w checkboxie za niski touch target

---

## ✅ Potwierdzone OK (nie ruszać)

- React XSS — auto-escape działa, brak `dangerouslySetInnerHTML`
- Email HTML — `escapeHtml()` na wszystkich polach
- SMTP header injection — `stripCtl()` na name i phone
- Rate limiting — 5 req/15min, HTTP 429
- Honeypot — działa, boty blokowane cicho
- Double submit — disabled button, 1 request przy 5 kliknięciach
- Walidacja serwera — typy, długości, consent sprawdzane
- SQL injection — brak DB w projekcie
- Kredencjały — nie wyciekają do JS bundla
- npm audit — 0 CVE w 317 pakietach
- Komunikaty błędów — 7 kodów, wszystkie z tekstem, brak stack trace
- localStorage cookie consent — persist, reset, działa
- Tab order formularza — name → phone → message → consent → submit

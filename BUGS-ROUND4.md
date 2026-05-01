# BUGS RUNDA 4 — eprzyczepy.eu
> 1 maja 2026 · 20 sprintów · 7 bugów · 105 notatek · 19 screenshotów

---

## Realne bugi (7)

**B1 · S06 · `<nav>` bez aria-label**
Plik: `App.tsx — DesktopNav`
Fix: `<DesktopNav aria-label="Nawigacja główna">`

**B2 · S08 · Brak apple-touch-icon**
Plik: `index.html`
Fix: `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` + PNG 180×180px

**B3 · S08 · Brak /favicon.ico fallback**
Plik: `public/`
Crawlery i niektóre maile nie obsługują SVG — dodać `public/favicon.ico`

**B4 · S09 · Brak skip link + `<main>` bez id**
Plik: `App.tsx, index.html`
Pierwsze Tab → logo (div), nie skip link. `<main>` bez id = skip link nie może wskazać celu.
Fix: `<a href="#main-content" class="skip-link">Przejdź do treści</a>` + `id="main-content"` na MainContent

**B5 · S15 · aria-expanded=true po resize do desktop (desync stanu)**
Plik: `App.tsx`
Gdy menu otwarte na mobile → resize do desktop → `aria-expanded=true` mimo ukrytego menu.
Fix: `useEffect(() => { if (window.innerWidth >= 768) setIsMenuOpen(false); }, [resize])`

**B6 · S11 · Hero CTA scroll do #kontakt: 606px od góry (za daleko)**
Plik: `App.tsx — ContactSection`
"Skontaktuj Się" scrolluje ale sekcja ląduje 606px od góry (header ma 121px).
To jest ten sam bug co R1-B1 (brak scroll-margin-top) — potwierdzony po raz czwarty.

**B7 · S20 · CORS bez ograniczenia origin — API spam relay**
Plik: `server.ts`
`cors()` bez konfiguracji = `Access-Control-Allow-Origin: *` — każda strona może POSTować do `/api/contact`.
Fix: `cors({ origin: ['https://www.eprzyczepy.eu'] })`

---

## Co działało dobrze (nowe potwierdzenia R4)

- localStorage persist OK, submit loading state OK, rapid submit 1 request OK
- ARIA landmarks OK, alt texty OK, accessible names OK
- og-image 1200×630px OK, specyfikacje wszystkich 4 przyczep kompletne
- lang="pl" spójny, brak motowycena/509/starego emaila w treści
- Zero JS errors przez całą rundę

# Progress — przygotowanie strony do oddania klientowi

**Branch:** `fix/pre-handoff-blockers`
**Ostatnia aktualizacja:** 2026-04-24
**Commity:** 5 (`029796c`, `295b117`, `48ae6a2`, `e168072`, `6932a4d`)

## ✅ Zrobione

### 🔴 Bloki P0 — `029796c`
- [x] Telefon w sekcji kontakt: `+48123456789` placeholder → `tel:+48509146666`
- [x] Telefon w CTA karty przyczepy: `+481509146666` → `tel:+48509146666` (jedna cyfra za dużo)
- [x] Formularz kontaktowy podpięty przez `mailto:biuro@motowycena.pl` z prefillem
- [x] Pola formularza: `id`/`htmlFor`/`required`/`autoComplete` (a11y + walidacja)
- [x] Usunięty martwy link "Regulamin Wynajmu" ze stopki

### 🟠 SEO — `295b117`
- [x] `<html lang="en">` → `lang="pl"`
- [x] `<title>` rozszerzony o zakres usług
- [x] `<meta name="description">` z telefonem i lokalizacją
- [x] Open Graph tags (og:title, description, url, image, locale, site_name)
- [x] Twitter Card tags
- [x] Canonical URL + theme-color
- [x] Favicon SVG (namiot w kolorze marki)
- [x] `metadata.json` — zaktualizowany

### 🟡 Czystka — `48ae6a2`
- [x] Usunięte `public/Hobby-*.jpg` (6 plików, ~300 kB)
- [x] Usunięte orphan komponenty `src/components/{Header,Watermark}.tsx`
- [x] Deps wyczyszczone: `@google/genai`, `express`, `dotenv`, `tsx`, `@types/express` (-127 paczek)
- [x] `vite.config.ts`: wywalony `define: GEMINI_API_KEY`, alias `@/*` → `./src/*`
- [x] Usunięty `.env.example`
- [x] `package.json name`: `react-example` → `motowycena-pl`
- [x] `README.md` przepisane (realny stack)

### 🟢 Perf/SEO — `e168072`
- [x] `public/robots.txt` + `public/sitemap.xml`
- [x] `loading="lazy"` + `decoding="async"` na obrazkach poza hero
- [x] `fetchPriority="high"` na hero
- [x] Poprawione alt-teksty miniatur

### 🔵 a11y/perf — `6932a4d`
- [x] **ThumbGrid adaptive** — dynamic liczba kolumn bazowana na `trailer.images.length` (Tabbert 6 = 6 kolumn, Lunar 5 = 5, itd.). Koniec z sierotą w drugim rzędzie dla Tabberta.
- [x] `aria-label` + `aria-pressed` na miniaturach galerii
- [x] `aria-label` + `aria-expanded` na hamburger
- [x] `scroll-margin-top: 5rem` na `section[id]` (bufor pod fixed header)
- [x] `html { scroll-behavior: smooth }` w GlobalStyle
- [x] **Font Inter** przeniesiony z `@import url()` (render-blocking) na `<link>` w `index.html` + `preconnect` do `fonts.googleapis.com` / `fonts.gstatic.com`
- [x] Usunięty `src/index.css` (zawierał tylko `@import`)
- [x] `tsconfig`: wywalone `useDefineForClassFields: false`, `experimentalDecorators` (nieużywane), alias `@/*` → `./src/*`
- [x] `.gitattributes`: `eol=lf` dla tekstu, `binary` dla obrazków (koniec z warningami LF→CRLF)

### 🧪 Testy (CLI)
- [x] `tsc --noEmit` czysto
- [x] `vite build` 408 kB JS / gzip 130 kB, ~2s
- [x] Preview server: home/robots/sitemap/favicon wszystko 200
- [x] 15/15 obrazków trailer zwraca 200
- [x] Bundle grep: 0 placeholderów, 2 poprawne numery tel, 2 maile, 0 martwych `href="#"`
- [x] 0 artefaktów Gemini/GenAI
- [x] Spójność sekcji id ↔ sitemap

## ⏸️ Zablokowane — czekam na decyzję/dane klienta

- [ ] **Formularz mailto → Formspree/Make** — `mailto:` to tymczasówka. Opcje:
  - Formspree (darmowy plan, 50 zgłoszeń/miesiąc, 5 min setup)
  - Make scenario (masz MCP, webhook → email/Slack/arkusz)
  - Własny backend (nie polecam dla landing-page)
- [ ] **Regulamin wynajmu** — decyzja: usunięty. Można dorobić podstronę (szablon: `PrivacyPolicy.tsx`) gdy Rafał da treść.
- [ ] **OG image 1200×630** — teraz używa `T1.jpg` cropowany. Dedykowana grafika lepsza.

## 🙋 Wymaga ręcznego testu w przeglądarce

- [ ] Formularz `mailto:` — klik "Wyślij Wiadomość" → otwiera klienta pocztowego z prefillem. Sprawdź desktop + mobile.
- [ ] Telefony — klik na `+48 509 146 666` w sekcji kontakt + "Zadzwoń" w każdej z 4 kart
- [ ] Mobile menu — hamburger open/close, scroll do sekcji
- [ ] Hash routing — klik "Polityka Prywatności" → osobny widok, "Wróć" → powrót na landing
- [ ] Cookie consent — baner przy pierwszej wizycie (localStorage)
- [ ] Responsive breakpoints: 360-390 (tel), 640 (sm), 768 (md), 1024 (lg)
- [ ] **Galeria Tabbert** — sprawdź czy wszystkie 6 miniatur są w jednym rzędzie (wcześniej 5+1)
- [ ] Smooth scroll i scroll-margin — klik linków nav, sekcje mają 5rem bufor

## 📦 Merge

- [ ] `git checkout main && git merge fix/pre-handoff-blockers --no-ff` (po akceptacji testu w przeglądarce)

## 📊 Metryki build

| Metryka | Przed | Po | Delta |
|---|---|---|---|
| Bundle JS (gzip) | 110 kB | 131 kB | +20 kB (styled-components, motion, form state) |
| `index.html` (gzip) | 0.32 kB | 0.80 kB | +0.48 kB (meta + OG + font links) |
| `dist/` total | 2.12 MB | 1.8 MB | -300 kB (Hobby usunięte) |
| Deps w node_modules | ~440 paczek | ~313 paczek | -127 |

## 📚 Referencje

- `TESTING.md` (w repo, nie committed) — pełny raport testów sprzed rozpoczęcia prac
- `src/components/PrivacyPolicy.tsx` — szablon dla ewentualnego regulaminu
- `src/components/CookieConsent.tsx` — baner zgody (zaimplementowany)

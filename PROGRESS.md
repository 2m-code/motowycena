# Progress — przygotowanie strony do oddania klientowi

**Branch:** `fix/pre-handoff-blockers`
**Ostatnia aktualizacja:** 2026-04-24

## ✅ Zrobione

### 🔴 Bloki P0 (029796c)
- [x] Telefon w sekcji kontakt: `+48123456789` placeholder → `tel:+48509146666`
- [x] Telefon w CTA karty przyczepy: `+481509146666` → `tel:+48509146666` (jedna cyfra za dużo)
- [x] Formularz kontaktowy podpięty przez `mailto:biuro@motowycena.pl` z prefillem
- [x] Pola formularza: `id`/`htmlFor`/`required`/`autoComplete` (a11y + walidacja)
- [x] Usunięty martwy link "Regulamin Wynajmu" ze stopki (decyzja: usuwamy zamiast robić pustą stronę)

### 🟠 SEO / a11y (295b117)
- [x] `<html lang="en">` → `lang="pl"`
- [x] `<title>` rozszerzony o zakres usług
- [x] `<meta name="description">` z telefonem i lokalizacją
- [x] Open Graph tags (og:title, description, url, image, locale, site_name)
- [x] Twitter Card tags
- [x] Canonical URL + theme-color
- [x] Favicon SVG (namiot w kolorze marki)
- [x] `metadata.json` — "Wypożyczalnia Przyczep" → "Motowycena Rafał Pelczar"

### 🟡 Czystka (48ae6a2)
- [x] Usunięte `public/Hobby-*.jpg` (6 plików, ~300 kB martwych zdjęć w bundlu)
- [x] Usunięte orphan komponenty `src/components/{Header,Watermark}.tsx`
- [x] Deps wyczyszczone: `@google/genai`, `express`, `dotenv`, `tsx`, `@types/express` (-127 paczek)
- [x] `vite.config.ts`: wywalony `define: GEMINI_API_KEY` (ryzyko wycieku), alias `@/*` → `./src/*`
- [x] Usunięty `.env.example` (referował nieużywane zmienne)
- [x] `package.json name`: `react-example` → `motowycena-pl`
- [x] `README.md` przepisane (realny stack zamiast AI Studio + Gemini)

### 🟢 Perf/SEO (e168072)
- [x] `public/robots.txt` + `public/sitemap.xml`
- [x] `loading="lazy"` + `decoding="async"` na obrazkach poza hero
- [x] `fetchPriority="high"` na hero (LCP optimization)
- [x] Poprawione alt-teksty miniatur

### 🧪 Testy (CLI)
- [x] `tsc --noEmit` czysto
- [x] `vite build` 408 kB JS / gzip 130 kB, 2.08s
- [x] Preview server: home 200, robots 200, sitemap 200, favicon 200
- [x] Wszystkie 15 obrazków trailer zwracają 200
- [x] Bundle grep: 0 placeholderów, 2 poprawne numery tel, 2 maile, 0 martwych `href="#"`
- [x] 0 artefaktów Gemini/GenAI w bundlu
- [x] Spójność sekcji id ↔ sitemap

## 🚧 W trakcie (automat)

- [ ] ThumbGrid adaptive columns (Tabbert ma 6 zdjęć, siatka ma `repeat(5, ...)` → sierota)
- [ ] `aria-label` na hamburger button i miniatury galerii
- [ ] `scroll-margin-top` na sekcjach w GlobalStyle (bufor pod fixed header)
- [ ] `tsconfig.json`: wywalić `useDefineForClassFields: false`, poprawić alias `@/*` → `./src/*`
- [ ] `.gitattributes` z `* text=auto eol=lf` (warningi LF→CRLF przy każdym commicie)
- [ ] `<link rel="preconnect">` do Google Fonts w `index.html` (perf)

## ⏸️ Zablokowane — czekam na decyzję/dane klienta

- [ ] **Formularz mailto → Formspree/Make** — `mailto:` to tymczasówka. Docelowo Formspree albo scenario w Make (masz MCP). Kto wybiera?
- [ ] **Regulamin wynajmu** — zdecydowane: usuwamy (link już wyleciał). Można dorobić podstronę jak Rafał da treść.
- [ ] **OG image 1200×630** — teraz używa `T1.jpg` (cropowany). Dedykowana grafika lepsza, ale wymaga grafika.

## 🙋 Wymaga ręcznego testu w przeglądarce

- [ ] Formularz mailto — klik "Wyślij Wiadomość", sprawdzić czy otwiera klienta pocztowego z prefillem
- [ ] Telefony — klik na `+48 509 146 666` w kontakcie + "Zadzwoń" w każdej z 4 kart
- [ ] Mobile menu — hamburger, open/close, scroll do sekcji
- [ ] Hash routing — klik "Polityka Prywatności" → osobny widok, "Wróć" → powrót
- [ ] Cookie consent — baner przy pierwszej wizycie
- [ ] Responsive breakpoints: 360-390px, 640px (sm), 768px (md), 1024px (lg)

## 📦 Merge

- [ ] `git checkout main && git merge fix/pre-handoff-blockers` (po akceptacji testu w przeglądarce)

## 📊 Metryki build

| Metryka | Przed | Po |
|---|---|---|
| Bundle JS (gzip) | ~110 kB | ~130 kB | (+20 kB = styled-components, motion, form handler) |
| `dist/` total | 2.12 MB | 1.8 MB | (-300 kB = Hobby zdjęcia) |
| Deps | ~440 paczek | ~313 paczek | (-127 po cleanupie) |

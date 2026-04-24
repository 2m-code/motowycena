# Progress — przygotowanie strony do oddania klientowi

**Branch:** `fix/pre-handoff-blockers`
**Ostatnia aktualizacja:** 2026-04-24
**Commity:** 6 (`029796c` → `06f9ade`)

## ✅ Zrobione

### 🔴 Bloki P0 — `029796c`
- [x] Telefon w sekcji kontakt: `+48123456789` → `tel:+48509146666`
- [x] Telefon w CTA karty przyczepy: `+481509146666` → `tel:+48509146666`
- [x] Formularz kontaktowy podpięty przez `mailto:biuro@motowycena.pl` z prefillem
- [x] Pola formularza: `id`/`htmlFor`/`required`/`autoComplete` (a11y + walidacja)
- [x] Usunięty martwy link "Regulamin Wynajmu" ze stopki
- [x] Adres: placeholder AI → `Ul. Spacerowa 10, 63-430 Garki`
- [x] Email: placeholder → `biuro@motowycena.pl`

### 🟠 SEO — `295b117`
- [x] `<html lang="en">` → `lang="pl"`
- [x] `<title>` rozszerzony o zakres usług i lokalizację
- [x] `<meta name="description">` z telefonem i lokalizacją
- [x] Open Graph tags (og:title, description, url, image, locale, site_name)
- [x] Twitter Card tags
- [x] Canonical URL + theme-color
- [x] Favicon SVG
- [x] `metadata.json` zaktualizowany

### 🟡 Czystka — `48ae6a2`
- [x] Usunięte `public/Hobby-*.jpg` (6 plików, ~300 kB)
- [x] Usunięte orphan komponenty `src/components/{Header,Watermark}.tsx`
- [x] Deps wyczyszczone: `@google/genai`, `express`, `dotenv`, `tsx`, `@types/express` (-127 paczek)
- [x] `vite.config.ts`: wywalony `define: GEMINI_API_KEY`, alias `@/*` → `./src/*`
- [x] Usunięty `.env.example`
- [x] `package.json name`: `react-example` → `motowycena-pl`
- [x] `README.md` przepisane (realny stack)
- [x] `vite.config.ts`: naprawiony broken char `â` w komentarzu HMR

### 🟢 Perf/SEO — `e168072`
- [x] `public/robots.txt` + `public/sitemap.xml`
- [x] `loading="lazy"` + `decoding="async"` na obrazkach poza hero
- [x] `fetchPriority="high"` na hero
- [x] `referrerPolicy="no-referrer"` usunięte z lokalnych obrazków
- [x] Poprawione alt-teksty miniatur

### 🔵 a11y/perf — `6932a4d`
- [x] **ThumbGrid adaptive** — dynamic liczba kolumn bazowana na `trailer.images.length`
- [x] `aria-label` + `aria-pressed` na miniaturach galerii
- [x] `aria-label` + `aria-expanded` na hamburger
- [x] `scroll-margin-top: 5rem` na `section[id]`
- [x] `html { scroll-behavior: smooth }` w GlobalStyle
- [x] **Font Inter** przeniesiony z `@import` (render-blocking) na `<link>` + `preconnect`
- [x] Usunięty `src/index.css`
- [x] `tsconfig`: wywalone `useDefineForClassFields`, `experimentalDecorators`, alias poprawiony
- [x] `.gitattributes`: `eol=lf` + binary dla obrazków

### 🟣 P3 — drobne (naprawione w ramach poprzednich batchy)
- [x] Hero variant switcher (klawisze 1/2) — usunięty, jeden finalny wariant
- [x] Nawigacja — uproszczona do Kempingowe / Transportowe / Kontakt (brak niespójności)
- [x] Sekcja "Dlaczego my" z niespójną nazwą — zastąpiona QuickHighlight bez hash `#dlaczego-my`
- [x] Sitemap zgodny z aktualnymi `id` sekcji (kempingowe / transportowe / kontakt / polityka-prywatnosci)

### 🔵 Testy runda 3 — bugi naprawione
- [x] **`<main>` landmark** — `PageWrapper` (div) → `MainContent` (main); `PrivacyPolicy` `Wrapper` z `main` → `div` (no nested main). WCAG 2.1 landmark fix.
- [x] **Mobile menu exit animation** — `AnimatePresence` + `exit={{ opacity: 0, y: -10 }}` + `transition: 0.2s` (było instant disappear)
- [x] **Formularz reset po submit** — `setFormName/Phone/Message('')` po `window.location.href = mailto`
- [x] **FooterCredit kontrast WCAG AA** — `#64748b` na `#0f172a` = 3.75:1 (fail) → `#94a3b8` = 6.96:1 ✅

### ⚫ Kod/a11y — batch finalny
- [x] **`Logo` keyboard a11y** — `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) + `aria-label`
- [x] **Dead CSS** — `scroll-margin-top: 1rem` usunięty z CampingSection / TransportSection / ContactSection (GlobalStyle `section[id]` miał wyższy specificity i tak wygrywał — te wartości nigdy nie działały)
- [x] **MobileNavLink hover** — dodany `color: #0066ff` na hover (brak był luką UX)
- [x] **`:focus` → `:focus-visible`** w FormInput / FormTextarea — border-highlight tylko przy nawigacji klawiaturą, nie przy kliknięciu myszą
- [x] **`<p>` wewnątrz `<ul>`** w PrivacyPolicy — zamienione na `<li>` (invalid HTML, przeglądarki auto-wyrzucały `<p>` poza listę)
- [x] **Niewidoczne spacery `‍`** w PrivacyPolicy §7 — dwa `<P>‍</P>` usunięte
- [x] **5 dead styled components** w PrivacyPolicy — `Lead`, `ContactCard`, `ContactRow`, `ContactKey`, `ContactVal` usunięte (relikty po usuniętej sekcji kontaktowej w polityce)

### 🧪 Testy (CLI)
- [x] `tsc --noEmit` czysto
- [x] `vite build` 408 kB JS / gzip 130 kB, ~2s
- [x] 0 `console.log`, `debugger`, `TODO`, `FIXME`
- [x] 0 `dangerouslySetInnerHTML` / `eval` / `innerHTML`
- [x] 0 sekretów w repo
- [x] 0 artefaktów Gemini/GenAI
- [x] 0 placeholderów telefonu/email w bundle
- [x] 15/15 obrazków trailer zwraca 200

---

## ⏸️ Zablokowane — czekam na decyzję/dane klienta

- [ ] **Formularz mailto → Formspree/Make** — `mailto:` działa tymczasowo. Opcje:
  - Formspree (darmowy plan 50 zgłoszeń/mies., 5 min setup)
  - Make scenario (masz MCP, webhook → email/Slack/arkusz)
- [ ] **OG image 1200×630** — teraz `T1.jpg` cropowany. Dedykowana grafika lepsza dla FB/WhatsApp.
- [ ] **Regulamin wynajmu** — można dorobić podstronę (szablon: `PrivacyPolicy.tsx`) gdy Rafał da treść.

---

## 🙋 Wymaga ręcznego testu w przeglądarce (przed mergem)

- [ ] Formularz — klik "Wyślij Wiadomość" → otwiera klienta pocztowego z prefillem
- [ ] Telefony — klik `+48 509 146 666` w sekcji kontakt + "Zadzwoń" w 4 kartach
- [ ] Mobile menu — hamburger open/close, scroll do sekcji
- [ ] Hash routing — klik "Polityka Prywatności" → osobny widok, "Wróć" → powrót
- [ ] Cookie consent — baner przy pierwszej wizycie
- [ ] Responsive: 360 / 640 / 768 / 1024 px
- [ ] Galeria Tabbert — 6 miniatur w jednym rzędzie (ThumbGrid adaptive)
- [ ] Smooth scroll i scroll-margin — nav linki, 5rem bufor pod header

---

## 📦 Merge

```
git checkout main && git merge fix/pre-handoff-blockers --no-ff
```
Uruchomić **po** akceptacji testów w przeglądarce.

---

## 📊 Metryki build

| Metryka | Start | Teraz | Delta |
|---|---|---|---|
| Bundle JS (gzip) | 110 kB | 131 kB | +20 kB (styled-components, motion, form state) |
| `index.html` (gzip) | 0.32 kB | 0.80 kB | +0.48 kB (meta + OG + font links) |
| `dist/` total | 2.12 MB | 1.8 MB | -300 kB (Hobby usunięte) |
| Deps w node_modules | ~440 | ~313 | -127 |
| TypeScript errors | ? | 0 | — |
| npm audit vulns | ? | 0 | — |

---

## 📚 Referencje

- `TESTING.md` — pełny raport testów sprzed rozpoczęcia prac (nie commitowany)
- `src/components/PrivacyPolicy.tsx` — szablon dla ewentualnego regulaminu
- `src/components/CookieConsent.tsx` — baner zgody (zaimplementowany)
- `src/data/trailers.ts` — dane floty (Tabbert, Lunar, Laweta, Motocyklowa)

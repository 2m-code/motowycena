# Raport testów — runda 3

**Data:** 2026-04-24 · **Branch:** `fix/pre-handoff-blockers` · **Commit po naprawach:** TBD

---

## 1. Testy automatyczne (CLI)

| Check | Wynik |
|---|---|
| `tsc --noEmit` | ✅ 0 błędów |
| `vite build` | ✅ 408 kB / gzip 130 kB, ~1.5s |
| `npm audit` | ✅ 0 podatności |
| HTTP `/` | ✅ 200 |
| HTTP `/robots.txt` | ✅ 200 |
| HTTP `/sitemap.xml` | ✅ 200 |
| HTTP `/favicon.svg` | ✅ 200 |
| Obrazki 15/15 (`T1–T6`, `lunar1–5`, `L1–L2`, `P1–P2`) | ✅ wszystkie 200 |
| Telefony w bundle | ✅ 1 unikalny: `tel:+48509146666` |
| Maile w bundle | ✅ 1 unikalny: `biuro@motowycena.pl` |
| Placeholdery tel w bundle (`48123456789`) | ✅ brak |
| Dead `href="#"` w bundle | ✅ brak |
| Artefakty Gemini/GenAI | ✅ brak |
| `console.log` w `src/` | ✅ brak (6 w bundlu pochodzi z motion framework) |
| `dangerouslySetInnerHTML` w `src/` | ✅ brak (w bundlu z React/SC internals) |
| `innerHTML` / `eval` w `src/` | ✅ brak |
| Sekrety (`api_key`, `sk-`, `gho_`, `AIza`) | ✅ brak |
| `TODO` / `FIXME` / `HACK` w `src/` | ✅ brak |
| `target="_blank"` bez `rel` | ✅ brak (jedyny link 2mcode.pl ma `noopener noreferrer`) |
| `<img>` bez `alt` | ✅ brak |
| `<button>` bez `type` | ✅ brak |
| `dist/` total | ✅ 1.8 MB |

---

## 2. Bugi znalezione i naprawione w tej rundzie

### 🔴 B1 — Brak `<main>` landmark (WCAG 2.1 fail)
`src/App.tsx` — `PageWrapper` był `styled.div`, brak semantycznego `<main>`. Screen readery nie mogły przejść do głównej treści przez landmark navigation (skrót `Alt+1`/`<main>`).

**Naprawione:** dodany `MainContent = styled.main` wrapping całej treści między `<header>` a `<footer>`. `PrivacyPolicy` wrapper zmieniony z `styled.main` na `styled.div` (unikniecie nested `<main>`).

---

### 🟠 B2 — Mobile menu brak exit animation
`src/App.tsx:200–216` — `MobileMenu = styled(motion.div)` miał `initial`/`animate` ale brak `AnimatePresence` + `exit`. Zamknięcie hamburger menu = natychmiastowe zniknięcie zamiast 200ms fade out w górę.

**Naprawione:** dodany `AnimatePresence` (import rozszerzony) + `exit={{ opacity: 0, y: -10 }}` + `transition={{ duration: 0.2 }}`.

---

### 🟡 B3 — Formularz nie resetuje pól po submit
`src/App.tsx:98–111` — `handleContactSubmit` otwierał klienta pocztowego przez `window.location.href = mailto` ale nie czyścił state'u formularza. Po zamknięciu klienta pocztowego i powrocie na stronę, pola `Imię`, `Telefon`, `O co pytasz?` nadal miały stare wartości.

**Naprawione:** dodane `setFormName('')`, `setFormPhone('')`, `setFormMessage('')` bezpośrednio po `window.location.href`.

---

### 🟡 B4 — `FooterCredit` kontrast WCAG AA fail
`src/App.tsx` — `FooterCredit` używał `color: #64748b` na tle `#0f172a` = kontrast ~3.75:1 (wymóg 4.5:1 dla normalnego tekstu 11px). Jednoznaczny fail WCAG 1.4.3.

**Naprawione:** zmienione `#64748b` → `#94a3b8` (kontrast ~6.96:1 ✅).

---

## 3. Znaleziska nie-krytyczne (nie naprawione, wymaga decyzji)

### 🔵 N1 — `theme.ts` kolory nieużywane
`src/styles/theme.ts` — `theme.colors.*` (forest, clay, sand itd.) są zdefiniowane i przekazywane przez `ThemeProvider` ale żaden styled-component nie korzysta z `${({ theme }) => theme.colors.xxx}`. Wszędzie hardcoded hex. `ThemeProvider` pełni rolę tylko dla potencjalnej przyszłości.

**Decyzja:** zostawić — nie psuje, zmiana wymagałaby refactoru całego App.tsx.

### 🔵 N2 — Placeholder kontrast (akceptowalny)
FormInput/FormTextarea `::placeholder` kolor `#64748b` na tle `#1e293b` = ~3.07:1.  
WCAG exception: placeholder jest "inactive UI component" gdy `<label>` istnieje (a istnieje). Technicznie borderline, w praktyce akceptowalne dla wypełnialnych pól z etykietami.

### 🔵 N3 — Google Font `<link rel="stylesheet">` render-blocking
Plik CSS fontów z Google Fonts jest zasobem blokującym renderowanie. Już mamy `preconnect` + `display=swap` w URL — tekst jest wyświetlany fallback fontem od razu. Pełny fix: `media="print" onload="this.media='all'"` trick. Niska priorytetowość — `display=swap` minimalizuje impact.

---

## 4. Obszary nieprzetestowane (wymagają przeglądarki)

| Obszar | Status | Uwaga |
|---|---|---|
| Formularz mailto → klient pocztowy | ⚠️ | Tylko CLI — wymaga ręcznego kliknięcia |
| Telefon click-to-call | ⚠️ | Sprawdź na mobile |
| Mobile menu animacja (otwieranie/zamykanie) | ⚠️ | Teraz ma exit animation — przetestuj |
| Cookie consent baner | ⚠️ | localStorage — wyczyść i sprawdź |
| Polityka Prywatności hash routing | ⚠️ | Klik footer link → view zmiana |
| Responsive breakpoints 360/640/768/1024 | ⚠️ | DevTools |
| Keyboard navigation (Tab, Enter, Space) | ⚠️ | Logo, nav linki, hamburger, formularz |
| Screen reader landmark navigation | ⚠️ | `<main>` dodany — sprawdź VoiceOver/NVDA |
| Galeria Tabbert 6 miniatur w rzędzie | ⚠️ | ThumbGrid adaptive |
| Smooth scroll + scroll-margin 5rem | ⚠️ | Nav linki przy otwartym headerze |
| Color contrast WCAG AA manual | ⚠️ | Axe DevTools lub Lighthouse |
| Lighthouse / PageSpeed score | ⚠️ | Wymaga browsera |

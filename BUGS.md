# BUGS — eprzyczepy.eu
> Audyt 4 rund × 20 sprintów = 80 sprintów · 1 maja 2026
> Branch naprawczy: `fix/bugs-audit`

---

## 🔴 BLOKERY (napraw przed release)

### B01 — Brak scroll-margin-top na sekcjach nawigacyjnych
**Plik:** `src/App.tsx` — `CampingSection`, `TransportSection`, `ContactSection`
**Potwierdzone:** Rundy 1, 2, 3, 4 — najczęściej pojawiający się bug
**Objaw:** Kliknięcie "Kempingowe / Transportowe / Kontakt" w nav scrolluje stronę, ale sticky header (105–121px) przykrywa ~25px początku sekcji. "Skontaktuj Się" w hero ląduje 606px od góry zamiast ~130px.
**Fix:**
```css
/* Dodać do CampingSection, TransportSection, ContactSection */
scroll-margin-top: 130px;
```

### B02 — CORS bez ograniczenia origin (spam relay)
**Plik:** `server.ts` linia 15
**Objaw:** `app.use(cors())` = `Access-Control-Allow-Origin: *` — każda obca strona może POSTować do `/api/contact` i wysyłać maile przez wasz serwer.
**Fix:**
```ts
app.use(cors({ origin: ['https://www.eprzyczepy.eu', 'https://eprzyczepy.eu'] }));
```

---

## 🟡 WAŻNE

### B03 — Touch target za mały: hamburger menu 40×40px
**Plik:** `src/App.tsx` — `MobileMenuButton`
**Fix:** Zmienić `padding: 0.5rem` → `padding: 0.625rem` (daje 44px)

### B04 — Touch target za mały: przycisk X w cookie bannerze 32×32px
**Plik:** `src/components/CookieConsent.tsx` — `CloseBtn`
**Fix:** `width: 2.75rem; height: 2.75rem;`

### B05 — Touch target za mały: checkbox RODO 16×16px
**Plik:** `src/App.tsx` — `ConsentCheckbox`
**Fix:** Wrapper z `min-height: 44px` i `align-items: center`, lub powiększyć obszar klikalny przez label

### B06 — Touch target za mały: przyciski cookie consent 42×42px (brakuje 2px)
**Plik:** `src/components/CookieConsent.tsx` — `RejectBtn`, `AcceptBtn` — `baseBtn`
**Fix:** `padding: 0.875rem 1.25rem` zamiast `0.75rem`

### B07 — Touch target za mały: linki w stopce 14px wysokości
**Plik:** `src/App.tsx` — `FooterLink`, `FooterCreditBrand`
**Fix:** `padding: 0.5rem 0;`

### B08 — Walidacja telefonu: brak sprawdzenia formatu
**Plik:** `src/App.tsx` — `handleContactSubmit` + `FormInput[type="tel"]`
**Objaw:** Można wpisać "aaaa" — HTML5 `type="tel"` nie waliduje formatu, serwer waliduje tylko długość ≥6 znaków.
**Fix:** Dodać do `handleContactSubmit` przed fetch:
```ts
const phoneClean = formPhone.trim().replace(/\s/g, '');
if (!/^\+?[\d\s\-()]{9,}$/.test(phoneClean)) {
  setFormErrorCode('invalid_input');
  setFormStatus('error');
  return;
}
```

### B09 — Same spacje w polach przechodzą HTML5 `required`
**Plik:** `src/App.tsx` — `handleContactSubmit`
**Objaw:** `"   "` przechodzi walidację przeglądarki, błąd dopiero na serwerze bez czytelnego komunikatu.
**Fix:** Przed fetch sprawdzić `formName.trim().length >= 2` i ustawić własny komunikat błędu.

### B10 — Brak focus trap w mobile menu
**Plik:** `src/App.tsx` — `MobileMenu`
**Objaw:** Tab w otwartym menu gubi fokus po 2. naciśnięciu — fokus wędruje poza menu.
**Fix:** Dodać `useEffect` zamykający menu na `resize >= 768px` + focus trap (cykl po linkach menu)

### B11 — aria-expanded nie syncuje się po resize do desktop
**Plik:** `src/App.tsx`
**Objaw:** Menu otwarte na mobile → resize → `aria-expanded=true` mimo ukrytego menu.
**Fix:**
```ts
useEffect(() => {
  const onResize = () => { if (window.innerWidth >= 768) setIsMenuOpen(false); };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```

### B12 — Brak X-Frame-Options header (clickjacking)
**Plik:** `server.ts`
**Fix:**
```ts
app.use((_, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

### B13 — Brak Content-Security-Policy header
**Plik:** `server.ts`
**Fix:** Dodać po B12 lub użyć `helmet`:
```ts
// npm install helmet
import helmet from 'helmet';
app.use(helmet());
```

### B14 — Google Fonts blokuje rendering (render-blocking CSS)
**Plik:** `index.html`
**Objaw:** Na 3G DOMContentLoaded = 30s bo przeglądarka czeka na zewnętrzny CSS.
**Fix:** Zamienić blokujący `<link rel="stylesheet">` na preload swap:
```html
<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"/>
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"/>
</noscript>
```

---

## 🔵 MINOR (można po release)

### B15 — Brak skip link + `<main>` bez id
**Plik:** `src/App.tsx`, `index.html`
**Fix:** Dodać przed `<HeaderBar>`:
```tsx
// GlobalStyle lub inline
<a href="#main-content" style={{
  position:'absolute', left:'-999px',
  ':focus': { left:0, zIndex:9999 }
}}>Przejdź do treści</a>
```
I `id="main-content"` na `MainContent`.

### B16 — `<nav>` bez aria-label
**Plik:** `src/App.tsx` — `DesktopNav`, `MobileMenu`
**Fix:** `<DesktopNav aria-label="Nawigacja główna">` i `<MobileMenu aria-label="Menu mobilne">`

### B17 — Wszystkie `<img>` bez atrybutów width/height (CLS)
**Plik:** `src/App.tsx` — `TrailerMainImg`, `ThumbImg`, `LogoImage`, `HeroBgImg`
**Objaw:** Przeglądarka nie zna rozmiarów przed załadowaniem → strona "skacze" (Cumulative Layout Shift).
**Fix:** Dodać `width` i `height` do styled img lub ustawić `aspect-ratio` w CSS.

### B18 — Brak `og:image:alt`
**Plik:** `index.html`
**Fix:** `<meta property="og:image:alt" content="Wypożyczalnia przyczep kempingowych i transportowych — EPRZYCZEPY.EU"/>`

### B19 — Brak `<link rel="preload">` dla hero image
**Plik:** `index.html`
**Fix:** `<link rel="preload" as="image" href="/trailers/T1.jpg"/>`

### B20 — Focus nie wraca na hamburger po Escape
**Plik:** `src/App.tsx`
**Fix:** W handlerze zamykającym menu (klawisz Escape / klik poza): `menuButtonRef.current?.focus()`

### B21 — Brak apple-touch-icon
**Plik:** `index.html`, `public/`
**Fix:** Wygenerować 180×180 PNG, dodać: `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`

### B22 — Brak favicon.ico fallback
**Plik:** `public/`
**Fix:** Dodać `public/favicon.ico` (32×32px)

### B23 — Brak `@media print` CSS
**Plik:** `src/App.tsx` lub global styles
**Fix:** Dodać do globalnych styli:
```css
@media print {
  header { position: static !important; }
  [role="dialog"] { display: none !important; }
}
```

### B24 — Link "Polityce Prywatności" w consent 36px (za niski touch target)
**Plik:** `src/App.tsx` — `ConsentLabel a`
**Fix:** `padding: 0.25rem 0` na link wewnątrz `ConsentLabel`

---

## ✅ Status po naprawie

- [ ] B01 scroll-margin-top
- [ ] B02 CORS origin
- [ ] B03 hamburger touch target
- [ ] B04 cookie X button
- [ ] B05 checkbox RODO
- [ ] B06 cookie buttons height
- [ ] B07 footer links height
- [ ] B08 phone validation
- [ ] B09 spaces in name
- [ ] B10 focus trap menu
- [ ] B11 aria-expanded resize
- [ ] B12 X-Frame-Options
- [ ] B13 CSP / helmet
- [ ] B14 Google Fonts preload
- [ ] B15 skip link
- [ ] B16 nav aria-label
- [ ] B17 img width/height
- [ ] B18 og:image:alt
- [ ] B19 preload hero img
- [ ] B20 focus restore escape
- [ ] B21 apple-touch-icon
- [ ] B22 favicon.ico
- [ ] B23 media print
- [ ] B24 consent link height

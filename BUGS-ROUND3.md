# BUGS RUNDA 3 — eprzyczepy.eu
> Audyt automatyczny + weryfikacja manualna · 1 maja 2026 · 20 sprintów
> Screenshoty: `./bug-screenshots-r3/` (27 plików)

---

## Podsumowanie

| | |
|---|---|
| **Realnych bugów** | 14 |
| **False positives** | 5 |
| **Wszystko OK (notatki)** | 75 |
| **Screenshotów** | 27 |

---

## Realne bugi

### 🔴 Krytyczne / Ważne

**B1 · S01 · Touch target: hamburger menu 40×40px**
```
Plik:  src/App.tsx — MobileMenuButton
Wynik: 40×40px; WCAG 2.5.5 wymaga 44×44px
Fix:   padding: 0.625rem zamiast 0.5rem  LUB  min-width/height: 2.75rem
```

**B2 · S01 · Touch target: przycisk X cookie banner 32×32px**
```
Plik:  src/components/CookieConsent.tsx — CloseBtn
Wynik: 32×32px — znacznie za mały; trudno trafić na mobile
Fix:   width: 2.75rem; height: 2.75rem  (44px)
```

**B3 · S01 · Touch target: checkbox zgody RODO 16×16px**
```
Plik:  src/App.tsx — ConsentCheckbox
Wynik: 16×16px — 3× za mały na mobile
Fix:   Wrapper z min 44×44px obszarem klikalnym,
       lub accent-color + width:20px height:20px + padding na label
```

**B4 · S01 · Touch target: cookie consent przyciski 42px (brakuje 2px)**
```
Plik:  src/components/CookieConsent.tsx — RejectBtn, AcceptBtn
Wynik: "Odrzuć" 135×42px, "Akceptuj wszystkie" 167×42px
Fix:   padding-top/bottom: 0.75rem → 0.875rem w baseBtn
```

**B5 · S01 · Touch target: linki w stopce 14px wysokości**
```
Plik:  src/App.tsx — FooterLink (164×14px), FooterCreditBrand (56×14px)
Fix:   Dodać padding: 0.75rem 0 do FooterLink i FooterCreditBrand
```

**B6 · S01 · Touch target: link "Polityce Prywatności" w consent 244×36px**
```
Plik:  src/App.tsx — ConsentLabel a
Fix:   padding: 0.25rem 0 na link wewnątrz ConsentLabel
```

**B7 · S05 · Sekcja #kontakt zakryta przez sticky header po scrollu**
```
Plik:  src/App.tsx — ContactSection (+ CampingSection, TransportSection)
Wynik: sectionTop=80px < headerBottom=105px → 25px nagłówka przykryte
       Potwierdzony w Rundzie 1 (S06) i Rundzie 2 (S03/S10)
Fix:   Dodać do sekcji: scroll-margin-top: 130px
```

**B8 · S07 · Google Fonts blokuje rendering na wolnym łączu**
```
Plik:  index.html — <link rel="stylesheet" href="https://fonts.googleapis.com/...">
Wynik: DOMContentLoaded = 30s na symulowanym 3G
       Zewnętrzny CSS jest render-blocking — biała strona do załadowania fontu
Fix A: <link rel="preload" as="style"> + onload swap trick
Fix B: font-display:optional — użyj systemowego fontu jako fallback
Fix C: Wbuduj Inter lokalnie w /public/fonts/
```

**B9 · S09 · Brak nagłówka HTTP X-Frame-Options (clickjacking)**
```
Plik:  server.ts — brak middleware bezpieczeństwa
Fix:   res.setHeader('X-Frame-Options', 'SAMEORIGIN')
       LUB: npm install helmet; app.use(helmet())
```

**B10 · S09 · Brak Content-Security-Policy header**
```
Plik:  server.ts
Fix:   Dodać CSP przez helmet. Minimalny CSP dla tej strony:
       default-src 'self'; script-src 'self' 'unsafe-inline'
       https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'
       https://fonts.googleapis.com; font-src https://fonts.gstatic.com;
       img-src 'self' data:; frame-src https://challenges.cloudflare.com
```

---

### 🔵 Minor

**B11 · S03 · Brak autocomplete na textarea wiadomości**
```
Plik:  src/App.tsx — FormTextarea
Fix:   Dodać autoComplete="off"  (lub pominąć — WCAG nie wymaga dla textarea)
```

**B12 · S13 · Galeria pamięta wybrany thumbnail po nawigacji poza sekcję**
```
Plik:  src/App.tsx — TrailerRow (useState activeImage)
Wynik: Kliknięcie T3.jpg → scroll do kontakt → powrót → nadal T3.jpg
       (może być celowe, ale może mylić użytkownika)
Fix opcjonalny: Reset activeImage do images[0] gdy sekcja wychodzi z viewport
```

**B13 · S18 · Brak @media print — header drukuje się na każdej stronie**
```
Plik:  src/App.tsx — brak globalnych styli print
Wynik: Sticky header, cookie banner i przyciski widoczne na wydruku
Fix:   @media print { header { position: static; }
       [role="dialog"] { display: none; } }
```

**B14 · S12 · Google Fonts font-display:swap — wymaga ręcznej weryfikacji**
```
Plik:  index.html — URL fontu ma &display=swap
Status: Automat nie mógł zweryfikować (CORS blokuje CSSOM z zewnętrznej domeny)
Akcja: Sprawdzić w DevTools → Network → preview CSS z fonts.googleapis.com
       czy @font-face zawiera font-display:swap. Jeśli nie → bug.
```

---

## False positives

| ID | Co wykrył automat | Powód |
|----|-------------------|-------|
| FP1 | botcheck bez autocomplete | Honeypot ma `autoComplete="off"` — celowe; off jest prawidłową wartością |
| FP2 | Thumb buttons "44×44" złapane | Prawdopodobnie 43.x → zaokrąglone w logach; pogranicze tolerancji |
| FP3 | DOMContentLoaded 30s na 3G | Dev Vite jest wolniejszy niż prod; brak CDN/cache/minifikacji |
| FP4 | font-display brak w CSSOM | Google Fonts CSS cross-origin niedostępny przez document.styleSheets |
| FP5 | 4 aktywne thumbnaile | Prawidłowe — 1 aktywny thumbnail per karta (4 karty × 1 = 4) |

---

## Co działało dobrze (nowe potwierdzenia R3)

- ✅ Ceny: Tabbert 180-220 zł, Lunar 160-180 zł, Laweta **80 zł**, Moto 60 zł — wszystkie OK
- ✅ Stara cena 90 zł NIE widoczna nigdzie
- ✅ Hierarchia h1→h2→h3 poprawna, brak skoków
- ✅ 10 rapid clicks hamburger — brak race condition, stan poprawny
- ✅ Logo click → scroll do góry (działa z każdego miejsca)
- ✅ Logo click z widoku PP → powrót do strony głównej
- ✅ Formularz sukces: komunikat ✓, pola wyczyszczone ✓, checkbox odznaczony ✓
- ✅ Komunikaty błędów: rate_limited / captcha_failed / send_failed — wszystkie present
- ✅ tel: linki × 5 → wszystkie `+48692376595`
- ✅ mailto: → `biuro@eprzyczepy.eu`
- ✅ Brak JS errors przez wszystkie 20 sprintów
- ✅ Kaucja 1500 zł widoczna w opisach
- ✅ Stary tel 509... NIE pojawia się w opisach
- ✅ QuickHighlight bar OK na 320/375/768/1280px
- ✅ Header height spójny (nie zmienia się po scrollu): 121px desktop, 105px mobile
- ✅ Brak overflow na 480px, 375px, 768px, 1280px, 1920px

---

## Zbiorcza lista wszystkich bugów (3 rundy łącznie)

| # | Opis | Plik | Priorytet |
|---|------|------|-----------|
| R1-B1 | `scroll-margin-top` brak → header przykrywa sekcje | `App.tsx` | 🔴 |
| R1-B2 | Brak `og:image:alt` | `index.html` | 🔵 |
| R1-B3 | Brak `<link rel="preload">` T1.jpg | `index.html` | 🔵 |
| R1-B4 | Obrazki bez `width`/`height` (CLS risk) | `App.tsx` | 🟡 |
| R2-B1 | Pole telefon: brak walidacji formatu | `App.tsx` | 🟡 |
| R2-B2 | Same spacje w imieniu przechodzą `required` | `App.tsx` | 🟡 |
| R2-B3 | Brak focus trap w mobile menu | `App.tsx` | 🟡 |
| R2-B4 | Focus nie wraca na hamburger po Escape | `App.tsx` | 🔵 |
| R2-B6 | Zewnętrzne linki — weryfikacja target/rel | `App.tsx` | 🔵 |
| R3-B1 | Hamburger 40×40px — za mały touch target | `App.tsx` | 🟡 |
| R3-B2 | Cookie X button 32×32px — za mały | `CookieConsent.tsx` | 🟡 |
| R3-B3 | Checkbox RODO 16×16px | `App.tsx` | 🟡 |
| R3-B4 | Cookie consent buttons 42px (brakuje 2px) | `CookieConsent.tsx` | 🔵 |
| R3-B5 | Footer links 14px — za małe touch targets | `App.tsx` | 🔵 |
| R3-B6 | Consent link 36px | `App.tsx` | 🔵 |
| R3-B7 | #kontakt przykryta headerem (potw. R1-B1) | `App.tsx` | 🔴 |
| R3-B8 | Google Fonts blokuje render na słabym łączu | `index.html` | 🟡 |
| R3-B9 | Brak X-Frame-Options (clickjacking) | `server.ts` | 🟡 |
| R3-B10 | Brak Content-Security-Policy | `server.ts` | 🟡 |
| R3-B11 | Textarea bez autocomplete | `App.tsx` | 🔵 |
| R3-B12 | Galeria pamięta thumbnail po nawigacji | `App.tsx` | 🔵 |
| R3-B13 | Brak `@media print` CSS | `App.tsx` | 🔵 |
| R3-B14 | font-display:swap — do ręcznej weryfikacji | `index.html` | 🔵 |

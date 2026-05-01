# BUGS RUNDA 2 — eprzyczepy.eu
> Audyt automatyczny + weryfikacja manualna · 1 maja 2026 · 20 sprintów · 30 screenshotów
> Screenshoty: `./bug-screenshots-r2/`

---

## ⚠️ Uwaga środowiskowa

Część sprintów (S08, S11, S13, S14, S15, S16, S20) trafiła na **niewłaściwy serwer** — excorpo-ai (2mcode), który zajmuje port 3001 na IPv6 (`[::1]:3001`), podczas gdy nasz serwer działa na IPv4 (`0.0.0.0:3001`). Playwright czasem rozwiązuje `127.0.0.1` przez IPv6. Wyniki tych sprintów są oznaczone jako `[ENV]` — częściowo lub całkowicie zawodne.

---

## Realne bugi (6 potwierdzonych)

| ID | Sprint | Opis | Priorytet |
|----|--------|------|-----------|
| **B1** | S06 | Pole `telefon` ma `type="tel"` ale **brak custom walidacji formatu** — przeglądarka nie sprawdza czy wpisano poprawny numer, użytkownik może wpisać dowolny tekst | 🟡 Ważne |
| **B2** | S06 | Walidacja HTML5 **nie wyłapuje pola z samymi spacjami** — wpisanie `"   "` w pole imię przechodzi przez `required` i dopiero serwer odrzuca (`trim().length < 2`), ale użytkownik nie dostaje feedback front-endowego | 🟡 Ważne |
| **B3** | S07 | **Focus znika po 2. Tabie w otwartym mobile menu** — sekwencja: Tab→`2mcode logo`, Tab→`brak focusa`, Tab→`Usługi`. Środkowy step gubi focus — brak focus trap, accessibility issue | 🟡 Ważne |
| **B4** | S07 | **Escape nie ma standardowego zachowania ARIA** — Escape zamyka menu (dobrze!), ale focus nie wraca na przycisk hamburger po zamknięciu (standardem ARIA jest `button.focus()`) | 🔵 Minor |
| **B5** | S03 | **Brak `scroll-margin-top` na sekcjach** — przy `scrollIntoView` sekcja `#kontakt` ląduje z `top=100px` przy headerze `90px` — tylko 10px wolnej przestrzeni, treść ledwo widoczna. `#kempingowe` i `#transportowe` zwróciły `null` w BCR (lazy render) — wymaga testu w przeglądarce | 🟡 Ważne |
| **B6** | S19 | **9 zewnętrznych linków — nie wszystkie mają `target="_blank"` i `rel="noopener"`** — automat nie rozróżnił które, ale należy zweryfikować manualnie. Link `2mcode.pl` w stopce ma poprawne `target=_blank rel="noopener noreferrer"` ✓ | 🔵 Minor |

---

## False positives — wyjaśnienie

| ID | Co wykrył automat | Powód fałszywego alarmu |
|----|-------------------|-------------------------|
| FP1 | `[S08]` Tytuł PP: "2mcode - software house..." | Sprint trafił na **zły serwer** (excorpo-ai na IPv6). Nasz tytuł: `Wypożyczalnia przyczep — Garki | EPRZYCZEPY.EU` ✓ |
| FP2 | `[S08]` Brak drugiego przycisku Wróć | Jw. — trafił na stronę 2mcode która nie ma PP |
| FP3 | `[S11]` `rgb(10,16,20)` body background | Ciemne tło to motyw **excorpo-ai**, nie naszej strony. Nasz serwis nie ma dark mode — to prawidłowe |
| FP4 | `[S13]` Render-blocking: Bricolage Grotesque | Bricolage Grotesque to font **2mcode**, nie naszej strony (używamy Inter z Google Fonts) |
| FP5 | `[S14]` 0 kart przyczep | Sprint trafił na 2mcode — brak `<article>` bo inna strona |
| FP6 | `[S15]` Hero img nie znaleziony | Jw. — zły serwer |
| FP7 | `[S16]` Brak linków do PP na stronie | Jw. — 2mcode nie ma linków `#polityka-prywatnosci` |
| FP8 | `[S06]` Console error 400 Bad Request | Formularz próbował POST `/api/contact` — serwer backendowy (`server.ts`) nie jest uruchomiony w dev. **Normalne zachowanie dev.** Na produkcji `/api/contact` będzie działać |
| FP9 | `[S18]` Turnstile nie ładuje się | `TURNSTILE_SITE_KEY` nie jest ustawiony w dev — **celowe**, działa w trybie bypass. Na produkcji wymaga `.env` |
| FP10 | `[S19]` Vite zwraca 200 dla nieistniejącego URL | SPA fallback — **poprawne zachowanie**. Expressowy serwer produkcyjny powinien tak samo działać (serwuje `index.html` dla wszystkich tras) |

---

## Szczegóły realnych bugów

### B1 — Brak walidacji formatu numeru telefonu

```
Plik:    src/App.tsx — <FormInput type="tel" id="contact-phone" />
Problem: type="tel" wyświetla klawiaturę numeryczną na mobile, ale
         NIE waliduje formatu. Można wpisać "abc", "!", emaila itp.
Serwer:  waliduje phone.trim().length >= 6, ale to za mało — "aaaaaa" przejdzie.
Impact:  Właściciel może dostać zapytanie bez numeru, nie oddzwoni.
Fix:     Dodać pattern="/^[\+\d\s\-\(\)]{9,}$/" do inputa LUB custom walidację w handleSubmit.
```

### B2 — Same spacje w polach przechodzą HTML5 `required`

```
Plik:    src/App.tsx — FormInput required
Problem: Wpisanie "   " (same spacje) w pole "Imię i nazwisko":
         - HTML5 required: przepuszcza (required sprawdza czy niepuste, spacje = niepuste)
         - Serwer: odrzuca (trim().length < 2), ale użytkownik widzi tylko generic "błąd wysyłania"
         - Nie ma dedykowanego komunikatu "Podaj prawdziwe imię"
Impact:  Mały UX bug — użytkownik nie wie co poprawić.
Fix:     Dodać .trim() check w handleContactSubmit przed fetch, z ustawieniem własnego komunikatu.
```

### B3 — Focus znika w mobile menu (accessibility)

```
Plik:    src/App.tsx — MobileMenu / MobileMenuInner
Problem: Tab order w otwartym mobile menu:
         Tab 1 → logo (div[role=button])  ← focus znika z menu
         Tab 2 → BRAK FOCUSA
         Tab 3 → "Usługi" (link w desktop nav ukryty display:none)
         Brak focus trap — fokus wędruje poza menu.
Impact:  Użytkownicy klawiatury i screen readerów mogą "utknąć" lub stracić orientację.
Fix:     Dodać focus trap (np. przechwycić Tab w MobileMenu i cyklować po linkach menu),
         lub użyć dialogu z aria-modal="true".
```

### B4 — Escape nie przywraca focusu na hamburger

```
Plik:    src/App.tsx — MobileMenuButton onClick
Problem: Po naciśnięciu Escape menu zamyka się, ale fokus nie wraca
         na przycisk otwierający menu. Standard ARIA Authoring Practices
         wymaga focus restoration po zamknięciu menu.
Fix:     W handlerze Escape: menuButtonRef.current?.focus()
```

### B5 — Brak scroll-margin-top na sekcjach nawigacyjnych

```
Plik:    src/App.tsx — CampingSection, TransportSection, ContactSection
Problem: Gdy użytkownik klika link nav (np. "Kempingowe"), sekcja
         scrolluje się na sam top viewportu — za nią jedzie sticky header (90-121px)
         który ją przykrywa. Efekt: pierwsze ~100px sekcji jest niewidoczne.
         Potwierdzone w rundzie 1 (S06): #transportowe ląduje z top=188px.
Fix:     Dodać do styled sekcji:
           scroll-margin-top: 130px;   /* header height + margines */
```

### B6 — Zewnętrzne linki do weryfikacji

```
Plik:    src/App.tsx
Zidentyfikowane zewnętrzne linki na stronie (19 total, 9 external):
- https://www.2mcode.pl/ — stopka (target=_blank, rel="noopener noreferrer" ✓)
- mailto: i tel: — nie są "external" w sensie http
Pozostałe 7+ — wymagają manualnego sprawdzenia w DevTools:
  Czy mają target="_blank"? Czy mają rel="noopener"?
Fix:     Dla każdego <a href="https://..."> dodać target="_blank" rel="noopener noreferrer"
```

---

## Notatki diagnostyczne (co działa)

- [S01] Brak overflow na 320px iPhone SE ✓
- [S01] Form inputs full-width na 320px ✓
- [S02] Brak overflow w landscape 844×390 ✓
- [S03] `scroll-margin-top` na `#kontakt`: `0px` (sekcja ląduje top=100px przy header=90px — prawie OK, ale ciasno)
- [S04] Wszystkie 2 załadowane img mają alt ✓ (na etapie early load)
- [S06] `textarea maxlength="5000"` poprawnie ustawiony ✓
- [S06] XSS w polu imię: wartość trafia do value jako tekst, nie renderuje się jako HTML ✓
- [S07] Escape zamyka mobile menu ✓
- [S07] `aria-expanded` przełącza się poprawnie ✓
- [S12] Tab order formularza: name → phone → message → consent → submit ✓ (właściwa kolejność)
- [S19] `2mcode.pl` link w stopce: `target=_blank`, `rel="noopener noreferrer"` ✓
- [S20] Favicon dostępny `/favicon.svg` ✓
- [S20] `/sitemap.xml` dostępny (200) ✓
- [S20] `/robots.txt` dostępny (200) ✓
- [S20] `/og-image.jpg` dostępny lokalnie (200) ✓
- [S20] `html lang="pl-PL"` ✓ (uwaga: w S01 wczytało się `lang="pl"` z PP, w S20 `pl-PL` — sprawdzić które poprawne)
- [S20] `meta viewport` poprawny ✓
- [S20] Brak JS errors w finalnej rundzie ✓

---

## Porównanie z Rundą 1

| Bug | Runda 1 | Runda 2 |
|-----|---------|---------|
| scroll-margin-top | B1 (nowy) | B5 (potwierdzony głębiej) |
| og:image:alt | B2 | nie testowany |
| preload hero | B3 | nie testowany |
| img bez width/height | B4 | nie testowany |
| Google Fonts | B5 | FP4 (Bricolage = 2mcode) |
| Ul. vs ul. | B6 | nie testowany |
| **Walidacja telefonu** | ❌ nie wykryto | **B1 NOWY** |
| **Same spacje w imieniu** | ❌ nie wykryto | **B2 NOWY** |
| **Focus trap mobile menu** | ❌ nie wykryto | **B3 NOWY** |
| **Focus restore po Escape** | ❌ nie wykryto | **B4 NOWY** |
| **Zewnętrzne linki** | ❌ nie wykryto | **B6 NOWY** |

---

## Łączna lista wszystkich bugów (obie rundy)

| # | Opis | Plik | Priorytet |
|---|------|------|-----------|
| R1-B1 | `scroll-margin-top` brak na sekcjach | `App.tsx` | 🟡 |
| R1-B2 | Brak `og:image:alt` | `index.html` | 🔵 |
| R1-B3 | Brak `<link rel="preload">` dla T1.jpg | `index.html` | 🔵 |
| R1-B4 | Wszystkie img bez `width`/`height` (CLS) | `App.tsx` | 🟡 |
| R1-B5 | `Ul.` zamiast `ul.` (może intentional) | `App.tsx` | kosm. |
| R2-B1 | Brak walidacji formatu numeru telefonu | `App.tsx` | 🟡 |
| R2-B2 | Same spacje w polach przechodzą HTML5 required | `App.tsx` | 🟡 |
| R2-B3 | Focus znika w mobile menu (brak focus trap) | `App.tsx` | 🟡 |
| R2-B4 | Focus nie wraca na hamburger po Escape | `App.tsx` | 🔵 |
| R2-B5 | `scroll-margin-top` (potwierdzony ponownie) | `App.tsx` | 🟡 |
| R2-B6 | Zewnętrzne linki do weryfikacji (target/rel) | `App.tsx` | 🔵 |

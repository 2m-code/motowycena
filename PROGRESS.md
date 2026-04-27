# Progress — przygotowanie strony do oddania klientowi

**Branch:** `main`
**Ostatnia aktualizacja:** 2026-04-26
**Commity:** 10 (`029796c` → `91ba5d4`) + batch poprawek klienta 2026-04-26

---

## 🔁 Batch poprawek od klienta (2026-04-26)

**Bezpieczne zmiany — zrobione:**
- ✅ Laweta: `Wycena indywidualna` → `80 zł / doba` (`trailers.ts`)
- ✅ Email wszędzie w UI: `biuro@motowycena.pl` → `biuro@eprzyczepy.eu`
- ✅ Telefon wszędzie w UI: `+48 509 146 666` → `+48 692 376 595`
- ✅ Adres publiczny: `Ul. Spacerowa 10, 63-430 Garki` → `Ul. Spacerowa, 63-430 Garki`
- ✅ Brand top-left + footer + copyright: `Motowycena Rafał Pelczar` → `EPRZYCZEPY.EU`
- ✅ Hero subtitle — nowa kopia 1:1: "Wynajmujemy komfortowe przyczepy kempingowe znanych marek takich jak Tabbert, Lunar, Dethleffs."
- ✅ `metadata.json` name → `EPRZYCZEPY.EU`

**Czeka na decyzję klienta (NIE ruszone):**
- 🔲 **Formularz kontaktowy** — klient chce wysyłkę bezpośrednio, nie `mailto:`. Strona statyczna (GH Pages) — wymaga zewnętrznej usługi (Formspree free 50/mies., Web3Forms, EmailJS). Decyzja: która usługa + endpoint.
- 🔲 **Domena nowa (eprzyczepy.eu?)** — `index.html` ma `canonical`, `og:url`, JSON-LD `url` z `https://www.motowycena.pl/`. Po decyzji aktualizujemy SEO + JSON-LD `streetAddress` i `email`/`telephone`.
- 🔲 **Privacy Policy** — pełno odwołań do `motowycena.pl` i `MOTOWYCENA RAFAŁ PELCZAR ul.Spacerowa 10`. To dokument prawny — lepiej nie ruszać bez wyraźnej zgody klienta (Administrator to nazwa firmy w CEIDG).

---

## ✅ ZROBIONE — wszystko poniżej jest w repo

~~**P0 kontakt** — telefon, email, adres, formularz mailto, a11y pól, usunięty link "Regulamin"~~
~~**SEO** — `lang="pl"`, title, meta description, OG/Twitter tags, canonical, favicon SVG~~
~~**Czystka** — Hobby-*.jpg, orphan komponenty, deps Gemini/express, vite.config, .env.example, README~~
~~**Perf** — robots.txt, sitemap.xml, lazy-loading, fetchPriority hero, alt-teksty~~
~~**a11y/perf** — ThumbGrid adaptive, aria-labels galeria+hamburger, scroll-margin, smooth scroll, font preconnect~~
~~**P3 drobne** — hero variant switcher usunięty, nav uproszczona, sekcja dlaczego-my usunięta~~
~~**Kod/a11y batch** — Logo keyboard nav, dead CSS scroll-margin, MobileNavLink hover, :focus-visible, `<p>`→`<li>` w ul, dead styled components~~
~~**Bugi z testów** — `<main>` landmark, menu exit animation, formularz reset po submit, FooterCredit kontrast WCAG~~
~~**GitHub Pages preview** — `imgUrl()` na wszystkich `src` zdjęć, Vite base `/przyczepy.pl/`, deploy na `2m-code.github.io/przyczepy.pl/`~~

**Metryki po wszystkim:** 0 TS errors · 0 vulns · 130 kB gzip · 1.8 MB dist · 15/15 obrazków 200

---

## 🔲 ZOSTAŁO — czeka na decyzję / ręczny test

### ⏸️ Blokowane przez klienta

- [ ] **Formularz → Formspree/Make** — `mailto:` działa ale nie dostaniesz maila jeśli user nie otworzy klienta pocztowego. 5 min fix: Formspree free (50/mies.) lub Make webhook
- [x] ~~**OG image 1200×630** — `public/og-image.jpg` wygenerowany skryptem (`scripts/generate-og.mjs`), `index.html` zaktualizowany~~
- [ ] **Regulamin wynajmu** — szablon gotowy (`PrivacyPolicy.tsx`), potrzebna treść od Rafała

### 🙋 Ręczne testy w przeglądarce (przed mergem)

- [ ] Formularz — "Wyślij Wiadomość" → otwiera klienta pocztowego z prefillem, pola czyszczą się po kliknięciu
- [ ] Telefony — klik `+48 509 146 666` w kontakcie + "Zadzwoń" w każdej z 4 kart
- [ ] Mobile menu — hamburger open (fade in) / close (fade out), klik link → zamknięcie + scroll
- [ ] Hash routing — "Polityka Prywatności" w stopce → osobny widok, "Wróć" → powrót na stronę
- [ ] Cookie consent — baner przy pierwszej wizycie, localStorage po accept/reject
- [ ] Responsive: 360 / 640 / 768 / 1024 px
- [ ] Galeria Tabbert — 6 miniatur w jednym rzędzie
- [ ] Smooth scroll + 5rem bufor pod fixed header

### 📦 Merge (po testach)

```
git checkout main && git merge fix/pre-handoff-blockers --no-ff
```

---

## 📊 Metryki

| | Start | Teraz |
|---|---|---|
| Bundle JS gzip | 110 kB | 131 kB |
| `dist/` total | 2.12 MB | 1.8 MB |
| Deps | ~440 | ~313 |
| TS errors | ? | **0** |
| npm vulns | ? | **0** |

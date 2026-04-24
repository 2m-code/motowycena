# Progress — przygotowanie strony do oddania klientowi

**Branch:** `fix/pre-handoff-blockers`
**Ostatnia aktualizacja:** 2026-04-24
**Commity:** 10 (`029796c` → `91ba5d4`)

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

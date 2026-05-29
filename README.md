# EPRZYCZEPY.EU — landing page

Strona wypożyczalni przyczep kempingowych i transportowych.

## Stack

- React 19 + TypeScript
- Vite 6
- styled-components
- motion (animacje)
- lucide-react (ikony)

## Uruchomienie lokalne

Wymagania: Node.js 18+.

```bash
npm install
npm run dev
```

Serwer dev startuje na `http://localhost:3000`.

## Pozostałe skrypty

- `npm run build` — build produkcyjny do `dist/`
- `npm run preview` — podgląd zbudowanej wersji
- `npm run lint` — sprawdzenie typów (`tsc --noEmit`)
- `npm run clean` — usunięcie `dist/`

## Panel admina

Panel jest dostępny pod adresem `/admin` po uruchomieniu serwera Express.

W produkcji ustaw w zmiennych środowiskowych:

```bash
ADMIN_PASSWORD="dlugie-bezpieczne-haslo"
ADMIN_SESSION_SECRET="dlugi-losowy-sekret-sesji"
```

Treści zapisują się w `data/site-content.json`, a zdjęcia wgrywane z panelu w katalogu `uploads/`. Na Cyberfolks aplikacja musi działać jako aplikacja Node/Express, nie jako sama statyczna paczka `dist`, bo panel zapisuje pliki na serwerze.

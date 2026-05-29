import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');
const releasesDir = join(root, 'release');
const preparedBy = 'Wykonawca';

process.on('uncaughtException', (err) => {
  console.error(err?.stack || err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error(err?.stack || err);
  process.exit(1);
});
process.on('exit', (code) => {
  if (code !== 0) console.error(`release script exited with code ${code}`);
});

function warsawDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const releaseDate = warsawDate();
const releaseName = `eprzyczepy.eu-${releaseDate}`;
const stagingDir = join(releasesDir, `.tmp-${releaseName}`);
const zipPath = join(releasesDir, `${releaseName}.zip`);

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
}

function runNodeScript(scriptPath, args) {
  run(process.execPath, [scriptPath, ...args]);
}

function runNpm(args, cwd) {
  const npmCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (existsSync(npmCli)) {
    run(process.execPath, [npmCli, ...args], { cwd });
    return;
  }
  run(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', ...args] : args, { cwd });
}

function cleanInsideRelease(target) {
  const resolved = resolve(target);
  const releaseRoot = resolve(releasesDir);
  if (!resolved.startsWith(releaseRoot)) {
    throw new Error(`Refusing to remove path outside release dir: ${resolved}`);
  }
  rmSync(resolved, { recursive: true, force: true });
}

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const from = join(src, entry);
    const to = join(dest, entry);
    if (statSync(from).isDirectory()) {
      copyTree(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

mkdirSync(releasesDir, { recursive: true });
cleanInsideRelease(stagingDir);
cleanInsideRelease(zipPath);
rmSync(join(root, '.release-server'), { recursive: true, force: true });

console.log('Building frontend...');
runNodeScript(join(root, 'node_modules', 'vite', 'bin', 'vite.js'), ['build']);
console.log('Building Node server...');
runNodeScript(join(root, 'node_modules', 'typescript', 'bin', 'tsc'), [
  'server.ts',
  '--target',
  'ES2022',
  '--module',
  'NodeNext',
  '--moduleResolution',
  'NodeNext',
  '--esModuleInterop',
  '--skipLibCheck',
  '--outDir',
  '.release-server',
]);
console.log('Creating clean release folder...');

mkdirSync(stagingDir, { recursive: true });
copyTree(join(root, 'dist'), join(stagingDir, 'dist'));
copyFileSync(join(root, '.release-server', 'server.js'), join(stagingDir, 'server.js'));
copyFileSync(join(root, '.env.example'), join(stagingDir, '.env.example'));

const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const releasePkg = {
  name: 'eprzyczepy-cyberfolks-release',
  private: true,
  version: `0.0.0-${releaseDate}`,
  type: 'module',
  main: 'server.js',
  scripts: {
    start: 'node server.js',
  },
  engines: {
    node: '>=18',
  },
  dependencies: {
    cors: rootPkg.dependencies.cors,
    dotenv: rootPkg.dependencies.dotenv,
    express: rootPkg.dependencies.express,
    'express-rate-limit': rootPkg.dependencies['express-rate-limit'],
    nodemailer: rootPkg.dependencies.nodemailer,
  },
};
writeFileSync(join(stagingDir, 'package.json'), `${JSON.stringify(releasePkg, null, 2)}\n`);
console.log('Creating production package-lock...');
runNpm(['install', '--package-lock-only', '--omit=dev', '--ignore-scripts'], stagingDir);

writeFileSync(join(stagingDir, 'CYBERFOLKS-DEPLOY.md'), `# EPRZYCZEPY.EU - release cyber_Folks

Release: ${releaseName}
Prepared by: ${preparedBy}
Date: ${releaseDate}

## Co jest w paczce

- \`dist/\` - zbudowany frontend React/Vite
- \`server.js\` - Node/Express: serwuje stronę i endpoint \`POST /api/contact\`
- \`package.json\` - tylko produkcyjne zależności backendu
- \`package-lock.json\` - zablokowane wersje zależności produkcyjnych
- \`.env.example\` - przykład zmiennych środowiskowych

## Wdrożenie w cyber_Folks

1. Rozpakuj zawartość ZIP-a do katalogu aplikacji Node.js na hostingu.
2. W panelu cyber_Folks / DirectAdmin utwórz aplikację Node.js.
3. Ustaw katalog aplikacji na folder z rozpakowaną paczką.
4. Ustaw plik startowy: \`server.js\` (w \`package.json\` jest też \`"main": "server.js"\`).
5. Zainstaluj zależności: \`npm ci --omit=dev\` albo w panelu kliknij \`Run NPM Install\`.
6. Ustaw zmienne środowiskowe z \`.env.example\`.
7. Uruchom/restartuj aplikację Node.js.

## Zmienne minimum

\`\`\`env
NODE_ENV=production
SMTP_HOST=serwer-z-panelu.cyberfolks.pl
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=biuro@eprzyczepy.eu
SMTP_PASS=HASLO_DO_SKRZYNKI_LUB_HASLO_APLIKACJI
MAIL_FROM=biuro@eprzyczepy.eu
MAIL_TO=biuro@eprzyczepy.eu
CORS_ORIGIN=https://www.eprzyczepy.eu,https://eprzyczepy.eu
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
\`\`\`

Jeśli panel sam ustawia port aplikacji Node.js, nie nadpisuj \`PORT\`. Lokalnie można ustawić np. \`PORT=3001\`.

## Test po wdrożeniu

- Strona główna: \`https://www.eprzyczepy.eu/\`
- Formularz: wyślij testowe zapytanie i sprawdź skrzynkę \`biuro@eprzyczepy.eu\`
- Social preview: po deployu odśwież podgląd linku w narzędziu Facebook Sharing Debugger / WhatsApp cache może odświeżać się z opóźnieniem
`);

const manifest = {
  project: 'EPRZYCZEPY.EU',
  target: 'cyber_Folks Node.js hosting',
  releaseName,
  releaseDate,
  preparedBy,
  startupFile: 'server.js',
  contents: ['dist/', 'server.js', 'package.json', 'package-lock.json', '.env.example', 'CYBERFOLKS-DEPLOY.md', 'release-manifest.json'],
};
writeFileSync(join(stagingDir, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

run('powershell.exe', [
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
  `Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPath}' -Force`,
]);

console.log('Cleaning temporary build files...');
rmSync(join(root, '.release-server'), { recursive: true, force: true });
cleanInsideRelease(stagingDir);

if (!existsSync(zipPath)) {
  throw new Error(`Release zip was not created: ${zipPath}`);
}

console.log(`Release ready: ${zipPath}`);

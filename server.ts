import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { DEFAULT_SITE_CONTENT, type SiteContent, type Trailer } from './src/data/siteContent.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'dist');
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const contentPath = path.join(dataDir, 'site-content.json');
const adminCookieName = 'eprzyczepy_admin';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '12mb' }));
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM,
  MAIL_TO,
  PORT,
  MAIL_SERVER_PORT,
  CORS_ORIGIN,
  TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY,
  ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET,
  SESSION_SECRET,
  NODE_ENV,
} = process.env;

const allowedOrigins = (CORS_ORIGIN ?? 'https://www.eprzyczepy.eu,https://eprzyczepy.eu,http://localhost:3000,http://localhost:3006')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const contactCors = cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('cors_not_allowed'));
  },
  methods: ['POST', 'OPTIONS'],
});

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !MAIL_TO) {
  console.warn('[mail] SMTP env vars missing — /api/contact will 500 until configured.');
}
if (!TURNSTILE_SECRET_KEY) {
  console.warn('[mail] TURNSTILE_SECRET_KEY missing — captcha verification disabled (dev only).');
}
if (!ADMIN_PASSWORD) {
  console.warn('[admin] ADMIN_PASSWORD missing — /admin login is disabled until configured.');
}
if (!ADMIN_SESSION_SECRET && !SESSION_SECRET && NODE_ENV === 'production') {
  console.warn('[admin] ADMIN_SESSION_SECRET or SESSION_SECRET should be set in production.');
}
const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT ?? 587),
  secure: SMTP_SECURE === 'true',
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

// Strip CR/LF/NUL — header injection guard for fields that flow into headers/subject.
const stripCtl = (s: string) => s.replace(/[\r\n\0]/g, ' ').trim();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Caps to bound persisted content (prevents authed user filling disk / breaking UI).
const MAX_TRAILERS_PER_SECTION = 50;
const MAX_SHORT = 500;        // single-line fields (titles, kickers, CTAs, etc.)
const MAX_LONG = 20_000;      // multi-line copy (subtitle, lead, description)
const MAX_LEGAL = 200_000;    // privacy/terms body
const MAX_IMAGES_PER_TRAILER = 20;
const MAX_PATH = 500;

const clampString = (value: string, max: number) =>
  value.length > max ? value.slice(0, max) : value;

const asString = (value: unknown, fallback: string, max = MAX_SHORT) =>
  typeof value === 'string' ? clampString(value, max) : fallback;

const asStringArray = (value: unknown, fallback: string[], maxItems = MAX_IMAGES_PER_TRAILER, maxLen = MAX_PATH) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .slice(0, maxItems)
        .map((item) => clampString(item, maxLen))
    : fallback;

const normalizeTrailer = (value: unknown, fallback: Trailer): Trailer => {
  const row = isRecord(value) ? value : {};
  return {
    id: typeof row.id === 'number' && Number.isFinite(row.id) ? row.id : fallback.id,
    name: asString(row.name, fallback.name, MAX_SHORT),
    priceShort: asString(row.priceShort, fallback.priceShort, MAX_SHORT),
    description: asString(row.description, fallback.description, MAX_LONG),
    images: asStringArray(row.images, fallback.images),
  };
};

const normalizeContent = (value: unknown): SiteContent => {
  const input = isRecord(value) ? value : {};
  const hero = isRecord(input.hero) ? input.hero : {};
  const camping = isRecord(input.camping) ? input.camping : {};
  const transport = isRecord(input.transport) ? input.transport : {};
  const contact = isRecord(input.contact) ? input.contact : {};
  const legal = isRecord(input.legal) ? input.legal : {};
  const privacy = isRecord(legal.privacy) ? legal.privacy : {};
  const terms = isRecord(legal.terms) ? legal.terms : {};

  const normalizeOfferTrailers = (
    raw: unknown,
    fallback: Trailer[]
  ): Trailer[] => {
    const list = Array.isArray(raw) ? raw : fallback;
    return list
      .slice(0, MAX_TRAILERS_PER_SECTION)
      .map((trailer, index) =>
        normalizeTrailer(trailer, fallback[index] ?? fallback[0])
      );
  };

  return {
    hero: {
      kicker: asString(hero.kicker, DEFAULT_SITE_CONTENT.hero.kicker),
      titlePrefix: asString(hero.titlePrefix, DEFAULT_SITE_CONTENT.hero.titlePrefix),
      titleAccent: asString(hero.titleAccent, DEFAULT_SITE_CONTENT.hero.titleAccent),
      subtitle: asString(hero.subtitle, DEFAULT_SITE_CONTENT.hero.subtitle, MAX_LONG),
      primaryCta: asString(hero.primaryCta, DEFAULT_SITE_CONTENT.hero.primaryCta),
      secondaryCta: asString(hero.secondaryCta, DEFAULT_SITE_CONTENT.hero.secondaryCta),
      image: asString(hero.image, DEFAULT_SITE_CONTENT.hero.image, MAX_PATH),
    },
    highlights: asStringArray(input.highlights, DEFAULT_SITE_CONTENT.highlights, 4, MAX_SHORT).slice(0, 4),
    camping: {
      kicker: asString(camping.kicker, DEFAULT_SITE_CONTENT.camping.kicker),
      title: asString(camping.title, DEFAULT_SITE_CONTENT.camping.title),
      lead: asString(camping.lead, DEFAULT_SITE_CONTENT.camping.lead, MAX_LONG),
      badge: asString(camping.badge, DEFAULT_SITE_CONTENT.camping.badge),
      badgeColor: asString(camping.badgeColor, DEFAULT_SITE_CONTENT.camping.badgeColor),
      trailers: normalizeOfferTrailers(camping.trailers, DEFAULT_SITE_CONTENT.camping.trailers),
    },
    transport: {
      kicker: asString(transport.kicker, DEFAULT_SITE_CONTENT.transport.kicker),
      title: asString(transport.title, DEFAULT_SITE_CONTENT.transport.title),
      lead: asString(transport.lead, DEFAULT_SITE_CONTENT.transport.lead, MAX_LONG),
      badge: asString(transport.badge, DEFAULT_SITE_CONTENT.transport.badge),
      badgeColor: asString(transport.badgeColor, DEFAULT_SITE_CONTENT.transport.badgeColor),
      trailers: normalizeOfferTrailers(transport.trailers, DEFAULT_SITE_CONTENT.transport.trailers),
    },
    contact: {
      kicker: asString(contact.kicker, DEFAULT_SITE_CONTENT.contact.kicker),
      title: asString(contact.title, DEFAULT_SITE_CONTENT.contact.title),
      lead: asString(contact.lead, DEFAULT_SITE_CONTENT.contact.lead, MAX_LONG),
      phone: asString(contact.phone, DEFAULT_SITE_CONTENT.contact.phone),
      email: asString(contact.email, DEFAULT_SITE_CONTENT.contact.email),
      address: asString(contact.address, DEFAULT_SITE_CONTENT.contact.address),
    },
    legal: {
      privacy: {
        title: asString(privacy.title, DEFAULT_SITE_CONTENT.legal.privacy.title),
        updatedAt: asString(privacy.updatedAt, DEFAULT_SITE_CONTENT.legal.privacy.updatedAt),
        body: asString(privacy.body, DEFAULT_SITE_CONTENT.legal.privacy.body, MAX_LEGAL),
      },
      terms: {
        title: asString(terms.title, DEFAULT_SITE_CONTENT.legal.terms.title),
        updatedAt: asString(terms.updatedAt, DEFAULT_SITE_CONTENT.legal.terms.updatedAt),
        body: asString(terms.body, DEFAULT_SITE_CONTENT.legal.terms.body, MAX_LEGAL),
      },
    },
  };
};

const readContent = async (): Promise<SiteContent> => {
  try {
    const raw = await fs.readFile(contentPath, 'utf8');
    return normalizeContent(JSON.parse(raw));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[content] read failed', err);
    }
    return DEFAULT_SITE_CONTENT;
  }
};

const collectReferencedUploads = (content: SiteContent): Set<string> => {
  const refs = new Set<string>();
  const add = (p: string) => {
    if (typeof p !== 'string') return;
    const name = p.startsWith('/uploads/') ? p.slice('/uploads/'.length) : null;
    if (name && !name.includes('/') && !name.includes('..')) refs.add(name);
  };
  add(content.hero.image);
  for (const section of [content.camping, content.transport]) {
    for (const trailer of section.trailers) {
      for (const img of trailer.images) add(img);
    }
  }
  return refs;
};

// 10-minute grace period guards against racing an upload that hasn't been
// saved into content yet, and gives an editor a brief undo window.
const ORPHAN_GRACE_MS = 10 * 60 * 1000;

const pruneOrphanUploads = async (content: SiteContent) => {
  const refs = collectReferencedUploads(content);
  let entries: string[];
  try {
    entries = await fs.readdir(uploadsDir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw err;
  }
  const cutoff = Date.now() - ORPHAN_GRACE_MS;
  await Promise.all(
    entries.map(async (name) => {
      if (refs.has(name)) return;
      const filePath = path.join(uploadsDir, name);
      try {
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs > cutoff) return;
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('[uploads] prune failed for', name, err);
      }
    })
  );
};

const writeContent = async (content: SiteContent) => {
  await fs.mkdir(dataDir, { recursive: true });
  const normalized = normalizeContent(content);
  await fs.writeFile(contentPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
};

const parseCookies = (header: string | undefined) => {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name) out[name] = decodeURIComponent(valueParts.join('='));
  }
  return out;
};

const timingSafeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const adminSecret = () => ADMIN_SESSION_SECRET || SESSION_SECRET || ADMIN_PASSWORD || 'dev-admin-secret';

const signSession = (expiresAt: number, nonce: string) =>
  crypto
    .createHmac('sha256', adminSecret())
    .update(`${expiresAt}.${nonce}`)
    .digest('base64url');

const makeAdminCookie = () => {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  const nonce = crypto.randomBytes(18).toString('base64url');
  return `v1.${expiresAt}.${nonce}.${signSession(expiresAt, nonce)}`;
};

const isValidAdminCookie = (cookie: string | undefined) => {
  if (!cookie) return false;
  const [version, expiresAtRaw, nonce, signature] = cookie.split('.');
  const expiresAt = Number(expiresAtRaw);
  if (version !== 'v1' || !Number.isFinite(expiresAt) || expiresAt < Date.now() || !nonce || !signature) {
    return false;
  }
  return timingSafeEqual(signature, signSession(expiresAt, nonce));
};

const setAdminSessionCookie = (res: express.Response, value: string, maxAge: number) => {
  const secure = NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${adminCookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
  );
};

const requireAdmin: express.RequestHandler = (req, res, next) => {
  if (isValidAdminCookie(parseCookies(req.headers.cookie)[adminCookieName])) {
    next();
    return;
  }
  res.status(401).json({ ok: false, error: 'unauthorized' });
};

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'rate_limited' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { ok: false, error: 'rate_limited' },
});

const adminUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'rate_limited' },
});

app.get('/api/config', (_req, res) => {
  res.json({
    turnstileSiteKey: turnstileEnabled ? TURNSTILE_SITE_KEY : '',
  });
});

app.get('/api/content', async (_req, res) => {
  res.json(await readContent());
});

app.get('/api/admin/session', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/admin/login', adminLoginLimiter, (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ ok: false, error: 'admin_password_missing' });
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!timingSafeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ ok: false, error: 'invalid_password' });
  }

  setAdminSessionCookie(res, makeAdminCookie(), 60 * 60 * 12);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (_req, res) => {
  setAdminSessionCookie(res, '', 0);
  res.json({ ok: true });
});

app.get('/api/admin/content', requireAdmin, async (_req, res) => {
  res.json(await readContent());
});

app.put('/api/admin/content', requireAdmin, async (req, res) => {
  try {
    const saved = await writeContent(req.body);
    res.json({ ok: true, content: saved });
    void pruneOrphanUploads(saved).catch((err) => console.warn('[uploads] prune failed', err));
  } catch (err) {
    console.error('[content] write failed', err);
    res.status(500).json({ ok: false, error: 'write_failed' });
  }
});

app.post('/api/admin/upload', adminUploadLimiter, requireAdmin, async (req, res) => {
  const fileName = typeof req.body?.fileName === 'string' ? req.body.fileName : 'upload';
  const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i);
  if (!match) return res.status(400).json({ ok: false, error: 'invalid_image' });

  const mime = match[1];
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 8 * 1024 * 1024) {
    return res.status(400).json({ ok: false, error: 'image_too_large' });
  }

  const safeBase = path
    .basename(fileName)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'image';
  // Random suffix avoids collisions when two uploads land in the same millisecond.
  const suffix = crypto.randomBytes(4).toString('hex');
  const savedName = `${Date.now()}-${suffix}-${safeBase}.${ext}`;

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, savedName), bytes);
  res.json({ ok: true, path: `/uploads/${savedName}` });
});

async function verifyTurnstile(token: string, ip: string | undefined): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true; // Dev fallback when not configured.
  try {
    const body = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (err) {
    console.error('[mail] turnstile verify failed', err);
    return false;
  }
}

app.options('/api/contact', contactCors);
app.post('/api/contact', contactCors, contactLimiter, async (req, res) => {
  const { name, phone, message, website, consent, turnstileToken } = req.body ?? {};

  if (typeof website === 'string' && website.length > 0) {
    return res.status(200).json({ ok: true });
  }

  if (consent !== true) {
    return res.status(400).json({ ok: false, error: 'consent_required' });
  }

  if (
    typeof name !== 'string' || name.trim().length < 2 || name.length > 200 ||
    typeof phone !== 'string' || phone.trim().length < 6 || phone.length > 40 ||
    typeof message !== 'string' || message.trim().length < 3 || message.length > 5000
  ) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }

  if (turnstileEnabled) {
    if (typeof turnstileToken !== 'string' || turnstileToken.length === 0) {
      return res.status(400).json({ ok: false, error: 'captcha_required' });
    }
    const ok = await verifyTurnstile(turnstileToken, req.ip);
    if (!ok) return res.status(400).json({ ok: false, error: 'captcha_failed' });
  }

  const safeName = stripCtl(name);
  const safePhone = stripCtl(phone);

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: `Zapytanie z eprzyczepy.eu — ${safeName}`,
      text: `Imię: ${safeName}\nTelefon: ${safePhone}\n\n${message}`,
      html: `<p><strong>Imię:</strong> ${escapeHtml(safeName)}</p>
<p><strong>Telefon:</strong> ${escapeHtml(safePhone)}</p>
<p><strong>Wiadomość:</strong></p>
<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[mail] send failed', err);
    res.status(500).json({ ok: false, error: 'send_failed' });
  }
});

// Let's Encrypt HTTP-01: when the domain is proxied to Node, validation hits
// /.well-known/acme-challenge/. Serve the token before the SPA catch-all.
const acmePath = path.join(__dirname, '.well-known', 'acme-challenge');
app.use('/.well-known/acme-challenge', express.static(acmePath));

app.use(express.static(distPath, { index: false, maxAge: '1h' }));
app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/.well-known/')) return res.status(404).end();
  try {
    await fs.access(path.join(distPath, 'index.html'));
    res.sendFile(path.join(distPath, 'index.html'));
  } catch {
    next();
  }
});

const port = Number(PORT ?? MAIL_SERVER_PORT ?? 3001);
app.listen(port, () => console.log(`[mail] listening :${port}`));

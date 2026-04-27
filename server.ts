import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '64kb' }));
app.use(cors());

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM,
  MAIL_TO,
  PORT,
  TURNSTILE_SECRET_KEY,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !MAIL_TO) {
  console.warn('[mail] SMTP env vars missing — /api/contact will 500 until configured.');
}
if (!TURNSTILE_SECRET_KEY) {
  console.warn('[mail] TURNSTILE_SECRET_KEY missing — captcha verification disabled (dev only).');
}

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

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'rate_limited' },
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

app.post('/api/contact', contactLimiter, async (req, res) => {
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

  if (TURNSTILE_SECRET_KEY) {
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
      subject: `Zapytanie z przyczepy.pl — ${safeName}`,
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

const port = Number(PORT ?? 3001);
app.listen(port, () => console.log(`[mail] listening :${port}`));

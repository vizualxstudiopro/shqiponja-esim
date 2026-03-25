const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sendMail, escapeHtml } = require('../lib/email');
const { sendTemplateEmail } = require('../lib/emailService');
const { authLimiter } = require('../middleware/rate-limit');
const { validateRegister, validateLogin } = require('../middleware/validate');

const router = express.Router();
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production!');
}
const JWT_SECRET = process.env.JWT_SECRET || 'shqiponja-dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// POST /api/auth/register
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Emri, email-i dhe fjalëkalimi janë të detyrueshëm' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë së paku 6 karaktere' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Ky email është i regjistruar tashmë' });
  }

  const hash = await bcrypt.hash(password, 12);
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const result = db.prepare(
    'INSERT INTO users (name, email, password, verify_token) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, verifyToken);

  const user = db.prepare('SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Send verification email
  const verifyUrl = `${FRONTEND_URL}/verifiko?token=${verifyToken}`;
  sendMail(
    email,
    'Verifiko email-in tënd — Shqiponja eSIM',
    `<h2>Mirë se vjen, ${escapeHtml(name)}!</h2><p>Kliko linkun për ta verifikuar email-in:</p><a href="${verifyUrl}">${verifyUrl}</a>`
  ).catch(err => console.error('Email error:', err));

  res.status(201).json({ user, token });
});

// POST /api/auth/login
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  const { email, password, totpCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email-i dhe fjalëkalimi janë të detyrueshëm' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });
  }

  // Check if 2FA is enabled for this user
  if (user.totp_enabled && user.totp_secret) {
    if (!totpCode) {
      // Return a challenge — client must re-submit with totpCode
      return res.json({ requires2FA: true });
    }
    const { TOTP, Secret } = require('otpauth');
    const totp = new TOTP({ issuer: 'Shqiponja eSIM Admin', label: user.email, secret: Secret.fromBase32(user.totp_secret), digits: 6, period: 30 });
    const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;
    if (!isValid) {
      return res.status(401).json({ error: 'Kodi 2FA i pavlefshëm' });
    }
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, totp_secret: __, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  res.json(user);
});

// POST /api/auth/verify - Verify email with token
router.post('/verify', (req, res) => {
  const { token: verifyToken } = req.body;
  if (!verifyToken) return res.status(400).json({ error: 'Token mungon' });

  const user = db.prepare('SELECT id FROM users WHERE verify_token = ?').get(verifyToken);
  if (!user) return res.status(400).json({ error: 'Token i pavlefshëm ose i skaduar' });

  db.prepare('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?').run(user.id);
  res.json({ ok: true, message: 'Email-i u verifikua me sukses!' });
});

// POST /api/auth/resend-verify - Resend verification email
router.post('/resend-verify', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  if (user.email_verified) return res.json({ message: 'Email-i është verifikuar tashmë' });

  const verifyToken = crypto.randomBytes(32).toString('hex');
  db.prepare('UPDATE users SET verify_token = ? WHERE id = ?').run(verifyToken, user.id);

  const verifyUrl = `${FRONTEND_URL}/verifiko?token=${verifyToken}`;
  sendMail(
    user.email,
    'Verifiko email-in tënd — Shqiponja eSIM',
    `<h2>Përshëndetje, ${escapeHtml(user.name)}!</h2><p>Kliko linkun për ta verifikuar email-in:</p><a href="${verifyUrl}">${verifyUrl}</a>`
  ).catch(err => console.error('Email error:', err));

  res.json({ message: 'Email-i i verifikimit u dërgua' });
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authLimiter, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email-i mungon' });

  const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);
  // Always return success to prevent email enumeration
  if (!user) return res.json({ message: 'Nëse ky email ekziston, do të marrësh një link për rivendosjen e fjalëkalimit' });

  // Gjenero JWT token që skadon pas 1 ore
  const resetToken = jwt.sign(
    { id: user.id, purpose: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Ruaj token-in në DB si backup (30 min legacy)
  const randomToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 orë
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(randomToken, expires, user.id);

  const resetUrl = `${FRONTEND_URL}/rivendos-fjalekalimin?token=${resetToken}`;

  // Dërgo me SMTP (fallback)
  sendMail(
    email,
    'Rivendos fjalëkalimin — Shqiponja eSIM',
    `<h2>Përshëndetje, ${escapeHtml(user.name)}!</h2><p>Kliko linkun për të rivendosur fjalëkalimin (i vlefshëm për 1 orë):</p><a href="${resetUrl}">${resetUrl}</a><p>Nëse nuk e kërkove këtë, injoroje këtë email.</p>`
  ).catch(err => console.error('Email error:', err));

  // Dërgo me Brevo Template #2
  sendTemplateEmail(email, 2, {
    FIRSTNAME: user.name || email.split('@')[0],
    RESET_LINK: resetUrl,
  }).catch(err => console.error('Brevo reset email error:', err));

  res.json({ message: 'Nëse ky email ekziston, do të marrësh një link për rivendosjen e fjalëkalimit' });
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token: resetToken, password } = req.body;
  if (!resetToken || !password) return res.status(400).json({ error: 'Token dhe fjalëkalimi janë të detyrueshëm' });
  if (password.length < 6) return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë së paku 6 karaktere' });
  if (password.length > 128) return res.status(400).json({ error: 'Fjalëkalimi është shumë i gjatë' });

  let user;

  // Provo JWT token (i ri — 1 orë)
  try {
    const payload = jwt.verify(resetToken, JWT_SECRET);
    if (payload.purpose === 'password-reset') {
      user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.id);
    }
  } catch {
    // JWT i pavlefshëm — provo token-in legacy nga DB
  }

  // Fallback: token legacy nga DB
  if (!user) {
    user = db.prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?')
      .get(resetToken, new Date().toISOString());
  }

  if (!user) return res.status(400).json({ error: 'Token i pavlefshëm ose i skaduar' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
    .run(hash, user.id);

  res.json({ ok: true, message: 'Fjalëkalimi u ndryshua me sukses!' });
});

// PATCH /api/auth/update-profile - Update name
router.patch('/update-profile', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Emri duhet të ketë së paku 2 karaktere' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Emri është shumë i gjatë' });
  }

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
  const user = db.prepare('SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(user);
});

// POST /api/auth/change-password - Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Fjalëkalimi aktual dhe i ri janë të detyrueshëm' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Fjalëkalimi i ri duhet të ketë së paku 6 karaktere' });
  }
  if (newPassword.length > 128) {
    return res.status(400).json({ error: 'Fjalëkalimi i ri është shumë i gjatë' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Fjalëkalimi aktual është i gabuar' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true, message: 'Fjalëkalimi u ndryshua me sukses!' });
});

module.exports = router;

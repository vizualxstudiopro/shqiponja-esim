const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { escapeHtml, verifyEmailTemplate, resetPasswordTemplate, welcomeEmailTemplate } = require('../lib/email');
const { sendTransactionalEmail } = require('../lib/emailService');
const { authLimiter } = require('../middleware/rate-limit');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { send_sms, MESSAGE_TYPES, sendVerifyCode, checkVerifyCode } = require('../src/services/twilioService');
const { syncBrevoContact } = require('../src/services/brevoContacts');

const BREVO_USERS_LIST_ID = process.env.BREVO_USERS_LIST_ID;

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

  const existing = (await db.query('SELECT id FROM users WHERE email = $1', [email])).rows[0];
  if (existing) {
    return res.status(409).json({ error: 'Ky email është i regjistruar tashmë' });
  }

  const hash = await bcrypt.hash(password, 12);
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const result = await db.query(
    'INSERT INTO users (name, email, password, verify_token) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, hash, verifyToken]
  );

  const user = (await db.query('SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = $1',
    [result.rows[0].id])).rows[0];

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Send verification email
  const verifyUrl = `${FRONTEND_URL}/verifiko?token=${verifyToken}`;
  sendTransactionalEmail({
    toEmail: email,
    subject: 'Verifiko email-in tënd — Shqiponja eSIM',
    html: verifyEmailTemplate(name, verifyUrl),
    logLabel: 'VERIFY EMAIL',
    senderType: 'noreply',
  }).catch(err => console.error('Verification email error:', err));

  // Sync to Brevo Contacts (non-blocking)
  syncBrevoContact(
    email,
    { FIRSTNAME: name.split(' ')[0], LASTNAME: name.split(' ').slice(1).join(' ') || undefined },
    BREVO_USERS_LIST_ID ? [BREVO_USERS_LIST_ID] : []
  ).catch(() => {});

  res.status(201).json({ user, token });
});

// POST /api/auth/login
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  const { email, password, totpCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email-i dhe fjalëkalimi janë të detyrueshëm' });
  }

  const user = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });
  }

  // Check TOTP 2FA (admin authenticator app)
  if (user.totp_enabled && user.totp_secret) {
    if (!totpCode) {
      return res.json({ requires2FA: true });
    }
    const { TOTP, Secret } = require('otpauth');
    const totp = new TOTP({ issuer: 'Shqiponja eSIM Admin', label: user.email, secret: Secret.fromBase32(user.totp_secret), digits: 6, period: 30 });
    const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;
    if (!isValid) {
      return res.status(401).json({ error: 'Kodi 2FA i pavlefshëm' });
    }
  }

  // Check SMS 2FA
  if (user.sms_2fa_enabled && user.phone) {
    const { smsCode } = req.body;
    if (!smsCode) {
      // Step 1: send code and return challenge
      sendVerifyCode(user.phone).catch(err => console.error('[SMS 2FA] send error:', err.message));
      const maskedPhone = user.phone.slice(0, -4).replace(/\d/g, '*') + user.phone.slice(-4);
      return res.json({ requiresSms2FA: true, maskedPhone });
    }
    // Step 2: verify code
    const result = await checkVerifyCode(user.phone, smsCode).catch(() => ({ approved: false }));
    if (!result.approved) {
      return res.status(401).json({ error: 'Kodi SMS i pavlefshëm ose i skaduar' });
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
router.get('/me', authMiddleware, async (req, res) => {
  const user = (await db.query(
    'SELECT id, name, email, role, email_verified, created_at, sms_2fa_enabled, phone FROM users WHERE id = $1',
    [req.user.id]
  )).rows[0];
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  // Mask phone for response
  const maskedPhone = user.phone
    ? user.phone.slice(0, -4).replace(/\d/g, '*') + user.phone.slice(-4)
    : null;
  res.json({ ...user, phone: undefined, masked_phone: maskedPhone });
});

// POST /api/auth/verify - Verify email with token
router.post('/verify', async (req, res) => {
  const { token: verifyToken, phoneNumber } = req.body;
  if (!verifyToken) return res.status(400).json({ error: 'Token mungon' });

  const user = (await db.query('SELECT id FROM users WHERE verify_token = $1', [verifyToken])).rows[0];
  if (!user) return res.status(400).json({ error: 'Token i pavlefshëm ose i skaduar' });

  await db.query('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = $1', [user.id]);

  // Send welcome email
  const fullUser = (await db.query('SELECT name, email FROM users WHERE id = $1', [user.id])).rows[0];
  if (fullUser) {
    sendTransactionalEmail({
      toEmail: fullUser.email,
      subject: 'Mirësevini në Shqiponja eSIM! 🎉',
      html: welcomeEmailTemplate(fullUser.name),
      logLabel: 'WELCOME EMAIL',
      senderType: 'hello',
      replyTo: 'info@shqiponjaesim.com',
    }).catch(err => console.error('Welcome email error:', err));

    if (phoneNumber) {
      send_sms(phoneNumber, MESSAGE_TYPES.welcome_new_customer)
        .catch(err => console.error('Welcome SMS error:', err.message));
    }
  }

  res.json({ ok: true, message: 'Email-i u verifikua me sukses!' });
});

// POST /api/auth/resend-verify - Resend verification email
router.post('/resend-verify', authMiddleware, async (req, res) => {
  const user = (await db.query('SELECT * FROM users WHERE id = $1', [req.user.id])).rows[0];
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  if (user.email_verified) return res.json({ message: 'Email-i është verifikuar tashmë' });

  const verifyToken = crypto.randomBytes(32).toString('hex');
  await db.query('UPDATE users SET verify_token = $1 WHERE id = $2', [verifyToken, user.id]);

  const verifyUrl = `${FRONTEND_URL}/verifiko?token=${verifyToken}`;
  sendTransactionalEmail({
    toEmail: user.email,
    subject: 'Verifiko email-in tënd — Shqiponja eSIM',
    html: verifyEmailTemplate(user.name, verifyUrl),
    logLabel: 'RESEND VERIFY EMAIL',
    senderType: 'noreply',
  }).catch(err => console.error('Resend verification email error:', err));

  res.json({ message: 'Email-i i verifikimit u dërgua' });
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authLimiter, async (req, res) => {
  const rawEmail = req.body?.email;
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  if (!email) return res.status(400).json({ error: 'Email-i mungon' });

  const user = (await db.query('SELECT id, name FROM users WHERE lower(email) = lower($1)', [email])).rows[0];
  console.log(`[FORGOT PASSWORD] Request for ${email} -> userFound=${!!user}`);
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
  await db.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [randomToken, expires, user.id]);

  const resetUrl = `${FRONTEND_URL}/rivendos-fjalekalimin?token=${resetToken}`;

  sendTransactionalEmail({
    toEmail: email,
    subject: 'Rivendos fjalëkalimin — Shqiponja eSIM',
    html: resetPasswordTemplate(user.name || email.split('@')[0], resetUrl),
    logLabel: 'PASSWORD RESET EMAIL',
    senderType: 'noreply',
  }).catch(err => {
    console.error('Password reset delivery failed:', err);
  });

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
      user = (await db.query('SELECT id FROM users WHERE id = $1', [payload.id])).rows[0];
    }
  } catch {
    // JWT i pavlefshëm — provo token-in legacy nga DB
  }

  // Fallback: token legacy nga DB
  if (!user) {
    user = (await db.query('SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > $2',
      [resetToken, new Date().toISOString()])).rows[0];
  }

  if (!user) return res.status(400).json({ error: 'Token i pavlefshëm ose i skaduar' });

  const hash = await bcrypt.hash(password, 12);
  await db.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [hash, user.id]);

  res.json({ ok: true, message: 'Fjalëkalimi u ndryshua me sukses!' });
});

// PATCH /api/auth/update-profile - Update name
router.patch('/update-profile', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Emri duhet të ketë së paku 2 karaktere' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Emri është shumë i gjatë' });
  }

  await db.query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), req.user.id]);
  const user = (await db.query('SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = $1',
    [req.user.id])).rows[0];
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

  const user = (await db.query('SELECT * FROM users WHERE id = $1', [req.user.id])).rows[0];
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Fjalëkalimi aktual është i gabuar' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ ok: true, message: 'Fjalëkalimi u ndryshua me sukses!' });
});

// POST /api/auth/sms-2fa/send - Send verification code to phone
router.post('/sms-2fa/send', authLimiter, authMiddleware, async (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Numri i telefonit mungon' });
  }
  try {
    await sendVerifyCode(phone);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/sms-2fa/enable - Verify code and enable SMS 2FA
router.post('/sms-2fa/enable', authLimiter, authMiddleware, async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Numri dhe kodi janë të detyrueshëm' });
  }
  const result = await checkVerifyCode(phone, code).catch(() => ({ approved: false }));
  if (!result.approved) {
    return res.status(400).json({ error: 'Kodi i pavlefshëm ose i skaduar' });
  }
  await db.query(
    'UPDATE users SET phone = $1, sms_2fa_enabled = 1 WHERE id = $2',
    [phone, req.user.id]
  );
  res.json({ ok: true });
});

// POST /api/auth/sms-2fa/disable - Disable SMS 2FA
router.post('/sms-2fa/disable', authMiddleware, async (req, res) => {
  await db.query(
    'UPDATE users SET sms_2fa_enabled = 0, phone = NULL WHERE id = $1',
    [req.user.id]
  );
  res.json({ ok: true });
});

module.exports = router;

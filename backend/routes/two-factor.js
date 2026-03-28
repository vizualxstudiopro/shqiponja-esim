const express = require('express');
const { TOTP, Secret } = require('otpauth');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

function createTOTP(secret, email) {
  return new TOTP({ issuer: 'Shqiponja eSIM Admin', label: email, secret: Secret.fromBase32(secret), digits: 6, period: 30 });
}

const router = express.Router();

// All 2FA routes require authenticated admin
router.use(authMiddleware, adminOnly);

// POST /api/auth/2fa/setup - Generate TOTP secret and QR code
router.post('/setup', async (req, res) => {
  try {
    const user = (await db.query('SELECT id, email, totp_enabled FROM users WHERE id = $1', [req.user.id])).rows[0];
    if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
    if (user.totp_enabled) return res.status(400).json({ error: '2FA është aktive tashmë' });

    const secret = new Secret({ size: 20 }).base32;

    // Store secret temporarily (not enabled yet until verified)
    await db.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, user.id]);

    const totp = createTOTP(secret, user.email);
    const qrCode = await QRCode.toDataURL(totp.toString());

    res.json({ secret, qrCode });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Gabim i brendshëm i serverit' });
  }
});

// POST /api/auth/2fa/verify-setup - Verify first TOTP code and enable 2FA
router.post('/verify-setup', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Kodi mungon' });

  const user = (await db.query('SELECT id, totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.id])).rows[0];
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  if (user.totp_enabled) return res.status(400).json({ error: '2FA është aktive tashmë' });
  if (!user.totp_secret) return res.status(400).json({ error: 'Fillo setup-in fillimisht' });

  const totp = createTOTP(user.totp_secret, 'admin');
  const isValid = totp.validate({ token: code, window: 1 }) !== null;
  if (!isValid) return res.status(400).json({ error: 'Kodi i pavlefshëm. Provo përsëri.' });

  await db.query('UPDATE users SET totp_enabled = 1 WHERE id = $1', [user.id]);
  res.json({ ok: true, message: '2FA u aktivizua me sukses!' });
});

// POST /api/auth/2fa/disable - Disable 2FA
router.post('/disable', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Kodi mungon' });

  const user = (await db.query('SELECT id, totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.id])).rows[0];
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  if (!user.totp_enabled) return res.status(400).json({ error: '2FA nuk është aktive' });

  const totp = createTOTP(user.totp_secret, 'admin');
  const isValid = totp.validate({ token: code, window: 1 }) !== null;
  if (!isValid) return res.status(400).json({ error: 'Kodi i pavlefshëm' });

  await db.query('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = $1', [user.id]);
  res.json({ ok: true, message: '2FA u çaktivizua' });
});

// GET /api/auth/2fa/status - Check if 2FA is enabled
router.get('/status', async (req, res) => {
  const user = (await db.query('SELECT totp_enabled FROM users WHERE id = $1', [req.user.id])).rows[0];
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  res.json({ enabled: !!user.totp_enabled });
});

module.exports = router;

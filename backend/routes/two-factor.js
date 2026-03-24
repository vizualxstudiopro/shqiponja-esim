const express = require('express');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All 2FA routes require authenticated admin
router.use(authMiddleware, adminOnly);

// POST /api/auth/2fa/setup - Generate TOTP secret and QR code
router.post('/setup', async (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, totp_enabled FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
    if (user.totp_enabled) return res.status(400).json({ error: '2FA është aktive tashmë' });

    const secret = authenticator.generateSecret();

    // Store secret temporarily (not enabled yet until verified)
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret, user.id);

    const otpauth = authenticator.keyuri(user.email, 'Shqiponja eSIM Admin', secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    res.json({ secret, qrCode });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Gabim i brendshëm i serverit' });
  }
});

// POST /api/auth/2fa/verify-setup - Verify first TOTP code and enable 2FA
router.post('/verify-setup', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Kodi mungon' });

  const user = db.prepare('SELECT id, totp_secret, totp_enabled FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  if (user.totp_enabled) return res.status(400).json({ error: '2FA është aktive tashmë' });
  if (!user.totp_secret) return res.status(400).json({ error: 'Fillo setup-in fillimisht' });

  const isValid = authenticator.check(code, user.totp_secret);
  if (!isValid) return res.status(400).json({ error: 'Kodi i pavlefshëm. Provo përsëri.' });

  db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(user.id);
  res.json({ ok: true, message: '2FA u aktivizua me sukses!' });
});

// POST /api/auth/2fa/disable - Disable 2FA
router.post('/disable', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Kodi mungon' });

  const user = db.prepare('SELECT id, totp_secret, totp_enabled FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  if (!user.totp_enabled) return res.status(400).json({ error: '2FA nuk është aktive' });

  const isValid = authenticator.check(code, user.totp_secret);
  if (!isValid) return res.status(400).json({ error: 'Kodi i pavlefshëm' });

  db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(user.id);
  res.json({ ok: true, message: '2FA u çaktivizua' });
});

// GET /api/auth/2fa/status - Check if 2FA is enabled
router.get('/status', (req, res) => {
  const user = db.prepare('SELECT totp_enabled FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  res.json({ enabled: !!user.totp_enabled });
});

module.exports = router;

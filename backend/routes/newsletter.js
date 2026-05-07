const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { validateEmail } = require('../middleware/validate');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rate-limit');

// POST /api/newsletter/subscribe
router.post('/subscribe', apiLimiter, async (req, res) => {
  const { email, locale } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Email i pavlefshëm' });
  }
  const safeEmail = String(email).trim().toLowerCase().slice(0, 254);
  const safeLocale = ['sq', 'en'].includes(locale) ? locale : 'sq';

  const unsubscribeToken = crypto.randomBytes(24).toString('hex');
  try {
    await db.query(`
      INSERT INTO newsletter_subscribers (email, locale, unsubscribe_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
        SET locale = EXCLUDED.locale,
            unsubscribed_at = NULL,
            subscribed_at = NOW()
      WHERE newsletter_subscribers.unsubscribed_at IS NOT NULL
        OR newsletter_subscribers.email = EXCLUDED.email
    `, [safeEmail, safeLocale, unsubscribeToken]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Newsletter subscribe error:', err.message);
    res.status(500).json({ error: 'Gabim gjatë regjistrimit' });
  }
});

// GET /api/newsletter/unsubscribe?token=...
router.get('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string' || !/^[0-9a-f]{48}$/.test(token)) {
    return res.status(400).send('<h2>Token i pavlefshëm</h2>');
  }
  try {
    const result = await db.query(
      'UPDATE newsletter_subscribers SET unsubscribed_at = NOW() WHERE unsubscribe_token = $1 RETURNING email',
      [token]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('<h2>Token nuk u gjet</h2>');
    }
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Çregjistrim</title><style>body{font-family:sans-serif;text-align:center;padding:60px;background:#f4f4f5}h1{color:#c8102e}p{color:#52525b}</style></head><body><h1>🦅 Shqiponja eSIM</h1><h2>U çregjistrove nga newsletter-i.</h2><p>Email-i juaj u hoq nga lista jonë e postimeve.</p><p><a href="${process.env.FRONTEND_URL || 'https://shqiponjaesim.com'}">Kthehu në faqe</a></p></body></html>`);
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err.message);
    res.status(500).send('<h2>Gabim i brendshëm</h2>');
  }
});

// GET /api/newsletter/subscribers — Admin only
router.get('/subscribers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const total = parseInt((await db.query("SELECT COUNT(*) c FROM newsletter_subscribers WHERE unsubscribed_at IS NULL")).rows[0].c);
    const rows = (await db.query(
      "SELECT id, email, locale, subscribed_at FROM newsletter_subscribers WHERE unsubscribed_at IS NULL ORDER BY subscribed_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    )).rows;
    res.json({ subscribers: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

module.exports = router;

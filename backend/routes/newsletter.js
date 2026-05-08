const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { validateEmail } = require('../middleware/validate');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rate-limit');
const { sendMail } = require('../src/utils/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://shqiponjaesim.com';
const BRAND_RED = '#C8102E';

function buildCampaignHtml(subject, bodyHtml, unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>
  body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .btn{display:inline-block;background:${BRAND_RED};color:#ffffff!important;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px}
  @media only screen and (max-width:600px){.container{width:100%!important;padding:0 16px!important}}
</style>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
    <tr>
      <td style="background:${BRAND_RED};padding:28px 32px;text-align:center">
        <span style="font-size:24px;font-weight:800;color:#ffffff">🦅 Shqiponja eSIM</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px 24px">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 28px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-top:1px solid #e4e4e7;padding-top:20px;text-align:center">
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa">
                <a href="${FRONTEND_URL}" style="color:${BRAND_RED};text-decoration:none;font-weight:600">shqiponjaesim.com</a>
              </p>
              <p style="margin:0 0 12px;font-size:11px;color:#a1a1aa">
                <a href="${FRONTEND_URL}/kushtet" style="color:#a1a1aa;text-decoration:none">Kushtet</a> &nbsp;·&nbsp;
                <a href="${FRONTEND_URL}/privatesia" style="color:#a1a1aa;text-decoration:none">Privatësia</a> &nbsp;·&nbsp;
                <a href="${FRONTEND_URL}/kontakti" style="color:#a1a1aa;text-decoration:none">Kontakti</a>
              </p>
              <p style="margin:0 0 8px;font-size:11px;color:#d4d4d8">
                Nuk dëshiron të marrësh email? <a href="${unsubscribeUrl}" style="color:#a1a1aa">Çregjistrohu</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

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

// POST /api/newsletter/broadcast — Admin only
// Body: { subject, bodyHtml, locale? ('sq'|'en'|'all') }
router.post('/broadcast', authMiddleware, adminOnly, async (req, res) => {
  const { subject, bodyHtml, locale } = req.body;

  if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
    return res.status(400).json({ error: 'Subjekti duhet të jetë të paktën 3 karaktere' });
  }
  if (!bodyHtml || typeof bodyHtml !== 'string' || bodyHtml.trim().length < 10) {
    return res.status(400).json({ error: 'Përmbajtja duhet të jetë të paktën 10 karaktere' });
  }

  const safeLocale = ['sq', 'en'].includes(locale) ? locale : null;

  try {
    // Fetch all active subscribers (optionally filtered by locale)
    const query = safeLocale
      ? "SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE unsubscribed_at IS NULL AND locale = $1"
      : "SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE unsubscribed_at IS NULL";
    const params = safeLocale ? [safeLocale] : [];
    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.json({ sent: 0, failed: 0, total: 0, message: 'Nuk ka abonentë aktivë' });
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Send with small delay between batches to stay within Brevo free tier (300/day)
    for (let i = 0; i < rows.length; i++) {
      const { email, unsubscribe_token } = rows[i];
      const unsubscribeUrl = `${FRONTEND_URL}/api/newsletter/unsubscribe?token=${unsubscribe_token}`;
      const html = buildCampaignHtml(subject.trim(), bodyHtml.trim(), unsubscribeUrl);
      try {
        await sendMail(email, subject.trim(), html);
        sent++;
      } catch (err) {
        failed++;
        errors.push({ email, error: err.message });
        console.error(`[BROADCAST] Failed to send to ${email}:`, err.message);
      }
      // Small delay every 10 emails to avoid rate limits
      if ((i + 1) % 10 === 0 && i + 1 < rows.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[BROADCAST] Subject: "${subject}" | Sent: ${sent} | Failed: ${failed} | Total: ${rows.length}`);
    res.json({ sent, failed, total: rows.length, errors: errors.slice(0, 10) });
  } catch (err) {
    console.error('Newsletter broadcast error:', err.message);
    res.status(500).json({ error: 'Gabim gjatë dërgimit' });
  }
});

module.exports = router;

const express = require('express');
const { escapeHtml } = require('../lib/email');
const { sendTransactionalEmail } = require('../lib/emailService');
const { authLimiter } = require('../middleware/rate-limit');
const { sanitizeString } = require('../middleware/validate');

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'suport@shqiponjaesim.com';

// POST /api/contact
router.post('/', authLimiter, async (req, res) => {
  const name = sanitizeString(req.body.name || '');
  const email = sanitizeString(req.body.email || '');
  const message = sanitizeString(req.body.message || '');

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme' });
  }

  if (name.length > 100 || email.length > 200 || message.length > 2000) {
    return res.status(400).json({ error: 'Fushat janë shumë të gjata' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email i pavlefshëm' });
  }

  const customerHtml = `<h2>Përshëndetje, ${escapeHtml(name)}!</h2><p>E morëm mesazhin tënd dhe do të të kontaktojmë sa më shpejt.</p><p><strong>Mesazhi yt:</strong></p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
  sendTransactionalEmail({
    toEmail: email,
    subject: 'Konfirmim kontakti — Shqiponja eSIM',
    html: customerHtml,
    templateId: 3,
    params: {
      FIRSTNAME: name,
      MESSAGE: message,
    },
    logLabel: 'CONTACT CUSTOMER EMAIL',
  }).catch(err => console.error('Contact confirmation delivery failed:', err));

  const adminHtml = `<h2>Mesazh i ri nga forma e kontaktit</h2>
       <p><strong>Emri:</strong> ${escapeHtml(name)}</p>
       <p><strong>Email:</strong> ${escapeHtml(email)}</p>
       <p><strong>Mesazhi:</strong></p>
       <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
  sendTransactionalEmail({
    toEmail: ADMIN_EMAIL,
    subject: `Kontakt nga ${escapeHtml(name)} — Shqiponja eSIM`,
    html: adminHtml,
    templateId: 4,
    params: {
      FIRSTNAME: name,
      EMAIL: email,
      MESSAGE: message,
    },
    logLabel: 'CONTACT ADMIN EMAIL',
  }).catch(err => console.error('Admin contact delivery failed:', err));

  res.json({ ok: true, message: 'Mesazhi u dërgua me sukses' });
});

module.exports = router;

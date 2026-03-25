const express = require('express');
const { sendMail, escapeHtml } = require('../lib/email');
const { sendTemplateEmail } = require('../lib/emailService');
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

  try {
    // Njoftim te admini me SMTP
    await sendMail(
      ADMIN_EMAIL,
      `Kontakt nga ${escapeHtml(name)} — Shqiponja eSIM`,
      `<h2>Mesazh i ri nga forma e kontaktit</h2>
       <p><strong>Emri:</strong> ${escapeHtml(name)}</p>
       <p><strong>Email:</strong> ${escapeHtml(email)}</p>
       <p><strong>Mesazhi:</strong></p>
       <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
    );
  } catch (err) {
    console.error('Contact admin email error:', err);
  }

  // Email konfirmimi te klienti me Brevo Template #3
  sendTemplateEmail(email, 3, {
    FIRSTNAME: name,
    MESSAGE: message,
  }).catch(err => console.error('Brevo contact confirmation error:', err));

  // Njoftim te admini me Brevo (pa template — përdor SMTP)
  sendTemplateEmail(ADMIN_EMAIL, 4, {
    FIRSTNAME: name,
    EMAIL: email,
    MESSAGE: message,
  }).catch(err => console.error('Brevo admin notification error:', err));

  res.json({ ok: true, message: 'Mesazhi u dërgua me sukses' });
});

module.exports = router;

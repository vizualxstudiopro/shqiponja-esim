const express = require('express');
const { escapeHtml, contactConfirmationTemplate, contactAdminTemplate } = require('../lib/email');
const { sendTransactionalEmail } = require('../lib/emailService');
const { contactLimiter } = require('../middleware/rate-limit');
const { sanitizeString } = require('../middleware/validate');

const router = express.Router();
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.INFO_EMAIL || 'info@shqiponjaesim.com';

// POST /api/contact
router.post('/', contactLimiter, async (req, res) => {
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

  const customerPromise = sendTransactionalEmail({
    toEmail: email,
    subject: 'Konfirmim kontakti — Shqiponja eSIM',
    html: contactConfirmationTemplate(name, message),
    logLabel: 'CONTACT CUSTOMER EMAIL',
    senderType: 'info',
    replyTo: 'info@shqiponjaesim.com',
  }).catch(err => {
    console.error('Contact confirmation delivery failed:', err);
    throw err;
  });

  const supportPromise = sendTransactionalEmail({
    toEmail: CONTACT_EMAIL,
    subject: `Kontakt nga ${escapeHtml(name)} — Shqiponja eSIM`,
    html: contactAdminTemplate(name, email, message),
    logLabel: 'CONTACT ADMIN EMAIL',
    senderType: 'info',
    replyTo: email,
  }).catch(err => {
    console.error('Admin contact delivery failed:', err);
    throw err;
  });

  const [customerResult, supportResult] = await Promise.allSettled([customerPromise, supportPromise]);
  const customerOk = customerResult.status === 'fulfilled';
  const supportOk = supportResult.status === 'fulfilled';

  if (!customerOk && !supportOk) {
    return res.status(502).json({ error: 'Dërgimi i email-it dështoi për momentin. Provo përsëri pas pak.' });
  }

  res.json({ ok: true, message: 'Mesazhi u dërgua me sukses' });
});

module.exports = router;

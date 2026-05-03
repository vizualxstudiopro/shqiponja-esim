const express = require('express');
const { sendTransactionalEmail } = require('../lib/emailService');

const router = express.Router();

const INCOMING_SMS_EMAIL =
  process.env.INCOMING_SMS_EMAIL ||
  process.env.CONTACT_EMAIL ||
  process.env.INFO_EMAIL ||
  'info@shqiponjaesim.com';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function twimlOk() {
  return '<?xml version="1.0" encoding="UTF-8"?><Response/>';
}

// POST /api/webhooks/twilio-sms
router.post('/twilio-sms', async (req, res) => {
  const smsBodyRaw = typeof req.body?.Body === 'string' ? req.body.Body : '';
  const fromRaw = typeof req.body?.From === 'string' ? req.body.From : '';

  const smsBody = smsBodyRaw.trim().slice(0, 5000);
  const from = fromRaw.trim().slice(0, 100);

  const subject = `Incoming SMS nga ${from || 'Unknown'} — Shqiponja eSIM`;
  const html = `
    <h2 style="margin:0 0 10px">Incoming SMS (Twilio)</h2>
    <p><strong>From:</strong> ${escapeHtml(from || '(mungon)')}</p>
    <p><strong>Body:</strong></p>
    <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;background:#f5f5f5;padding:12px;border-radius:8px">${escapeHtml(smsBody || '(mesazh bosh)')}</pre>
    <p style="color:#666;font-size:12px">Received at: ${new Date().toISOString()}</p>
  `;

  try {
    await sendTransactionalEmail({
      toEmail: INCOMING_SMS_EMAIL,
      subject,
      html,
      logLabel: 'TWILIO INCOMING SMS',
      senderType: 'support',
      replyTo: process.env.EMAIL_SUPPORT_REPLY_TO || undefined,
    });
  } catch (err) {
    console.error('[TWILIO SMS WEBHOOK] Email forwarding failed:', err && err.message ? err.message : err);
  }

  // Always respond with valid TwiML so Twilio marks delivery as successful.
  res.status(200).type('text/xml').send(twimlOk());
});

module.exports = router;
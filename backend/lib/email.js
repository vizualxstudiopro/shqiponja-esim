const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'Shqiponja eSIM <suport@shqiponjaesim.com>';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let transporter;
if (SMTP_HOST && SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 587,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

async function sendMail(to, subject, html) {
  if (!transporter) {
    throw new Error('SMTP not configured');
  }

  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM || SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[EMAIL ERROR] SMTP send failed:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { sendMail, escapeHtml };

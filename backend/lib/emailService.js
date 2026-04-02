const { BrevoClient } = require("@getbrevo/brevo");
const { sendMail } = require("./email");

const BREVO_API_KEY = process.env.BREVO_API_KEY;

let client;
if (BREVO_API_KEY) {
  client = new BrevoClient({ apiKey: BREVO_API_KEY });
} else {
  console.warn(
    "[EMAIL SERVICE] BREVO_API_KEY mungon — email-et template nuk do dërgohen."
  );
}

async function sendTemplateEmail(toEmail, templateId, params = {}) {
  if (!client) {
    console.log(
      `[DEV EMAIL] Template #${templateId} → ${toEmail}`,
      JSON.stringify(params)
    );
    return null;
  }

  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      to: [{ email: toEmail }],
      templateId,
      params,
    });
    console.log(
      `[EMAIL] Template #${templateId} → ${toEmail} — dërguar me sukses (messageId: ${response.messageId})`
    );
    return response;
  } catch (err) {
    console.error(
      `[EMAIL ERROR] Template #${templateId} → ${toEmail} — ${err.message}`
    );
    throw err;
  }
}

async function sendBrevoRawEmail(toEmail, subject, html) {
  if (!client) return null;
  const senderEmail = process.env.SMTP_FROM || 'suport@shqiponjaesim.com';
  const senderName = 'Shqiponja eSIM';
  const fromMatch = senderEmail.match(/^(.+?)\s*<(.+)>$/);
  const sender = fromMatch
    ? { name: fromMatch[1], email: fromMatch[2] }
    : { name: senderName, email: senderEmail };

  const response = await client.transactionalEmails.sendTransacEmail({
    sender,
    to: [{ email: toEmail }],
    subject,
    htmlContent: html,
  });
  return response;
}

async function sendTransactionalEmail({
  toEmail,
  subject,
  html,
  templateId,
  params = {},
  logLabel = "EMAIL",
}) {
  // 1. Try Brevo API first (most reliable in production)
  if (client) {
    try {
      const response = await sendBrevoRawEmail(toEmail, subject, html);
      console.log(`[${logLabel}] Sent via Brevo API to ${toEmail} (messageId: ${response?.messageId})`);
      return { provider: "brevo-api", info: response };
    } catch (brevoErr) {
      console.error(`[${logLabel}] Brevo API error:`, brevoErr && brevoErr.message ? brevoErr.message : brevoErr);
    }
  }

  // 2. Fallback: SMTP
  try {
    const smtpInfo = await sendMail(toEmail, subject, html);
    console.log(`[${logLabel}] Sent via SMTP to ${toEmail}`);
    return { provider: "smtp", info: smtpInfo };
  } catch (smtpErr) {
    console.error(`[${logLabel}] SMTP error:`, smtpErr && smtpErr.message ? smtpErr.message : smtpErr);
  }

  throw new Error(`[${logLabel}] All email delivery methods failed`);
}

module.exports = { sendTemplateEmail, sendTransactionalEmail };

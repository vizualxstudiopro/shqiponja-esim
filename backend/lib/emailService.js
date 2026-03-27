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

async function sendTransactionalEmail({
  toEmail,
  subject,
  html,
  templateId,
  params = {},
  logLabel = "EMAIL",
}) {
  try {
    const smtpInfo = await sendMail(toEmail, subject, html);
    console.log(`[${logLabel}] Sent via SMTP to ${toEmail}`);
    console.log(`[${logLabel}] SMTP delivery info:`, {
      messageId: smtpInfo?.messageId || null,
      accepted: smtpInfo?.accepted || [],
      rejected: smtpInfo?.rejected || [],
      response: smtpInfo?.response || null,
    });
    return { provider: "smtp", info: smtpInfo };
  } catch (smtpErr) {
    console.error(`[${logLabel}] SMTP error:`, smtpErr && smtpErr.message ? smtpErr.message : smtpErr);
  }

  if (templateId) {
    try {
      const response = await sendTemplateEmail(toEmail, templateId, params);
      console.log(`[${logLabel}] Sent via Brevo template #${templateId} to ${toEmail}`);
      return { provider: "brevo-template", info: response };
    } catch (templateErr) {
      console.error(`[${logLabel}] Brevo template error:`, templateErr && templateErr.message ? templateErr.message : templateErr);
      throw templateErr;
    }
  }

  throw new Error(`[${logLabel}] Email delivery failed and no fallback template was configured`);
}

module.exports = { sendTemplateEmail, sendTransactionalEmail };

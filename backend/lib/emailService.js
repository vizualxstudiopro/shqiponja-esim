const { BrevoClient } = require("@getbrevo/brevo");

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

module.exports = { sendTemplateEmail };

const Brevo = require("@getbrevo/brevo");

const BREVO_API_KEY = process.env.BREVO_API_KEY;

let apiInstance;
if (BREVO_API_KEY) {
  apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    BREVO_API_KEY
  );
} else {
  console.warn(
    "[EMAIL SERVICE] BREVO_API_KEY mungon — email-et template nuk do dërgohen."
  );
}

/**
 * Dërgon email duke përdorur një template të Brevo.
 *
 * @param {string} toEmail  – adresa e marrësit
 * @param {number} templateId – ID-ja e template-it në Brevo
 * @param {Record<string, string>} params – parametrat dinamikë për template-in
 * @returns {Promise<object|null>} – përgjigja e API-t ose null nëse s'ka API key
 */
async function sendTemplateEmail(toEmail, templateId, params = {}) {
  if (!apiInstance) {
    console.log(
      `[DEV EMAIL] Template #${templateId} → ${toEmail}`,
      JSON.stringify(params)
    );
    return null;
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: toEmail }];
  sendSmtpEmail.templateId = templateId;
  sendSmtpEmail.params = params;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
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

const https = require("https");
const { sendMail } = require("./email");

const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  console.warn(
    "[EMAIL SERVICE] BREVO_API_KEY mungon — email-et nuk do dërgohen."
  );
}

function parseSender() {
  const raw = process.env.SMTP_FROM || "suport@shqiponjaesim.com";
  const m = raw.match(/^(.+?)\s*<(.+)>$/);
  return m
    ? { name: m[1].trim(), email: m[2].trim() }
    : { name: "Shqiponja eSIM", email: raw.trim() };
}

function brevoPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: "api.brevo.com",
        path,
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(chunks);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              const err = new Error(json.message || `Brevo API ${res.statusCode}`);
              err.statusCode = res.statusCode;
              err.body = json;
              reject(err);
            }
          } catch (e) {
            reject(new Error(`Brevo API parse error: ${chunks}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function sendTemplateEmail(toEmail, templateId, params = {}) {
  if (!BREVO_API_KEY) {
    console.log(
      `[DEV EMAIL] Template #${templateId} → ${toEmail}`,
      JSON.stringify(params)
    );
    return null;
  }

  const sender = parseSender();
  const response = await brevoPost("/v3/smtp/email", {
    sender,
    to: [{ email: toEmail }],
    templateId,
    params,
  });
  console.log(
    `[EMAIL] Template #${templateId} → ${toEmail} — dërguar me sukses (messageId: ${response.messageId})`
  );
  return response;
}

async function sendBrevoRawEmail(toEmail, subject, html) {
  if (!BREVO_API_KEY) return null;
  const sender = parseSender();
  const response = await brevoPost("/v3/smtp/email", {
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
  console.log(`[${logLabel}] Preparing email to ${toEmail} | subject: ${subject} | html length: ${html?.length || 0} | has DOCTYPE: ${html?.includes('DOCTYPE') || false}`);

  // 1. Try Brevo REST API first
  if (BREVO_API_KEY) {
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

const https = require("https");
const { sendMail } = require("../utils/email");

const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  console.warn(
    "[EMAIL SERVICE] BREVO_API_KEY mungon — email-et nuk do dërgohen."
  );
}

const BRAND_NAME = process.env.EMAIL_BRAND_NAME || "Shqiponja eSIM";

const EMAIL_PROFILES = {
  hello:
    process.env.EMAIL_HELLO_FROM ||
    `${BRAND_NAME} <hello@shqiponjaesim.com>`,
  noreply:
    process.env.EMAIL_NOREPLY_FROM ||
    `${BRAND_NAME} <noreply@shqiponjaesim.com>`,
  info:
    process.env.EMAIL_INFO_FROM ||
    `${BRAND_NAME} <info@shqiponjaesim.com>`,
  invoice:
    process.env.EMAIL_INVOICE_FROM ||
    `${BRAND_NAME} <invoice@shqiponjaesim.com>`,
  support:
    process.env.EMAIL_SUPPORT_FROM ||
    `${BRAND_NAME} <suport@shqiponjaesim.com>`,
};

function parseSender(rawFrom) {
  const raw = rawFrom || EMAIL_PROFILES.noreply;
  const m = raw.match(/^(.+?)\s*<(.+)>$/);
  return m
    ? { name: m[1].trim(), email: m[2].trim() }
    : { name: BRAND_NAME, email: raw.trim() };
}

function resolveSender(senderType, fromEmail) {
  if (fromEmail) {
    return parseSender(fromEmail);
  }
  return parseSender(EMAIL_PROFILES[senderType] || EMAIL_PROFILES.noreply);
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
          } catch {
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

function toBrevoAttachments(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) return undefined;
  return attachments
    .map((item) => {
      if (!item || !item.filename || !item.content) return null;
      const buffer = Buffer.isBuffer(item.content)
        ? item.content
        : Buffer.from(String(item.content), "utf8");
      return {
        name: item.filename,
        content: buffer.toString("base64"),
      };
    })
    .filter(Boolean);
}

async function sendTemplateEmail(toEmail, templateId, params = {}) {
  if (!BREVO_API_KEY) {
    console.log(
      `[DEV EMAIL] Template #${templateId} -> ${toEmail}`,
      JSON.stringify(params)
    );
    return null;
  }

  const sender = resolveSender("noreply");
  const response = await brevoPost("/v3/smtp/email", {
    sender,
    to: [{ email: toEmail }],
    templateId,
    params,
  });
  console.log(
    `[EMAIL] Template #${templateId} -> ${toEmail} sent (messageId: ${response.messageId})`
  );
  return response;
}

async function sendBrevoRawEmail(toEmail, subject, html, sender, replyTo, attachments) {
  if (!BREVO_API_KEY) return null;
  const body = {
    sender,
    to: [{ email: toEmail }],
    subject,
    htmlContent: html,
  };
  if (replyTo) {
    body.replyTo = { email: replyTo };
  }
  const brevoAttachments = toBrevoAttachments(attachments);
  if (brevoAttachments?.length) {
    body.attachment = brevoAttachments;
  }
  return brevoPost("/v3/smtp/email", body);
}

async function sendTransactionalEmail({
  toEmail,
  subject,
  html,
  templateId,
  params = {},
  logLabel = "EMAIL",
  retries = 2,
  senderType = "noreply",
  fromEmail,
  replyTo,
  attachments,
}) {
  const sender = resolveSender(senderType, fromEmail);
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
      console.log(`[${logLabel}] Retry ${attempt}/${retries} for ${toEmail}...`);
    }

    if (BREVO_API_KEY) {
      try {
        const response = await sendBrevoRawEmail(
          toEmail,
          subject,
          html,
          sender,
          replyTo,
          attachments
        );
        console.log(
          `[${logLabel}] Sent via Brevo API to ${toEmail} (messageId: ${response?.messageId})`
        );
        return { provider: "brevo-api", info: response };
      } catch (brevoErr) {
        lastErr = brevoErr;
        console.error(
          `[${logLabel}] Brevo API error:`,
          brevoErr && brevoErr.message ? brevoErr.message : brevoErr
        );
      }
    }

    try {
      const smtpInfo = await sendMail(toEmail, subject, html, {
        from: `${sender.name} <${sender.email}>`,
        replyTo,
        attachments,
      });
      console.log(`[${logLabel}] Sent via SMTP to ${toEmail}`);
      return { provider: "smtp", info: smtpInfo };
    } catch (smtpErr) {
      lastErr = smtpErr;
      console.error(
        `[${logLabel}] SMTP error:`,
        smtpErr && smtpErr.message ? smtpErr.message : smtpErr
      );
    }
  }

  throw new Error(
    `[${logLabel}] All email delivery methods failed after ${retries + 1} attempts`
  );
}

module.exports = { sendTemplateEmail, sendTransactionalEmail, EMAIL_PROFILES };

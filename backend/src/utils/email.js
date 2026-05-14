const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const https = require('https');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SMTP_FROM = process.env.SMTP_FROM || 'Shqiponja eSIM <noreply@shqiponjaesim.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://shqiponjaesim.com';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let transporter;
if (SMTP_HOST && SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

// Parse "Name <email>" or plain "email" into { name, email }
function parseFromAddress(fromStr) {
  const match = (fromStr || '').match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: 'Shqiponja eSIM', email: fromStr || 'noreply@shqiponjaesim.com' };
}

async function sendMailViaBrevoApi(to, subject, html, options = {}) {
  const fromStr = options.from || process.env.SMTP_FROM || SMTP_FROM;
  const sender = parseFromAddress(fromStr);
  const recipients = Array.isArray(to) ? to.map(e => ({ email: e })) : [{ email: to }];

  const payload = {
    sender,
    to: recipients,
    subject,
    htmlContent: html,
  };
  if (options.replyTo) payload.replyTo = { email: options.replyTo };
  if (options.attachments && options.attachments.length) {
    payload.attachment = options.attachments.map(a => ({
      name: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : Buffer.from(a.content).toString('base64'),
    }));
  }

  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          console.error('[EMAIL ERROR] Brevo API error:', res.statusCode, data);
          reject(new Error(`Brevo API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', err => {
      console.error('[EMAIL ERROR] Brevo API request failed:', err.message);
      reject(err);
    });
    req.write(body);
    req.end();
  });
}

async function sendMail(to, subject, html, options = {}) {
  // Prefer Brevo HTTP API (more reliable on cloud)
  if (BREVO_API_KEY) {
    return sendMailViaBrevoApi(to, subject, html, options);
  }

  if (!transporter) {
    throw new Error('Email not configured: set BREVO_API_KEY or SMTP credentials');
  }

  try {
    return await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM || SMTP_FROM,
      replyTo: options.replyTo,
      attachments: options.attachments,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[EMAIL ERROR] SMTP send failed:', err && err.message ? err.message : err);
    throw err;
  }
}

/* ═══════════════════════════════════════════════════════════════
   BRANDED HTML EMAIL TEMPLATES
   All emails share a unified layout matching Shqiponja eSIM branding
   ═══════════════════════════════════════════════════════════════ */

const BRAND_RED = '#C8102E';
const BRAND_DARK = '#9B0D23';
const EAGLE_PERSONAS = {
  enkela: { name: 'Enkela', role: 'Mireseardhja', emoji: '👋' },
  bato: { name: 'Bato', role: 'Siguri & fjalekalim', emoji: '🔐' },
  glauku: { name: 'Glauku', role: 'Udherrefyes blerjeje', emoji: '🧭' },
  agroni: { name: 'Agroni', role: 'Live Support', emoji: '💬' },
};

function personaAvatarDataUri(name) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const svg = `<svg width="96" height="96" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1f2937"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#g)"/><circle cx="48" cy="48" r="36" fill="#C8102E" opacity="0.22"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#C8102E" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function eagleGuideCard(personaKey, message) {
  const persona = EAGLE_PERSONAS[personaKey];
  if (!persona) return '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#fff7f8;border:1px solid #ffd4da;border-radius:12px;overflow:hidden">
      <tr>
        <td style="padding:14px 16px">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="56" valign="top" style="padding-right:10px">
                <img src="${personaAvatarDataUri(persona.name)}" width="48" height="48" alt="${persona.name}" style="display:block;border-radius:9999px" />
              </td>
              <td valign="top">
          <p style="margin:0 0 6px;font-size:12px;color:#9f1239;font-weight:700;text-transform:uppercase;letter-spacing:0.4px">
            ${persona.emoji} ${persona.name} • ${persona.role}
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#3f3f46">${escapeHtml(message)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Base email layout wrapper — all emails go through this
 */
function baseLayout(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Shqiponja eSIM</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
  body{margin:0;padding:0;width:100%!important;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .btn{display:inline-block;background:${BRAND_RED};color:#ffffff!important;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px}
  .btn:hover{background:${BRAND_DARK}}
  .card{background:#f8f8fa;border-radius:12px;padding:20px 24px;margin:20px 0}
  @media only screen and (max-width:600px){.container{width:100%!important;padding:0 16px!important}}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5">
${preheader ? `<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
    <!-- Header -->
    <tr>
      <td style="background:${BRAND_RED};padding:28px 32px;text-align:center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">🦅 Shqiponja eSIM</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px 32px 24px">
        ${content}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:0 32px 28px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-top:1px solid #e4e4e7;padding-top:20px;text-align:center">
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa">
                <a href="${FRONTEND_URL}" style="color:${BRAND_RED};text-decoration:none;font-weight:600">shqiponjaesim.com</a>
              </p>
              <p style="margin:0 0 12px;font-size:11px;color:#a1a1aa">
                <a href="${FRONTEND_URL}/kushtet" style="color:#a1a1aa;text-decoration:none">Kushtet</a> &nbsp;·&nbsp;
                <a href="${FRONTEND_URL}/privatesia" style="color:#a1a1aa;text-decoration:none">Privatësia</a> &nbsp;·&nbsp;
                <a href="${FRONTEND_URL}/kontakti" style="color:#a1a1aa;text-decoration:none">Kontakti</a>
              </p>
              <p style="margin:0;font-size:11px;color:#d4d4d8">&copy; ${new Date().getFullYear()} Shqiponja eSIM. Të gjitha të drejtat e rezervuara.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/* ── Individual email templates ── */

function verifyEmailTemplate(name, verifyUrl) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Mirë se vjen, ${escapeHtml(name)}! 👋</h2>
    ${eagleGuideCard('enkela', 'Une jam Enkela. Te ndihmoj ta nisesh udhetimin ne pak sekonda.')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">
      Faleminderit që u regjistrove në Shqiponja eSIM. Kliko butonin më poshtë për ta verifikuar adresën tënde email.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 24px">
        <a href="${verifyUrl}" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Verifiko Email-in</a>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#71717a">Ose kopjo këtë link në shfletuesin tënd:</p>
    <p style="margin:0;font-size:12px;color:#a1a1aa;word-break:break-all">${verifyUrl}</p>
  `, 'Verifiko email-in tënd për të vazhduar');
}

function resetPasswordTemplate(name, resetUrl) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Rivendos fjalëkalimin 🔐</h2>
    ${eagleGuideCard('bato', 'Une jam Bato. Ndiq hapat me poshte dhe vendos nje fjalekalim te ri e te sigurt.')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">
      Përshëndetje, ${escapeHtml(name)}! Morëm kërkesën tënde për rivendosjen e fjalëkalimit. Kliko butonin më poshtë (i vlefshëm për 1 orë).
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 24px">
        <a href="${resetUrl}" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Rivendos Fjalëkalimin</a>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#71717a">Ose kopjo këtë link në shfletuesin tënd:</p>
    <p style="margin:0 0 16px;font-size:12px;color:#a1a1aa;word-break:break-all">${resetUrl}</p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;font-style:italic">Nëse nuk e kërkove këtë, injoroje këtë email.</p>
  `, 'Rivendos fjalëkalimin tënd');
}

async function orderConfirmationTemplate({ orderId, packageFlag, packageName, price, iccid, qrData, qrCodeUrl, accessToken }) {
  const priceDisplay = price ? `€${Number(price).toFixed(2)}` : '';
  // Generate QR as embedded base64 data URI (no external API dependency)
  let qrImageSrc = qrCodeUrl || null;
  if (!qrImageSrc && qrData) {
    try {
      qrImageSrc = await QRCode.toDataURL(qrData, { width: 250, margin: 2, color: { dark: '#0a0a0a', light: '#ffffff' } });
    } catch (err) {
      console.error('[EMAIL] QR generation failed:', err.message);
    }
  }
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Porosia u konfirmua! ✅</h2>
    ${eagleGuideCard('glauku', 'Une jam Glauku. Me ndjek ne 3 hapa dhe eSIM aktivizohet menjehere pasi mberrin.')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">
      Faleminderit për blerjen. Ja detajet e porosisë tënde:
    </p>

    <!-- Invoice card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px;overflow:hidden;margin:0 0 24px">
      <tr>
        <td style="background:${BRAND_RED};padding:12px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="font-size:14px;font-weight:700;color:#ffffff">FATURË / INVOICE</span></td>
              <td align="right"><span style="font-size:13px;color:#ffffff;opacity:0.85">#${orderId}</span></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Paketa</td>
              <td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#18181b">${packageFlag || ''} ${escapeHtml(packageName || '')}</td>
            </tr>
            ${priceDisplay ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Çmimi</td>
              <td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#18181b">${priceDisplay}</td>
            </tr>` : ''}
            ${iccid ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">ICCID</td>
              <td align="right" style="padding:6px 0;font-size:13px;font-weight:500;color:#18181b;font-family:monospace">${escapeHtml(iccid)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Statusi</td>
              <td align="right" style="padding:6px 0"><span style="display:inline-block;background:#dcfce7;color:#166534;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:600">Paguar ✓</span></td>
            </tr>
          </table>
          ${qrImageSrc ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #e4e4e7;padding-top:16px">
            <tr>
              <td align="center" style="padding:12px 0 8px">
                <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b">Skano kodin QR për ta aktivizuar:</p>
                <img src="${qrImageSrc}" alt="eSIM QR Code" width="200" height="200" style="display:block;margin:0 auto;border-radius:12px;border:2px solid #e4e4e7" />
              </td>
            </tr>
          </table>` : ''}
          ${qrData ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
            <tr>
              <td style="font-size:12px;color:#71717a;padding-bottom:4px">Kodi manual:</td>
            </tr>
            <tr>
              <td style="font-size:11px;font-family:monospace;color:#18181b;word-break:break-all;background:#ffffff;padding:10px;border-radius:8px;border:1px solid #e4e4e7">${escapeHtml(qrData)}</td>
            </tr>
          </table>` : ''}
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#18181b">Si ta aktivizosh? 📱</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;font-size:14px;color:#52525b">
        <strong style="color:${BRAND_RED}">1.</strong> Shko te <strong>Cilësimet</strong> → <strong>Celular</strong> → <strong>Shto Plan eSIM</strong>
      </td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#52525b">
        <strong style="color:${BRAND_RED}">2.</strong> Skano QR kodin ose fut kodin manualisht
      </td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#52525b">
        <strong style="color:${BRAND_RED}">3.</strong> Aktivizo kur të arrish në destinacion
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
      <tr><td align="center">
        <a href="${FRONTEND_URL}/porosi/${orderId}${accessToken ? `?token=${accessToken}` : ''}" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Shiko Porosinë</a>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:13px;color:#71717a;text-align:center">
      ${EAGLE_PERSONAS.agroni.emoji} ${EAGLE_PERSONAS.agroni.name} eshte online per live suport: <a href="${FRONTEND_URL}/kontakti" style="color:${BRAND_RED};font-weight:600;text-decoration:none">Hap Live Chat</a>
    </p>
  `, 'Porosia jote u konfirmua');
}

function welcomeEmailTemplate(name) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Mirësevini, ${escapeHtml(name)}! 🎉</h2>
    ${eagleGuideCard('enkela', 'Une jam Enkela. Te shoqeroj ne onboarding dhe aktivizimin e paketes tende te pare.')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">
      Email-i juaj u verifikua me sukses! Tani mund të blini eSIM për udhëtimet tuaja.
    </p>
    <div class="card" style="background:#f8f8fa;border-radius:12px;padding:20px 24px;margin:0 0 24px">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b">Me Shqiponja eSIM mund të:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 0;font-size:14px;color:#52525b">✅ Blini eSIM për mbi 200 vende</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#52525b">✅ Aktivizim i menjëhershëm me QR kod</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#52525b">✅ Çmime konkurruese pa tarifë roaming</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#52525b">✅ Mbështetje 24/7 në shqip</td></tr>
      </table>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${FRONTEND_URL}/#packages" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Shiko Paketat</a>
      </td></tr>
    </table>
  `, 'Mirësevini në Shqiponja eSIM!');
}

function paymentReceiptTemplate({ orderId, packageName, packageFlag, price, email, date, accessToken }) {
  const priceDisplay = price ? `€${Number(price).toFixed(2)}` : '';
  const dateDisplay = date ? new Date(date).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Fatura e pagesës 🧾</h2>
    ${eagleGuideCard('glauku', 'Ruaje kete fature. Per aktivizimin e paketes, mund te hysh te faqja e porosise kurdohere.')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">
      Faleminderit për pagesën tuaj. Ja fatura e porosisë:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px;overflow:hidden;margin:0 0 24px">
      <tr>
        <td style="background:${BRAND_RED};padding:12px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="font-size:14px;font-weight:700;color:#ffffff">FATURË</span></td>
              <td align="right"><span style="font-size:13px;color:#ffffff;opacity:0.85">#INV-${String(orderId).padStart(5, '0')}</span></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Paketa</td>
              <td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#18181b">${packageFlag || ''} ${escapeHtml(packageName || '')}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Data</td>
              <td align="right" style="padding:6px 0;font-size:14px;color:#18181b">${dateDisplay}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Email</td>
              <td align="right" style="padding:6px 0;font-size:14px;color:#18181b">${escapeHtml(email || '')}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:12px 0 0"><hr style="border:none;border-top:1px solid #e4e4e7;margin:0" /></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:15px;font-weight:700;color:#18181b">Total</td>
              <td align="right" style="padding:8px 0;font-size:18px;font-weight:800;color:${BRAND_RED}">${priceDisplay}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${FRONTEND_URL}/porosi/${orderId}${accessToken ? `?token=${accessToken}` : ''}" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Shiko Porosinë</a>
      </td></tr>
    </table>
  `, 'Fatura e pagesës — Shqiponja eSIM');
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `EUR ${amount.toFixed(2)}`;
}

async function generateInvoicePdfBuffer({ orderId, packageName, packageFlag, price, email, date }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const invoiceNo = `INV-${String(orderId || 0).padStart(5, '0')}`;
    const issueDate = date ? new Date(date) : new Date();
    const issueDateDisplay = issueDate.toISOString().slice(0, 10);
    const total = Number(price || 0);

    // Header band
    doc.save();
    doc.rect(0, 0, doc.page.width, 120).fill(BRAND_RED);
    doc.restore();

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text('Shqiponja eSIM', 48, 42);
    doc.font('Helvetica').fontSize(11).text('Digital Connectivity Invoice', 48, 76);

    // Invoice meta
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text('INVOICE', 430, 40, { align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    doc.text(invoiceNo, 430, 58, { align: 'right' });
    doc.text(`Date: ${issueDateDisplay}`, 430, 74, { align: 'right' });

    // Bill to card
    doc.roundedRect(48, 145, 499, 78, 10).fill('#f9fafb');
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text('Bill To', 64, 160);
    doc.fillColor('#374151').font('Helvetica').fontSize(10).text(email || '-', 64, 180);

    // Table header
    const startY = 260;
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(9);
    doc.text('Description', 48, startY);
    doc.text('Qty', 350, startY, { width: 40, align: 'center' });
    doc.text('Unit Price', 400, startY, { width: 70, align: 'right' });
    doc.text('Total', 480, startY, { width: 67, align: 'right' });

    doc.moveTo(48, startY + 14).lineTo(547, startY + 14).strokeColor('#e5e7eb').stroke();

    // Single item row
    // PDFKit doesn't support emoji — strip them to avoid garbled characters
    const stripEmoji = (str) => str.replace(/[\u{1F300}-\u{1FFFF}]|\p{Emoji_Presentation}/gu, '').trim();
    const desc = `${stripEmoji(packageFlag || '')} ${packageName || 'eSIM Package'}`.trim();
    const rowY = startY + 26;
    doc.fillColor('#111827').font('Helvetica').fontSize(11);
    doc.text(desc, 48, rowY, { width: 285 });
    doc.text('1', 350, rowY, { width: 40, align: 'center' });
    doc.text(formatCurrency(total), 400, rowY, { width: 70, align: 'right' });
    doc.text(formatCurrency(total), 480, rowY, { width: 67, align: 'right' });

    doc.moveTo(48, rowY + 28).lineTo(547, rowY + 28).strokeColor('#e5e7eb').stroke();

    // Total block
    const totalY = rowY + 50;
    doc.font('Helvetica').fontSize(11).fillColor('#374151');
    doc.text('Subtotal', 410, totalY, { width: 70, align: 'right' });
    doc.text(formatCurrency(total), 480, totalY, { width: 67, align: 'right' });

    doc.text('VAT', 410, totalY + 18, { width: 70, align: 'right' });
    doc.text('EUR 0.00', 480, totalY + 18, { width: 67, align: 'right' });

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827');
    doc.text('Grand Total', 390, totalY + 44, { width: 90, align: 'right' });
    doc.fillColor(BRAND_RED).text(formatCurrency(total), 480, totalY + 44, { width: 67, align: 'right' });

    // Footer note
    doc.fillColor('#6b7280').font('Helvetica').fontSize(9);
    doc.text('Thank you for choosing Shqiponja eSIM.', 48, 700);
    doc.text('This is an electronically generated invoice and does not require a signature.', 48, 714);

    doc.end();
  });
}

function contactConfirmationTemplate(name, message) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">E morëm mesazhin tënd! 📩</h2>
    ${eagleGuideCard('agroni', 'Une jam Agroni. Te kthejme pergjigje sa me shpejt; live chat eshte aktiv ne faqe.')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">
      Përshëndetje, ${escapeHtml(name)}! Faleminderit që na kontaktove. Do të të përgjigjemi sa më shpejt.
    </p>
    <div style="background:#f8f8fa;border-radius:12px;padding:20px 24px;margin:0 0 16px;border-left:4px solid ${BRAND_RED}">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px">Mesazhi yt</p>
      <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.6">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    </div>
  `, 'E morëm mesazhin tënd');
}

function contactAdminTemplate(name, email, message) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Mesazh i ri nga kontakti 📬</h2>
    ${eagleGuideCard('agroni', 'Mesazh i ri ne inbox. Jepi prioritet nese perdoruesi kerkon aktivizim ose problem me fjalekalim.')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px;overflow:hidden;margin:0 0 16px">
      <tr>
        <td style="padding:20px 24px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#71717a">Emri</td>
              <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#18181b">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#71717a">Email</td>
              <td align="right" style="padding:4px 0;font-size:14px;color:#18181b"><a href="mailto:${escapeHtml(email)}" style="color:${BRAND_RED}">${escapeHtml(email)}</a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="background:#f8f8fa;border-radius:12px;padding:20px 24px;border-left:4px solid ${BRAND_RED}">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px">Mesazhi</p>
      <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.6">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    </div>
  `, 'Mesazh i ri nga forma e kontaktit');
}

async function esimReadyTemplate({ orderId, packageFlag, packageName, price, iccid, qrData, qrCodeUrl, accessToken }) {
  const priceDisplay = price ? `€${Number(price).toFixed(2)}` : '';
  let qrImageSrc = qrCodeUrl || null;
  if (!qrImageSrc && qrData) {
    try {
      qrImageSrc = await QRCode.toDataURL(qrData, { width: 250, margin: 2, color: { dark: '#0a0a0a', light: '#ffffff' } });
    } catch (err) {
      console.error('[EMAIL] QR generation failed:', err.message);
    }
  }
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">eSIM juaj është gati! 🚀</h2>
    ${eagleGuideCard('glauku', 'Glauku ketu! eSIM-i yt eshte provizionuar dhe gati per aktivizim. Skano QR kodin dhe je i lidhur!')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">
      eSIM-i juaj u aprovua dhe është gati për t'u aktivizuar. Ja detajet:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px;overflow:hidden;margin:0 0 24px">
      <tr>
        <td style="background:${BRAND_RED};padding:12px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="font-size:14px;font-weight:700;color:#ffffff">🎉 eSIM GATI</span></td>
              <td align="right"><span style="font-size:13px;color:#ffffff;opacity:0.85">#${orderId}</span></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Paketa</td>
              <td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#18181b">${packageFlag || ''} ${escapeHtml(packageName || '')}</td>
            </tr>
            ${priceDisplay ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Çmimi</td>
              <td align="right" style="padding:6px 0;font-size:14px;font-weight:600;color:#18181b">${priceDisplay}</td>
            </tr>` : ''}
            ${iccid ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">ICCID</td>
              <td align="right" style="padding:6px 0;font-size:13px;font-weight:500;color:#18181b;font-family:monospace">${escapeHtml(iccid)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#71717a">Statusi</td>
              <td align="right" style="padding:6px 0"><span style="display:inline-block;background:#dcfce7;color:#166534;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:600">✓ Gati për aktivizim</span></td>
            </tr>
          </table>
          ${qrImageSrc ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #e4e4e7;padding-top:16px">
            <tr>
              <td align="center" style="padding:12px 0 8px">
                <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b">Skano kodin QR për ta aktivizuar:</p>
                <img src="${qrImageSrc}" alt="eSIM QR Code" width="200" height="200" style="display:block;margin:0 auto;border-radius:12px;border:2px solid #e4e4e7" />
              </td>
            </tr>
          </table>` : ''}
          ${qrData ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
            <tr><td style="font-size:12px;color:#71717a;padding-bottom:4px">Kodi manual:</td></tr>
            <tr><td style="font-size:11px;font-family:monospace;color:#18181b;word-break:break-all;background:#ffffff;padding:10px;border-radius:8px;border:1px solid #e4e4e7">${escapeHtml(qrData)}</td></tr>
          </table>` : ''}
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#18181b">Si ta aktivizosh? 📱</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;font-size:14px;color:#52525b"><strong style="color:${BRAND_RED}">1.</strong> Shko te <strong>Cilësimet</strong> → <strong>Celular</strong> → <strong>Shto Plan eSIM</strong></td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#52525b"><strong style="color:${BRAND_RED}">2.</strong> Skano QR kodin ose fut kodin manualisht</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#52525b"><strong style="color:${BRAND_RED}">3.</strong> Aktivizo kur të arrish në destinacion</td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
      <tr><td align="center">
        <a href="${FRONTEND_URL}/porosi/${orderId}${accessToken ? `?token=${accessToken}` : ''}" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Shiko Porosinë</a>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:13px;color:#71717a;text-align:center">
      ${EAGLE_PERSONAS.agroni.emoji} ${EAGLE_PERSONAS.agroni.name} eshte online per suport: <a href="${FRONTEND_URL}/kontakti" style="color:${BRAND_RED};font-weight:600;text-decoration:none">Hap Live Chat</a>
    </p>
  `, 'eSIM juaj është gati për aktivizim!');
}

function monthlyReportTemplate({ month, totalOrders, paidOrders, totalRevenue, newUsers, topPackages }) {
  const rows = (topPackages || []).slice(0, 5).map(p =>
    `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#18181b">${escapeHtml(p.name || '')}</td>
      <td align="right" style="padding:8px 12px;font-size:13px;font-weight:600;color:#18181b">${p.count}</td>
      <td align="right" style="padding:8px 12px;font-size:13px;font-weight:600;color:${BRAND_RED}">€${Number(p.revenue || 0).toFixed(2)}</td>
    </tr>`
  ).join('');
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Raporti Mujor 📊</h2>
    ${eagleGuideCard('enkela', 'Raporti automatik i muajit. Keto jane shifrat kryesore per periudhen e kaluar.')}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6">Periudha: <strong>${escapeHtml(month)}</strong></p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr>
        <td width="48%" style="padding:0 6px 0 0">
          <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;text-align:center">
            <p style="margin:0;font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.5px">Të ardhura</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#166534">€${Number(totalRevenue || 0).toFixed(2)}</p>
          </div>
        </td>
        <td width="52%" style="padding:0 0 0 6px">
          <div style="background:#fff7ed;border-radius:12px;padding:16px 20px;text-align:center">
            <p style="margin:0;font-size:12px;font-weight:600;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px">Porosi të paguara</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#9a3412">${paidOrders}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#9a3412">${totalOrders} gjithsej</p>
          </div>
        </td>
      </tr>
    </table>

    <div style="background:#faf5ff;border-radius:12px;padding:16px 20px;margin:0 0 24px;text-align:center">
      <p style="margin:0;font-size:12px;font-weight:600;color:#6b21a8;text-transform:uppercase;letter-spacing:0.5px">Përdorues të rinj</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#6b21a8">+${newUsers}</p>
    </div>

    ${rows ? `
    <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#18181b">Top Paketa</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #e4e4e7">
      <thead>
        <tr style="background:#f4f4f5">
          <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#71717a;text-align:left">Paketa</th>
          <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#71717a;text-align:right">Porosi</th>
          <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#71717a;text-align:right">Të ardhura</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>` : ''}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
      <tr><td align="center">
        <a href="${FRONTEND_URL}/admin" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Shiko Dashboard</a>
      </td></tr>
    </table>
  `, `Raporti Mujor — ${escapeHtml(month)}`);
}

module.exports = {
  sendMail,
  escapeHtml,
  verifyEmailTemplate,
  resetPasswordTemplate,
  orderConfirmationTemplate,
  esimReadyTemplate,
  welcomeEmailTemplate,
  paymentReceiptTemplate,
  generateInvoicePdfBuffer,
  contactConfirmationTemplate,
  contactAdminTemplate,
  monthlyReportTemplate,
};

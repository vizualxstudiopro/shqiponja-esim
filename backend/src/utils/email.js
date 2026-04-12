const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'Shqiponja eSIM <suport@shqiponjaesim.com>';
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

/* ═══════════════════════════════════════════════════════════════
   BRANDED HTML EMAIL TEMPLATES
   All emails share a unified layout matching Shqiponja eSIM branding
   ═══════════════════════════════════════════════════════════════ */

const BRAND_RED = '#C8102E';
const BRAND_DARK = '#9B0D23';

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

async function orderConfirmationTemplate({ orderId, packageFlag, packageName, price, iccid, qrData, qrCodeUrl }) {
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
        <a href="${FRONTEND_URL}/porosi/${orderId}" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Shiko Porosinë</a>
      </td></tr>
    </table>
  `, 'Porosia jote u konfirmua');
}

function welcomeEmailTemplate(name) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Mirësevini, ${escapeHtml(name)}! 🎉</h2>
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

function paymentReceiptTemplate({ orderId, packageName, packageFlag, price, email, date }) {
  const priceDisplay = price ? `€${Number(price).toFixed(2)}` : '';
  const dateDisplay = date ? new Date(date).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">Fatura e pagesës 🧾</h2>
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
        <a href="${FRONTEND_URL}/porosi/${orderId}" class="btn" style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">Shiko Porosinë</a>
      </td></tr>
    </table>
  `, 'Fatura e pagesës — Shqiponja eSIM');
}

function contactConfirmationTemplate(name, message) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">E morëm mesazhin tënd! 📩</h2>
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

module.exports = {
  sendMail,
  escapeHtml,
  verifyEmailTemplate,
  resetPasswordTemplate,
  orderConfirmationTemplate,
  welcomeEmailTemplate,
  paymentReceiptTemplate,
  contactConfirmationTemplate,
  contactAdminTemplate,
};

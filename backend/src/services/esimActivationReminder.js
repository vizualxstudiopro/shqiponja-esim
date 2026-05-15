const db = require('../db/client');
const { sendTransactionalEmail } = require('../lib/emailService');

// Dërgo reminder email pas 48 orësh nëse eSIM nuk duket e aktivizuar
// "Nuk duket e aktivizuar" = iccid ekziston (eSIM u dërgua) por esim_status != 'used'
// Shënimi: ne nuk mund ta dimë me siguri nëse klienti e aktivizoi (nuk ka webhook nga Airalo)
// Kjo email është thjesht kujtues miqësor

const REMINDER_AFTER_HOURS = Number(process.env.ESIM_REMINDER_HOURS || 48);

function buildReminderHtml({ orderId, packageName, packageFlag, iccid, qrCodeUrl, accessToken }) {
  const orderUrl = accessToken
    ? `${process.env.FRONTEND_URL || 'https://shqiponjaesim.com'}/porosi/${orderId}?token=${accessToken}`
    : `${process.env.FRONTEND_URL || 'https://shqiponjaesim.com'}/porosi/${orderId}`;

  return `
<!DOCTYPE html>
<html lang="sq">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:32px 32px 24px;text-align:center">
            <div style="font-size:40px;margin-bottom:8px">🦅</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Shqiponja eSIM</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 12px;color:#111827;font-size:18px">Ke eSIM-in gati? 📱</h2>
            <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6">
              Porosia jote <strong style="color:#111827">${packageFlag} ${packageName}</strong> u procesua me sukses.
              Nëse nuk e ke instaluar ende eSIM-in, ja si ta bësh:
            </p>

            <!-- Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                  <span style="display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-weight:700;font-size:13px;margin-right:10px">1</span>
                  <span style="color:#374151;font-size:14px">Hap <strong>Cilësimet → Celular → Shto Plan Celular</strong></span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                  <span style="display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-weight:700;font-size:13px;margin-right:10px">2</span>
                  <span style="color:#374151;font-size:14px">Skano kodin QR nga faqja e porosisë tënde</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0">
                  <span style="display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:50%;width:24px;height:24px;text-align:center;line-height:24px;font-weight:700;font-size:13px;margin-right:10px">3</span>
                  <span style="color:#374151;font-size:14px">Aktivizo eSIM-in kur të arrish në destinacion</span>
                </td>
              </tr>
            </table>

            ${iccid ? `<p style="margin:0 0 8px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">ICCID</p><p style="margin:0 0 20px;font-family:monospace;font-size:13px;background:#f9fafb;border:1px solid #e5e7eb;padding:8px 12px;border-radius:8px;color:#374151">${iccid}</p>` : ''}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${orderUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:999px">
                    Shiko Porosinë &amp; QR Kodin →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center">
              Ke probleme? Na shkruaj te
              <a href="mailto:info@shqiponjaesim.com" style="color:#6366f1">info@shqiponjaesim.com</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px">© 2026 Shqiponja eSIM · VALA TECH 2026 LLC</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEsimActivationReminders() {
  const cutoffStart = new Date(Date.now() - (REMINDER_AFTER_HOURS + 1) * 60 * 60 * 1000);
  const cutoffEnd   = new Date(Date.now() - REMINDER_AFTER_HOURS * 60 * 60 * 1000);

  // Gjej porosi të paguara me eSIM të dërguar, jo të kujtuara ende
  const result = await db.query(
    `SELECT o.id, o.email, o.iccid, o.qr_code_url, o.access_token, o.esim_status, o.paid_at,
            p.name AS package_name, p.flag AS package_flag
     FROM orders o
     JOIN packages p ON p.id = o.package_id
     WHERE o.payment_status = 'paid'
       AND o.status = 'completed'
       AND o.iccid IS NOT NULL
       AND o.esim_reminder_sent_at IS NULL
       AND o.paid_at >= $1
       AND o.paid_at < $2`,
    [cutoffStart, cutoffEnd]
  );

  const orders = result.rows;
  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      await sendTransactionalEmail({
        toEmail: order.email,
        subject: `Ke eSIM-in gati? — ${order.package_flag} ${order.package_name} — Shqiponja eSIM`,
        html: buildReminderHtml({
          orderId: order.id,
          packageName: order.package_name,
          packageFlag: order.package_flag,
          iccid: order.iccid,
          qrCodeUrl: order.qr_code_url,
          accessToken: order.access_token,
        }),
        logLabel: 'ESIM ACTIVATION REMINDER',
        senderType: 'noreply',
      });

      await db.query(
        'UPDATE orders SET esim_reminder_sent_at = NOW() WHERE id = $1',
        [order.id]
      );

      sent++;
      console.log(`[ESIM REMINDER] Sent to order #${order.id} (${order.email})`);
    } catch (err) {
      failed++;
      console.error(`[ESIM REMINDER] Failed for order #${order.id}:`, err.message);
    }
  }

  return { checked: orders.length, sent, failed };
}

module.exports = { sendEsimActivationReminders };

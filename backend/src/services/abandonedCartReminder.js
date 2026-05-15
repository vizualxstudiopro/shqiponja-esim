const db = require('../db/client');
const { sendTransactionalEmail } = require('../lib/emailService');

// Dërgo email recovery pas 1 ore nëse dikush filloi checkout por nuk pagoi
const ABANDON_AFTER_HOURS = Number(process.env.ABANDONED_CART_HOURS || 1);
// Mos dërgo nëse porosia është shumë e vjetër (p.sh. mbi 7 ditë — nuk ia vlen)
const MAX_AGE_HOURS = Number(process.env.ABANDONED_CART_MAX_AGE_HOURS || 168); // 7 ditë

function buildAbandonedCartHtml({ orderId, customerName, packageName, packageFlag, finalPrice, currency, checkoutUrl }) {
  const firstName = customerName ? customerName.split(' ')[0] : null;
  const greeting = firstName ? `Përshëndetje ${firstName},` : 'Përshëndetje,';

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
            <p style="margin:0 0 4px;color:#6b7280;font-size:14px">${greeting}</p>
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">Ke lënë diçka prapa! 🛒</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
              E ke filluar porosinë për eSIM-in tënd, por ndoshta ke pasur diçka tjetër për të bërë.
              Paketa jote po të pret:
            </p>

            <!-- Package card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              <tr>
                <td style="padding:20px 24px;background:#f9fafb">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="font-size:32px;margin-bottom:6px">${packageFlag}</div>
                        <div style="font-size:17px;font-weight:700;color:#111827">${packageName}</div>
                        <div style="font-size:13px;color:#9ca3af;margin-top:2px">Porosi #${orderId}</div>
                      </td>
                      <td align="right" style="vertical-align:top">
                        <div style="font-size:26px;font-weight:800;color:#6366f1">${currency} ${Number(finalPrice).toFixed(2)}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td align="center">
                  <a href="${checkoutUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:999px;box-shadow:0 4px 12px rgba(99,102,241,.35)">
                    Përfundo Blerjen →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Trust signals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
              <tr>
                <td style="padding:6px 0;border-top:1px solid #f3f4f6">
                  <span style="font-size:13px;color:#6b7280">🔒 Pagesë e sigurt me Stripe</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-top:1px solid #f3f4f6">
                  <span style="font-size:13px;color:#6b7280">⚡ eSIM aktivizohet menjëherë pas pagesës</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-top:1px solid #f3f4f6">
                  <span style="font-size:13px;color:#6b7280">↩️ Rimbursim brenda 14 ditëve nëse nuk aktivizohet</span>
                </td>
              </tr>
            </table>

            <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;text-align:center">
              Ke pyetje? Na shkruaj te
              <a href="mailto:info@shqiponjaesim.com" style="color:#6366f1">info@shqiponjaesim.com</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px">© 2026 Shqiponja eSIM · VALA TECH 2026 LLC</p>
            <p style="margin:4px 0 0;color:#d1d5db;font-size:11px">Nëse nuk e ke filluar ti këtë porosi, injoroe këtë email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendAbandonedCartReminders() {
  const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://shqiponjaesim.com').replace(/\/$/, '');

  const cutoffStart = new Date(Date.now() - (ABANDON_AFTER_HOURS + 0.5) * 60 * 60 * 1000);
  const cutoffEnd   = new Date(Date.now() - ABANDON_AFTER_HOURS * 60 * 60 * 1000);
  const maxAge      = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  const result = await db.query(
    `SELECT o.id, o.email, o.customer_name, o.access_token, o.final_price, o.created_at,
            p.name AS package_name, p.flag AS package_flag, p.currency
     FROM orders o
     JOIN packages p ON p.id = o.package_id
     WHERE o.payment_status = 'unpaid'
       AND o.abandoned_cart_sent_at IS NULL
       AND o.created_at >= $1
       AND o.created_at < $2
       AND o.created_at >= $3`,
    [maxAge, cutoffEnd, cutoffStart]
  );

  // Note: cutoffStart/cutoffEnd window = orders created between (now-1.5h) and (now-1h)
  // This means we catch orders in a 30-min window each run, no duplicates thanks to abandoned_cart_sent_at

  const orders = result.rows;
  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    // Build checkout URL — link back to the buy page (klienti duhet të rifillojë checkout)
    const packageId = await db.query(
      'SELECT package_id FROM orders WHERE id = $1',
      [order.id]
    ).then(r => r.rows[0]?.package_id);

    const checkoutUrl = packageId
      ? `${FRONTEND_URL}/bli/${packageId}`
      : `${FRONTEND_URL}`;

    try {
      await sendTransactionalEmail({
        toEmail: order.email,
        subject: `Ke lënë eSIM-in prapa — ${order.package_flag} ${order.package_name}`,
        html: buildAbandonedCartHtml({
          orderId: order.id,
          customerName: order.customer_name,
          packageName: order.package_name,
          packageFlag: order.package_flag,
          finalPrice: order.final_price,
          currency: order.currency || 'EUR',
          checkoutUrl,
        }),
        logLabel: 'ABANDONED CART',
        senderType: 'noreply',
      });

      await db.query(
        'UPDATE orders SET abandoned_cart_sent_at = NOW() WHERE id = $1',
        [order.id]
      );

      sent++;
      console.log(`[ABANDONED CART] Sent to order #${order.id} (${order.email})`);
    } catch (err) {
      failed++;
      console.error(`[ABANDONED CART] Failed for order #${order.id}:`, err.message);
    }
  }

  return { checked: orders.length, sent, failed };
}

module.exports = { sendAbandonedCartReminders };

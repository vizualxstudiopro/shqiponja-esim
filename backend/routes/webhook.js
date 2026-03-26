const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { sendMail } = require('../lib/email');
const { sendTemplateEmail } = require('../lib/emailService');
const airalo = require('../lib/airaloService');

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;

function verifyPaddleSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const parts = {};
  signature.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > 0) parts[part.slice(0, idx)] = part.slice(idx + 1);
  });
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(h1, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

// POST /api/webhook/paddle - Paddle webhook handler
router.post('/', async (req, res) => {
  if (!PADDLE_WEBHOOK_SECRET) {
    console.error('Webhook: PADDLE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const sig = req.headers['paddle-signature'];
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (!verifyPaddleSignature(rawBody, sig, PADDLE_WEBHOOK_SECRET)) {
    console.error('Webhook: Paddle signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  console.log(`Webhook received: ${event.event_type} [${event.event_id}]`);

  if (event.event_type === 'transaction.completed') {
    const txnData = event.data;
    const orderId = txnData.custom_data?.order_id;

    if (orderId) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(orderId));
      if (!order) {
        console.error('Webhook: Order not found:', orderId);
        return res.json({ received: true });
      }

      const qrData = `SHQIPONJA-ESIM-${orderId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Try to order real eSIM from Airalo
      const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(order.package_id);
      let airaloQr = qrData;
      let iccid = null;
      let qrCodeUrl = null;
      let activationCode = null;
      let airaloOrderId = null;

      if (airalo.isEnabled() && pkg && pkg.airalo_package_id) {
        try {
          const airaloData = await airalo.createOrder(pkg.airalo_package_id, 1, `Order #${orderId}`);
          const esim = airaloData?.data?.sims?.[0];
          if (esim) {
            airaloQr = esim.qrcode || qrData;
            iccid = esim.iccid || null;
            qrCodeUrl = esim.qrcode_url || null;
            activationCode = esim.direct_apple_installation_url || null;
            airaloOrderId = String(airaloData.data.id);
            console.log(`[AIRALO] eSIM ordered for Order #${orderId}, ICCID: ${iccid}`);
          }
        } catch (err) {
          console.error(`[AIRALO ORDER ERROR] Order #${orderId}:`, err.message);
        }
      }

      db.prepare(`
        UPDATE orders SET payment_status = ?, status = ?, qr_data = ?,
          airalo_order_id = ?, iccid = ?, esim_status = ?, qr_code_url = ?, activation_code = ?
        WHERE id = ?
      `).run('paid', 'completed', airaloQr,
        airaloOrderId, iccid, iccid ? 'active' : null,
        qrCodeUrl, activationCode, Number(orderId));
      console.log(`✔ Webhook: Order #${orderId} marked as paid (event: ${event.event_id})`);

      // Send confirmation email — re-fetch the updated order
      const updatedOrder = db.prepare(`
        SELECT o.*, p.name AS package_name, p.flag AS package_flag
        FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.id = ?
      `).get(Number(orderId));
      if (updatedOrder) {
        const customerEmail = txnData.customer?.email || txnData.custom_data?.email || updatedOrder.email;
        const country = updatedOrder.package_name || '';
        const firstName = txnData.custom_data?.firstname || customerEmail.split('@')[0];
        const esimCode = updatedOrder.iccid || updatedOrder.qr_data || airaloQr;

        // Dërgo me Brevo Template #1 (primar), SMTP si fallback
        sendTemplateEmail(customerEmail, 1, {
          FIRSTNAME: firstName,
          COUNTRY: country,
          ACTIVATION_CODE: esimCode,
        }).catch(err => {
          console.error('Brevo template email error:', err);
          sendMail(
            updatedOrder.email,
            'Porosia jote — Shqiponja eSIM',
            `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <h2>🦅 Shqiponja eSIM</h2>
              <p>Faleminderit për blerjen! Porosia jote #${orderId} është konfirmuar.</p>
              <div style="background:#f4f4f5;padding:16px;border-radius:12px;margin:16px 0">
                <p><strong>${updatedOrder.package_flag} ${updatedOrder.package_name}</strong></p>
                <p>ICCID: <strong>${updatedOrder.iccid || 'N/A'}</strong></p>
                <p>QR Kodi: <strong>${updatedOrder.qr_data}</strong></p>
              </div>
              <p>Skano QR kodin në Cilësimet > Celular > Shto Plan eSIM për ta aktivizuar.</p>
            </div>`
          ).catch(err2 => console.error('SMTP fallback error:', err2));
        });
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;

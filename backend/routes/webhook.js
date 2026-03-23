const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { sendMail } = require('../lib/email');

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
router.post('/', (req, res) => {
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
      const existingOrder = db.prepare('SELECT id FROM orders WHERE id = ?').get(Number(orderId));
      if (!existingOrder) {
        console.error('Webhook: Order not found:', orderId);
        return res.json({ received: true });
      }

      const qrData = `SHQIPONJA-ESIM-${orderId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      db.prepare(
        'UPDATE orders SET payment_status = ?, status = ?, qr_data = ? WHERE id = ?'
      ).run('paid', 'completed', qrData, Number(orderId));
      console.log(`✔ Webhook: Order #${orderId} marked as paid (event: ${event.event_id})`);

      // Send confirmation email
      const order = db.prepare(`
        SELECT o.*, p.name AS package_name, p.flag AS package_flag
        FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.id = ?
      `).get(Number(orderId));
      if (order) {
        sendMail(
          order.email,
          'Porosia jote — Shqiponja eSIM',
          `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2>🦅 Shqiponja eSIM</h2>
            <p>Faleminderit për blerjen! Porosia jote #${orderId} është konfirmuar.</p>
            <div style="background:#f4f4f5;padding:16px;border-radius:12px;margin:16px 0">
              <p><strong>${order.package_flag} ${order.package_name}</strong></p>
              <p>QR Kodi yt: <strong>${qrData}</strong></p>
            </div>
            <p>Skano QR kodin në Cilësimet > Celular > Shto Plan eSIM për ta aktivizuar.</p>
          </div>`
        ).catch(err => console.error('Order email error:', err));
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;

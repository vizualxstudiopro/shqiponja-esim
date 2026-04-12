const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { sendTransactionalEmail } = require('../lib/emailService');
const { orderConfirmationTemplate, paymentReceiptTemplate } = require('../lib/email');
const airalo = require('../lib/airaloService');

const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

function verifyLemonSqueezySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

// POST /api/webhook/lemonsqueezy - Lemon Squeezy webhook handler
router.post('/', async (req, res) => {
  if (!LS_WEBHOOK_SECRET) {
    console.error('Webhook: LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    await db.query('INSERT INTO webhook_logs (source, event_type, payload, status, error) VALUES ($1,$2,$3,$4,$5)', ['lemonsqueezy', 'unknown', '', 'failed', 'Secret not configured']);
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const sig = req.headers['x-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  console.log('Webhook: body type =', typeof req.body, ', isBuffer =', Buffer.isBuffer(req.body), ', sig present =', !!sig);

  if (!verifyLemonSqueezySignature(rawBody, sig, LS_WEBHOOK_SECRET)) {
    console.error('Webhook: Lemon Squeezy signature verification failed');
    await db.query('INSERT INTO webhook_logs (source, event_type, payload, status, error) VALUES ($1,$2,$3,$4,$5)', ['lemonsqueezy', 'unknown', rawBody.slice(0, 5000), 'failed', 'Invalid signature']);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody);
  const eventName = event.meta?.event_name;
  const customData = event.meta?.custom_data;
  const webhookOrderId = customData?.order_id ? Number(customData.order_id) : null;
  console.log(`Webhook received: ${eventName}`);

  // Log the webhook
  const logResult = await db.query(
    'INSERT INTO webhook_logs (source, event_type, order_id, payload, status) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    ['lemonsqueezy', eventName, webhookOrderId, rawBody.slice(0, 10000), 'received']
  );
  const logId = logResult.rows[0].id;

  try {
  if (eventName === 'order_created') {
    const orderId = customData?.order_id;

    if (orderId) {
      const order = (await db.query('SELECT * FROM orders WHERE id = $1', [Number(orderId)])).rows[0];
      if (!order) {
        console.error('Webhook: Order not found:', orderId);
        await db.query('UPDATE webhook_logs SET status=$1, error=$2 WHERE id=$3', ['failed', 'Order not found: ' + orderId, logId]);
        return res.json({ received: true });
      }

      // Store the Lemon Squeezy order ID
      const lsOrderId = String(event.data?.id || '');

      const qrData = `SHQIPONJA-ESIM-${orderId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Try to order real eSIM from Airalo
      const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [order.package_id])).rows[0];
      let airaloQr = qrData;
      let iccid = null;
      let qrCodeUrl = null;
      let activationCode = null;
      let airaloOrderId = null;

      const esimProvisioningAttempted = airalo.isEnabled() && pkg && pkg.airalo_package_id;
      let provisioningFailed = false;
      if (esimProvisioningAttempted) {
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
          } else {
            provisioningFailed = true;
          }
        } catch (err) {
          console.error(`[AIRALO ORDER ERROR] Order #${orderId}:`, err.message);
          provisioningFailed = true;
        }
      }

      // Determine order status: only "completed" if eSIM was provisioned or not needed
      const orderStatus = (esimProvisioningAttempted && provisioningFailed) ? 'awaiting_esim' : 'completed';

      await db.query(`
        UPDATE orders SET payment_status = $1, status = $2, qr_data = $3,
          airalo_order_id = $4, iccid = $5, esim_status = $6, qr_code_url = $7, activation_code = $8,
          ls_order_id = $9
        WHERE id = $10
      `, ['paid', orderStatus, provisioningFailed ? null : airaloQr,
        airaloOrderId, iccid, iccid ? 'active' : (esimProvisioningAttempted ? 'provisioning_failed' : null),
        qrCodeUrl, activationCode, lsOrderId, Number(orderId)]);
      console.log(`✔ Webhook: Order #${orderId} marked as paid, status: ${orderStatus} (LS order: ${lsOrderId})`);

      // Send confirmation email
      const updatedOrder = (await db.query(`
        SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price
        FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.id = $1
      `, [Number(orderId)])).rows[0];
      if (updatedOrder) {
        const customerEmail = event.data?.attributes?.user_email || customData?.email || updatedOrder.email;

        if (provisioningFailed) {
          // Airalo failed — send payment confirmation without QR, tell customer we're working on it
          sendTransactionalEmail({
            toEmail: customerEmail,
            subject: 'Pagesa u konfirmua — eSIM po përgatitet — Shqiponja eSIM',
            html: await orderConfirmationTemplate({
              orderId,
              packageFlag: updatedOrder.package_flag,
              packageName: updatedOrder.package_name,
              price: updatedOrder.price,
              iccid: null,
              qrData: null,
              qrCodeUrl: null,
            }),
            logLabel: 'ORDER EMAIL (awaiting eSIM)',
          }).catch(err => {
            console.error('Order confirmation delivery failed:', err);
          });
        } else {
          sendTransactionalEmail({
            toEmail: customerEmail,
            subject: 'Porosia jote — Shqiponja eSIM',
            html: await orderConfirmationTemplate({
              orderId,
              packageFlag: updatedOrder.package_flag,
              packageName: updatedOrder.package_name,
              price: updatedOrder.price,
              iccid: updatedOrder.iccid,
              qrData: updatedOrder.qr_data,
              qrCodeUrl: updatedOrder.qr_code_url,
            }),
            logLabel: 'ORDER EMAIL',
          }).catch(err => {
            console.error('Order confirmation delivery failed:', err);
          });

          // Send payment receipt email
          sendTransactionalEmail({
            toEmail: customerEmail,
            subject: 'Fatura e pagesës — Shqiponja eSIM 🧾',
            html: paymentReceiptTemplate({
              orderId,
              packageName: updatedOrder.package_name,
              packageFlag: updatedOrder.package_flag,
              price: updatedOrder.price,
              email: customerEmail,
              date: new Date(),
            }),
            logLabel: 'PAYMENT RECEIPT',
          }).catch(err => {
            console.error('Payment receipt delivery failed:', err);
          });
        }
      }
    }
  }

  await db.query('UPDATE webhook_logs SET status=$1 WHERE id=$2', ['success', logId]);
  res.json({ received: true });
  } catch (webhookErr) {
    console.error('Webhook processing error:', webhookErr);
    await db.query('UPDATE webhook_logs SET status=$1, error=$2 WHERE id=$3', ['failed', String(webhookErr.message).slice(0, 1000), logId]);
    res.json({ received: true });
  }
});

module.exports = router;

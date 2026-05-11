const express = require('express');
const Stripe = require('stripe');
const db = require('../db');
const { fulfillPaidOrder } = require('../src/services/paymentFulfillment');

const router = express.Router();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getStripe() {
  return STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
}

router.post('/', async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Stripe webhook nuk është konfiguruar' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Invalid signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const rawPayload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  const orderId = Number(event.data?.object?.metadata?.order_id || event.data?.object?.client_reference_id || 0) || null;

  const existing = (await db.query('SELECT id FROM webhook_logs WHERE external_event_id = $1 LIMIT 1', [event.id])).rows[0];
  if (existing) {
    return res.json({ received: true, duplicate: true });
  }

  const logResult = await db.query(
    'INSERT INTO webhook_logs (source, external_event_id, event_type, order_id, payload, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    ['stripe', event.id, event.type, orderId, rawPayload.slice(0, 10000), 'received']
  );
  const logId = logResult.rows[0].id;

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid' && orderId) {
        await db.query('UPDATE orders SET stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id) WHERE id = $2', [String(session.payment_intent || ''), orderId]);
        await fulfillPaidOrder({
          orderId,
          providerOrderId: session.id,
          provider: 'stripe',
          customerEmail: session.customer_details?.email || session.customer_email || undefined,
          customerPhone: session.customer_details?.phone || session.metadata?.phone || undefined,
          paymentIntentId: session.payment_intent || undefined,
        });
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const piOrderId = Number(paymentIntent.metadata?.order_id || 0) || null;
      if (piOrderId) {
        await db.query('UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2', [paymentIntent.id, piOrderId]);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const failedOrderId = Number(paymentIntent.metadata?.order_id || 0) || null;
      if (failedOrderId) {
        await db.query('UPDATE orders SET payment_status = $1, status = $2, stripe_payment_intent_id = $3 WHERE id = $4', ['failed', 'pending', paymentIntent.id, failedOrderId]);
      }
    }

    await db.query('UPDATE webhook_logs SET status = $1 WHERE id = $2', ['success', logId]);
    return res.json({ received: true });
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Processing error:', err.message);
    await db.query('UPDATE webhook_logs SET status = $1, error = $2 WHERE id = $3', ['failed', String(err.message || err).slice(0, 1000), logId]);
    return res.json({ received: true });
  }
});

module.exports = router;

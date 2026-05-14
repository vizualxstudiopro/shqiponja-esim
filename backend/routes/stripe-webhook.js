const express = require('express');
const crypto = require('crypto');
const Stripe = require('stripe');
const db = require('../db');
const airalo = require('../lib/airaloService');
const { fulfillPaidOrder, sendPaidOrderEmails } = require('../src/services/paymentFulfillment');
const { assertCardAttemptsAllowed, recordFailedCardAttempt } = require('../src/services/fraudPrevention');

const router = express.Router();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getStripe() {
  return STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
}

async function findLocalPackageId(airaloPackageId) {
  const pkg = (await db.query(
    'SELECT id FROM packages WHERE airalo_package_id = $1 LIMIT 1',
    [airaloPackageId]
  )).rows[0];

  if (!pkg) {
    const error = new Error(`Paketa Airalo nuk u gjet në databazë: ${airaloPackageId}`);
    error.statusCode = 500;
    throw error;
  }

  return Number(pkg.id);
}

async function saveCompletedStripeOrder({ customerEmail, localPackageId, stripeSessionId, iccid, qrCodeUrl, airaloOrderId, orderStatus, esimStatus }) {
  const existingOrder = (await db.query(
    'SELECT id FROM orders WHERE stripe_checkout_session_id = $1 LIMIT 1',
    [stripeSessionId]
  )).rows[0];

  if (existingOrder) {
    await db.query(
      `UPDATE orders
       SET email = $1,
           package_id = $2,
           stripe_checkout_session_id = $3,
           iccid = COALESCE($4, iccid),
           qr_code_url = COALESCE($5, qr_code_url),
           airalo_order_id = COALESCE($6, airalo_order_id),
           status = $7,
           payment_status = $8,
           esim_status = $9,
           paid_at = COALESCE(paid_at, NOW())
       WHERE id = $10`,
      [customerEmail, localPackageId, stripeSessionId, iccid, qrCodeUrl, airaloOrderId || null, orderStatus, 'paid', esimStatus, Number(existingOrder.id)]
    );

    return Number(existingOrder.id);
  }

  const accessToken = crypto.randomBytes(24).toString('hex');
  const insert = await db.query(
    `INSERT INTO orders (
      email, package_id, stripe_checkout_session_id, iccid, qr_code_url,
      airalo_order_id, status, payment_status, payment_provider, esim_status, access_token, paid_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
    RETURNING id`,
    [customerEmail, localPackageId, stripeSessionId, iccid, qrCodeUrl, airaloOrderId || null, orderStatus, 'paid', 'stripe', esimStatus, accessToken]
  );

  return Number(insert.rows[0].id);
}

async function processCompletedCheckoutSession(session) {
  const customerEmail = session.customer_details?.email || null;
  const airaloPackageId = session.metadata?.airalo_package_id || null;
  const stripeSessionId = session.id;
  const orderId = Number(session.metadata?.order_id || session.client_reference_id || 0) || null;

  if (!customerEmail) {
    const error = new Error('checkout.session.completed pa customer_details.email');
    error.statusCode = 400;
    throw error;
  }

  if (!airaloPackageId) {
    const error = new Error('checkout.session.completed pa metadata.airalo_package_id');
    error.statusCode = 400;
    throw error;
  }

  if (!airalo.isEnabled()) {
    const error = new Error('Airalo nuk është konfiguruar me AIRALO_CLIENT_ID dhe AIRALO_CLIENT_SECRET');
    error.statusCode = 500;
    throw error;
  }

  console.log('[STRIPE WEBHOOK] checkout.session.completed', {
    stripeSessionId,
    customerEmail,
    airaloPackageId,
    orderId,
  });

  // Try Airalo provisioning — gracefully degrade on failure
  let iccid = null;
  let qrCodeUrl = null;
  let airaloOrderId = null;
  let provisioningFailed = false;

  try {
    const airaloResponse = await airalo.createOrder(airaloPackageId, 1, `Stripe session ${stripeSessionId}`);
    const esim = airaloResponse?.data?.sims?.[0];
    qrCodeUrl = esim?.qrcode_url || esim?.qrcode || null;
    iccid = esim?.iccid || null;
    airaloOrderId = airaloResponse?.data?.id ? String(airaloResponse.data.id) : null;

    if (!iccid && !qrCodeUrl) {
      provisioningFailed = true;
      console.error('[STRIPE WEBHOOK] Airalo nuk ktheu ICCID/QR për session:', stripeSessionId);
    }
  } catch (err) {
    provisioningFailed = true;
    console.error('[STRIPE WEBHOOK] Airalo gabim për session', stripeSessionId, ':', err.message);
  }

  const orderStatus = provisioningFailed ? 'awaiting_esim' : 'completed';
  const esimStatus = iccid ? 'active' : (provisioningFailed ? 'provisioning_failed' : null);

  if (orderId) {
    await db.query(
      `UPDATE orders
       SET email = $1,
           stripe_checkout_session_id = $2,
           iccid = COALESCE($3, iccid),
           qr_code_url = COALESCE($4, qr_code_url),
           airalo_order_id = COALESCE($5, airalo_order_id),
           status = $6,
           payment_status = $7,
           payment_provider = $8,
           esim_status = $9,
           paid_at = NOW()
       WHERE id = $10`,
      [customerEmail, stripeSessionId, iccid, qrCodeUrl, airaloOrderId, orderStatus, 'paid', 'stripe', esimStatus, orderId]
    );

    return orderId;
  }

  const localPackageId = await findLocalPackageId(airaloPackageId);
  return saveCompletedStripeOrder({
    customerEmail,
    localPackageId,
    stripeSessionId,
    iccid,
    qrCodeUrl,
    airaloOrderId,
    orderStatus,
    esimStatus,
  });
}

async function resolveCardFingerprint(stripe, paymentIntent) {
  const directFingerprint = paymentIntent.last_payment_error?.payment_method?.card?.fingerprint;
  if (directFingerprint) {
    return directFingerprint;
  }

  const paymentMethodId = typeof paymentIntent.payment_method === 'string'
    ? paymentIntent.payment_method
    : paymentIntent.payment_method?.id;

  if (paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod?.card?.fingerprint) {
        return paymentMethod.card.fingerprint;
      }
    } catch (err) {
      console.error('[STRIPE WEBHOOK] Could not retrieve payment method fingerprint:', err.message);
    }
  }

  if (typeof paymentIntent.latest_charge === 'string') {
    try {
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
      if (charge?.payment_method_details?.card?.fingerprint) {
        return charge.payment_method_details.card.fingerprint;
      }
    } catch (err) {
      console.error('[STRIPE WEBHOOK] Could not retrieve charge fingerprint:', err.message);
    }
  }

  return null;
}

async function handleStripeWebhook(req, res) {
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

  const existing = (await db.query(
    'SELECT id, status FROM webhook_logs WHERE external_event_id = $1 ORDER BY id DESC LIMIT 1',
    [event.id]
  )).rows[0];
  if (existing && existing.status === 'success') {
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
      if (session.payment_status === 'paid') {
        const airaloPackageId = session.metadata?.airalo_package_id || null;

        if (airaloPackageId) {
          const savedOrderId = await processCompletedCheckoutSession(session);
          if (savedOrderId) {
            await db.query(
              'UPDATE orders SET stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id) WHERE id = $2',
              [String(session.payment_intent || ''), savedOrderId]
            );
            await sendPaidOrderEmails({
              orderId: savedOrderId,
              customerEmail: session.customer_details?.email || session.customer_email || undefined,
            });
          }
        } else if (orderId) {
          await db.query(
            'UPDATE orders SET stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id) WHERE id = $2',
            [String(session.payment_intent || ''), orderId]
          );

          await fulfillPaidOrder({
            orderId,
            providerOrderId: session.id,
            provider: 'stripe',
            customerEmail: session.customer_details?.email || session.customer_email || undefined,
            customerPhone: session.customer_details?.phone || session.metadata?.phone || undefined,
            paymentIntentId: session.payment_intent || undefined,
          });
        } else {
          const error = new Error('checkout.session.completed pa metadata.airalo_package_id dhe pa order_id');
          error.statusCode = 400;
          throw error;
        }
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const piOrderId = Number(paymentIntent.metadata?.order_id || 0) || null;
      if (piOrderId) {
        await db.query('UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2', [paymentIntent.id, piOrderId]);

        const order = (await db.query('SELECT id, payment_status FROM orders WHERE id = $1', [piOrderId])).rows[0];
        if (order && order.payment_status !== 'paid') {
          await fulfillPaidOrder({
            orderId: piOrderId,
            providerOrderId: paymentIntent.id,
            provider: 'stripe',
            customerEmail: paymentIntent.metadata?.customer_email || paymentIntent.receipt_email || undefined,
            customerPhone: paymentIntent.metadata?.phone || undefined,
            paymentIntentId: paymentIntent.id,
          });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const failedOrderId = Number(paymentIntent.metadata?.order_id || 0) || null;
      const cardFingerprint = await resolveCardFingerprint(stripe, paymentIntent);

      if (cardFingerprint) {
        await recordFailedCardAttempt(db, {
          orderId: failedOrderId,
          stripePaymentIntentId: paymentIntent.id,
          cardFingerprint,
          ipAddress: paymentIntent.metadata?.client_ip || null,
          metadata: {
            decline_code: paymentIntent.last_payment_error?.decline_code || null,
            code: paymentIntent.last_payment_error?.code || null,
            message: paymentIntent.last_payment_error?.message || null,
          },
        });

        try {
          await assertCardAttemptsAllowed(db, cardFingerprint);
        } catch (limitError) {
          console.warn('[STRIPE FRAUD] Card daily failed-attempt limit reached:', limitError.message);
        }
      }

      if (failedOrderId) {
        await db.query('UPDATE orders SET payment_status = $1, status = $2, stripe_payment_intent_id = $3 WHERE id = $4', ['failed', 'pending', paymentIntent.id, failedOrderId]);
      }
    }

    await db.query('UPDATE webhook_logs SET status = $1 WHERE id = $2', ['success', logId]);
    return res.json({ received: true });
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Processing error:', err.message);
    await db.query('UPDATE webhook_logs SET status = $1, error = $2 WHERE id = $3', ['failed', String(err.message || err).slice(0, 1000), logId]);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Webhook processing failed' });
  }
}

router.post('/', handleStripeWebhook);

module.exports = {
  router,
  handleStripeWebhook,
};

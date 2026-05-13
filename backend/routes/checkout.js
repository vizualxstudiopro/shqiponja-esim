const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const db = require('../db');

const router = express.Router();
const { checkoutIntentLimiter } = require('../middleware/rate-limit');
const { validateCheckout, sanitizeString } = require('../middleware/validate');
const { assertOrderAmountAllowed } = require('../src/services/fraudPrevention');

const JWT_SECRET = process.env.JWT_SECRET || 'shqiponja-dev-secret';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function getStripe() {
  return STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
}

async function resolvePromo(promoCode, packagePrice) {
  if (!promoCode) return { promo: null, discountAmount: 0, finalPrice: packagePrice };

  const promo = (await db.query(
    'SELECT * FROM promo_codes WHERE UPPER(code) = UPPER($1)',
    [String(promoCode).trim()]
  )).rows[0];

  if (!promo || !promo.active) throw new Error('Ky kod nuk është i vlefshëm');
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) throw new Error('Ky kod ka skaduar');
  if (promo.max_uses && promo.used_count >= promo.max_uses) throw new Error('Ky kod ka arritur limitin e përdorimeve');
  if (promo.min_order && packagePrice < promo.min_order) throw new Error(`Minimumi i porosisë për këtë kod është €${promo.min_order}`);

  const discountAmount = promo.discount_type === 'percent'
    ? Math.round(packagePrice * (promo.discount_value / 100) * 100) / 100
    : Math.min(promo.discount_value, packagePrice);

  return {
    promo,
    discountAmount,
    finalPrice: Math.round((packagePrice - discountAmount) * 100) / 100,
  };
}

function getOptionalUserId(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    return Number(payload.id) || null;
  } catch {
    return null;
  }
}

router.post('/', checkoutIntentLimiter, validateCheckout, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Pagesat janë përkohësisht të paaktivizuara. Stripe nuk është konfiguruar ende.',
      code: 'STRIPE_NOT_CONFIGURED',
    });
  }

  try {
    const { packageId, email, customerName, phone, promoCode } = req.body;
    const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [packageId])).rows[0];
    if (!pkg) return res.status(404).json({ error: 'Paketa nuk u gjet' });

    const packagePrice = Number(pkg.price) || 0;
    const { promo, discountAmount, finalPrice } = await resolvePromo(promoCode, packagePrice);
    if (finalPrice <= 0) return res.status(400).json({ error: 'Çmimi final i pavlefshëm' });
    assertOrderAmountAllowed(finalPrice);

    const accessToken = crypto.randomBytes(24).toString('hex');
    const userId = getOptionalUserId(req);
    const name = sanitizeString(customerName || '', 120) || null;
    const safePhone = sanitizeString(phone || '', 40) || null;

    const insertResult = await db.query(`
      INSERT INTO orders (
        package_id, user_id, email, customer_name, phone, status, payment_status,
        payment_provider, access_token, promo_code_id, discount_amount, final_price
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
    `, [
      packageId,
      userId,
      email,
      name,
      safePhone,
      'pending',
      'unpaid',
      'stripe',
      accessToken,
      promo?.id || null,
      discountAmount,
      finalPrice,
    ]);

    const orderId = insertResult.rows[0].id;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalPrice * 100),
      currency: (pkg.currency || 'EUR').toLowerCase(),
      receipt_email: email,
      description: pkg.name,
      metadata: {
        order_id: String(orderId),
        package_id: String(packageId),
        airalo_package_id: pkg.airalo_package_id || '',
        customer_name: name || '',
        customer_email: email,
        phone: safePhone || '',
        promo_code: promo?.code || '',
        client_ip: req.ip,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    await db.query('UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2', [paymentIntent.id, orderId]);
    return res.json({
      clientSecret: paymentIntent.client_secret,
      orderId,
      accessToken,
    });
  } catch (err) {
    console.error('[STRIPE CHECKOUT] Error:', err.message);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Gabim gjatë krijimit të checkout-it',
      code: err.code || 'CHECKOUT_CREATE_FAILED',
    });
  }
});

module.exports = router;

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const db = require('../db');
const { sendTransactionalEmail } = require('../lib/emailService');
const { orderConfirmationTemplate } = require('../lib/email');
const airalo = require('../lib/airaloService');
const { apiLimiter } = require('../middleware/rate-limit');
const { validateCheckout } = require('../middleware/validate');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'shqiponja-dev-secret';

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const LS_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID;
const LS_API_URL = 'https://api.lemonsqueezy.com/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const lsEnabled = LS_API_KEY && LS_STORE_ID && LS_VARIANT_ID;

// POST /api/checkout - Create Lemon Squeezy checkout
router.post('/', apiLimiter, validateCheckout, async (req, res) => {
  const { packageId, email, customerName, phone } = req.body;
  if (!packageId || !email) {
    return res.status(400).json({ error: 'packageId and email are required' });
  }

  const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [packageId])).rows[0];
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found' });
  }

  // Link user if authenticated
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      userId = payload.id;
    } catch { /* not logged in, that's ok */ }
  }

  const accessToken = crypto.randomBytes(32).toString('hex');
  const result = await db.query(
    'INSERT INTO orders (package_id, email, status, payment_status, user_id, access_token, customer_name, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    [packageId, email, 'pending', 'unpaid', userId, accessToken, customerName || null, phone || null]
  );
  const orderId = result.rows[0].id;

  // If Lemon Squeezy is not configured, skip payment (dev mode)
  if (!lsEnabled) {
    const qrData = `SHQIPONJA-ESIM-${orderId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Try to order real eSIM from Airalo if credentials are available
    let airaloData = null;
    if (airalo.isEnabled() && pkg.airalo_package_id) {
      try {
        airaloData = await airalo.createOrder(pkg.airalo_package_id, 1, `Order #${orderId}`);
        const esim = airaloData?.data?.sims?.[0];
        if (esim) {
          await db.query(`
            UPDATE orders SET payment_status = $1, status = $2, qr_data = $3,
              airalo_order_id = $4, iccid = $5, esim_status = $6, qr_code_url = $7, activation_code = $8
            WHERE id = $9
          `, ['paid', 'completed', esim.qrcode || qrData,
            String(airaloData.data.id), esim.iccid, 'active',
            esim.qrcode_url || null, esim.direct_apple_installation_url || null, orderId]);
        } else {
          await db.query(
            'UPDATE orders SET payment_status = $1, status = $2, qr_data = $3 WHERE id = $4',
            ['paid', 'completed', qrData, orderId]
          );
        }
      } catch (err) {
        console.error('[AIRALO ORDER ERROR] Dev mode:', err.message);
        await db.query(
          'UPDATE orders SET payment_status = $1, status = $2, qr_data = $3 WHERE id = $4',
          ['paid', 'completed', qrData, orderId]
        );
      }
    } else {
      await db.query(
        'UPDATE orders SET payment_status = $1, status = $2, qr_data = $3 WHERE id = $4',
        ['paid', 'completed', qrData, orderId]
      );
    }

    const order = (await db.query(`
      SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price
      FROM orders o JOIN packages p ON p.id = o.package_id
      WHERE o.id = $1
    `, [orderId])).rows[0];

    sendTransactionalEmail({
      toEmail: email,
      subject: 'Porosia jote — Shqiponja eSIM',
      html: await orderConfirmationTemplate({
        orderId,
        packageFlag: order.package_flag,
        packageName: order.package_name,
        price: order.price,
        iccid: null,
        qrData,
      }),
      logLabel: 'ORDER EMAIL',
    }).catch(err => console.error('Order email error:', err));

    return res.json({ url: `${FRONTEND_URL}/porosi/${orderId}/${accessToken}`, order });
  }

  // Create Lemon Squeezy checkout session
  try {
    const priceInCents = Math.round(pkg.price * 100);

    const { data: lsRes } = await axios.post(`${LS_API_URL}/checkouts`, {
      data: {
        type: 'checkouts',
        attributes: {
          custom_price: priceInCents,
          product_options: {
            name: `${pkg.name} — ${pkg.data} / ${pkg.duration}`,
            description: pkg.description || `eSIM ${pkg.region}`,
            redirect_url: `${FRONTEND_URL}/porosi/${orderId}/${accessToken}`,
            receipt_link_url: `${FRONTEND_URL}/porosi/${orderId}/${accessToken}`,
            receipt_button_text: 'Shiko porosinë',
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          checkout_data: {
            email: email,
            custom: {
              order_id: String(orderId),
              package_id: String(packageId),
            },
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(LS_STORE_ID) } },
          variant: { data: { type: 'variants', id: String(LS_VARIANT_ID) } },
        },
      },
    }, {
      headers: {
        Authorization: `Bearer ${LS_API_KEY}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    const checkoutUrl = lsRes.data.attributes.url;
    res.json({ url: checkoutUrl, orderId: Number(orderId), accessToken });
  } catch (err) {
    console.error('Lemon Squeezy error:', err.response?.data || err.message);
    await db.query('UPDATE orders SET payment_status = $1, status = $2 WHERE id = $3', ['failed', 'failed', orderId]);
    res.status(500).json({ error: 'Inicializimi i pagesës dështoi. Provo përsëri.' });
  }
});

module.exports = router;

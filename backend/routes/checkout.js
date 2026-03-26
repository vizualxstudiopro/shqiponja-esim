const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const db = require('../db');
const { sendMail } = require('../lib/email');
const airalo = require('../lib/airaloService');
const { apiLimiter } = require('../middleware/rate-limit');
const { validateCheckout } = require('../middleware/validate');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'shqiponja-dev-secret';

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_PRODUCT_ID = process.env.PADDLE_PRODUCT_ID;
const PADDLE_ENV = process.env.PADDLE_ENVIRONMENT || 'sandbox';
const PADDLE_API_URL = PADDLE_ENV === 'production'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const paddleEnabled = PADDLE_API_KEY && !PADDLE_API_KEY.includes('YOUR_KEY') && PADDLE_PRODUCT_ID;

// POST /api/checkout - Create Paddle transaction
router.post('/', apiLimiter, validateCheckout, async (req, res) => {
  const { packageId, email } = req.body;
  if (!packageId || !email) {
    return res.status(400).json({ error: 'packageId and email are required' });
  }

  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(packageId);
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

  const result = db.prepare(
    'INSERT INTO orders (package_id, email, status, payment_status, user_id) VALUES (?, ?, ?, ?, ?)'
  ).run(packageId, email, 'pending', 'unpaid', userId);
  const orderId = result.lastInsertRowid;

  // If Paddle is not configured, skip payment (dev mode)
  if (!paddleEnabled) {
    const qrData = `SHQIPONJA-ESIM-${orderId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Try to order real eSIM from Airalo if credentials are available
    let airaloData = null;
    if (airalo.isEnabled() && pkg.airalo_package_id) {
      try {
        airaloData = await airalo.createOrder(pkg.airalo_package_id, 1, `Order #${orderId}`);
        const esim = airaloData?.data?.sims?.[0];
        if (esim) {
          db.prepare(`
            UPDATE orders SET payment_status = ?, status = ?, qr_data = ?,
              airalo_order_id = ?, iccid = ?, esim_status = ?, qr_code_url = ?, activation_code = ?
            WHERE id = ?
          `).run('paid', 'completed', esim.qrcode || qrData,
            String(airaloData.data.id), esim.iccid, 'active',
            esim.qrcode_url || null, esim.direct_apple_installation_url || null, orderId);
        } else {
          db.prepare(
            'UPDATE orders SET payment_status = ?, status = ?, qr_data = ? WHERE id = ?'
          ).run('paid', 'completed', qrData, orderId);
        }
      } catch (err) {
        console.error('[AIRALO ORDER ERROR] Dev mode:', err.message);
        db.prepare(
          'UPDATE orders SET payment_status = ?, status = ?, qr_data = ? WHERE id = ?'
        ).run('paid', 'completed', qrData, orderId);
      }
    } else {
      db.prepare(
        'UPDATE orders SET payment_status = ?, status = ?, qr_data = ? WHERE id = ?'
      ).run('paid', 'completed', qrData, orderId);
    }

    const order = db.prepare(`
      SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price
      FROM orders o JOIN packages p ON p.id = o.package_id
      WHERE o.id = ?
    `).get(orderId);

    sendMail(
      email,
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

    return res.json({ url: `${FRONTEND_URL}/porosi/${orderId}`, order });
  }

  // Create Paddle transaction with non-catalog (inline) price
  try {
    const { data: paddleRes } = await axios.post(`${PADDLE_API_URL}/transactions`, {
      items: [{
        price: {
          product_id: PADDLE_PRODUCT_ID,
          description: `${pkg.flag} ${pkg.name} — ${pkg.data} / ${pkg.duration}`,
          unit_price: {
            amount: String(Math.round(pkg.price * 100)),
            currency_code: pkg.currency.toUpperCase(),
          },
        },
        quantity: 1,
      }],
      custom_data: {
        order_id: String(orderId),
        package_id: String(packageId),
      },
    }, {
      headers: {
        Authorization: `Bearer ${PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const txnId = paddleRes.data.id;
    db.prepare('UPDATE orders SET paddle_transaction_id = ? WHERE id = ?').run(txnId, orderId);

    res.json({ transactionId: txnId, orderId: Number(orderId) });
  } catch (err) {
    console.error('Paddle error:', err.response?.data || err.message);
    db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
    res.status(500).json({ error: 'Inicializimi i pagesës dështoi' });
  }
});

module.exports = router;

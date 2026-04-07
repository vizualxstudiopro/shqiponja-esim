const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { apiLimiter, orderLimiter } = require('../middleware/rate-limit');
const { validateEmail } = require('../middleware/validate');
const airalo = require('../lib/airaloService');

// GET /api/orders/my - Get orders for logged-in user (MUST be before /:id)
router.get('/my', authMiddleware, async (req, res) => {
  const orders = (await db.query(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price AS package_price
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.user_id = $1 OR o.email = (SELECT email FROM users WHERE id = $2)
    ORDER BY o.created_at DESC
  `, [req.user.id, req.user.id])).rows;
  res.json(orders);
});

// GET /api/orders/:id/usage - Get eSIM usage from Airalo
router.get('/:id/usage', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = (await db.query('SELECT * FROM orders WHERE id = $1', [id])).rows[0];
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Check ownership
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Nuk ke qasje' });
  }

  if (!order.iccid) {
    return res.json({ usage: null, message: 'Kjo porosi nuk ka eSIM ICCID' });
  }

  if (!airalo.isEnabled()) {
    return res.json({ usage: null, message: 'Airalo API nuk është konfiguruar' });
  }

  try {
    const usage = await airalo.getEsimUsage(order.iccid);
    res.json({ usage: usage?.data || null });
  } catch (err) {
    console.error('[AIRALO USAGE ERROR]', err.message);
    res.status(500).json({ error: 'Gabim gjatë marrjes së përdorimit' });
  }
});

// GET /api/orders - List all orders (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  const orders = (await db.query(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    ORDER BY o.created_at DESC
  `)).rows;
  res.json(orders);
});

// GET /api/orders/:id - Get a single order
// Requires auth (owner/admin) OR matching ls_order_id
router.get('/:id', orderLimiter, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = (await db.query(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.id = $1
  `, [id])).rows[0];
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Allow access with cryptographic access token
  const token = req.query.token;
  if (token && order.access_token && token === order.access_token) {
    const { access_token, ...safeOrder } = order;
    return res.json(safeOrder);
  }

  // Otherwise require authentication
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kërkohet autentikimi' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'shqiponja-dev-secret';
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    if (payload.role !== 'admin' && order.email !== payload.email && order.user_id !== payload.id) {
      return res.status(403).json({ error: 'Nuk ke qasje në këtë porosi' });
    }
    return res.json(order);
  } catch {
    return res.status(401).json({ error: 'Token i pavlefshëm' });
  }
});

// POST /api/orders - Create a new order
router.post('/', apiLimiter, async (req, res) => {
  const { packageId, email } = req.body;
  if (!packageId || !email) {
    return res.status(400).json({ error: 'packageId and email are required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email i pavlefshëm' });
  }

  // Verify package exists
  const pkg = (await db.query('SELECT id FROM packages WHERE id = $1', [packageId])).rows[0];
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found' });
  }

  const result = await db.query(`
    INSERT INTO orders (package_id, email) VALUES ($1, $2) RETURNING id
  `, [packageId, email.trim().toLowerCase()]);

  const order = (await db.query(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.id = $1
  `, [result.rows[0].id])).rows[0];

  res.status(201).json(order);
});

module.exports = router;

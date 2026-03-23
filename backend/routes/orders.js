const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rate-limit');

// GET /api/orders/my - Get orders for logged-in user (MUST be before /:id)
router.get('/my', authMiddleware, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price AS package_price
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.user_id = ? OR o.email = (SELECT email FROM users WHERE id = ?)
    ORDER BY o.created_at DESC
  `).all(req.user.id, req.user.id);
  res.json(orders);
});

// GET /api/orders - List all orders (admin only)
router.get('/', authMiddleware, adminOnly, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

// GET /api/orders/:id - Get a single order
// Requires auth (owner/admin) OR matching email from a recent dev-mode order
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = db.prepare(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.id = ?
  `).get(id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Allow access if paddle_transaction_id matches (post-payment confirmation)
  const txnId = req.query.transaction_id;
  if (txnId && order.paddle_transaction_id && txnId === order.paddle_transaction_id) {
    return res.json(order);
  }

  // Allow SSR access within 10 minutes of order creation (post-payment confirmation)
  if (!req.headers.authorization && order.status === 'completed') {
    const created = new Date(order.created_at).getTime();
    const tenMin = 10 * 60 * 1000;
    if (Date.now() - created < tenMin) {
      return res.json(order);
    }
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
router.post('/', apiLimiter, (req, res) => {
  const { packageId, email } = req.body;
  if (!packageId || !email) {
    return res.status(400).json({ error: 'packageId and email are required' });
  }

  // Verify package exists
  const pkg = db.prepare('SELECT id FROM packages WHERE id = ?').get(packageId);
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found' });
  }

  const result = db.prepare(`
    INSERT INTO orders (package_id, email) VALUES (?, ?)
  `).run(packageId, email);

  const order = db.prepare(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(order);
});

module.exports = router;

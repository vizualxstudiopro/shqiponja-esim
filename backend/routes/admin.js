const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnly);

/* ─── DASHBOARD STATS ─── */
router.get('/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) AS cnt FROM orders').get().cnt;
  const paidOrders = db.prepare("SELECT COUNT(*) AS cnt FROM orders WHERE payment_status = 'paid'").get().cnt;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(p.price),0) AS total FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.payment_status = 'paid'").get().total;
  const totalUsers = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;
  const totalPackages = db.prepare('SELECT COUNT(*) AS cnt FROM packages').get().cnt;

  // Monthly stats for charts (last 6 months)
  const monthlyRevenue = db.prepare(`
    SELECT strftime('%Y-%m', o.created_at) AS month,
           COALESCE(SUM(p.price), 0) AS revenue,
           COUNT(*) AS orders
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', o.created_at)
    ORDER BY month
  `).all();

  const monthlyUsers = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS users
    FROM users
    WHERE created_at >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month
  `).all();

  res.json({ totalOrders, paidOrders, totalRevenue, totalUsers, totalPackages, monthlyRevenue, monthlyUsers });
});

/* ─── USERS ─── */
router.get('/users', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const searchQuery = req.query.q || '';

  let where = '1=1';
  const params = [];
  if (searchQuery.trim()) {
    where += ' AND (name LIKE ? OR email LIKE ?)';
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like);
  }

  const total = db.prepare(`SELECT COUNT(*) AS cnt FROM users WHERE ${where}`).get(...params).cnt;
  const users = db.prepare(`SELECT id, name, email, role, email_verified, created_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
});

router.patch('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Roli duhet të jetë customer ose admin' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

router.delete('/users/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Nuk mund ta fshish veten' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ─── ORDERS ─── */
router.get('/orders', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const statusFilter = req.query.status || '';
  const paymentFilter = req.query.payment_status || '';
  const searchQuery = req.query.q || '';

  let where = '1=1';
  const params = [];
  if (['pending', 'completed', 'cancelled'].includes(statusFilter)) {
    where += ' AND o.status = ?';
    params.push(statusFilter);
  }
  if (['unpaid', 'paid', 'refunded'].includes(paymentFilter)) {
    where += ' AND o.payment_status = ?';
    params.push(paymentFilter);
  }
  if (searchQuery.trim()) {
    where += ' AND (o.email LIKE ? OR p.name LIKE ? OR CAST(o.id AS TEXT) LIKE ?)';
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like, like);
  }

  const total = db.prepare(`SELECT COUNT(*) AS cnt FROM orders o JOIN packages p ON p.id = o.package_id WHERE ${where}`).get(...params).cnt;
  const orders = db.prepare(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price AS package_price,
           u.name AS user_name, u.email AS user_email
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    LEFT JOIN users u ON u.id = o.user_id
    WHERE ${where}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
});

router.patch('/orders/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
  const { status, payment_status } = req.body;
  const validStatuses = ['pending', 'completed', 'cancelled'];
  const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status i pavlefshëm' });
  }
  if (payment_status && !validPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({ error: 'Payment status i pavlefshëm' });
  }
  if (status) db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  if (payment_status) db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run(payment_status, id);
  const order = db.prepare(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.id = ?
  `).get(id);
  res.json(order);
});

/* ─── PACKAGES ─── */
router.get('/packages', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  const searchQuery = req.query.q || '';

  let where = '1=1';
  const params = [];
  if (searchQuery.trim()) {
    where += ' AND (name LIKE ? OR region LIKE ? OR country_code LIKE ?)';
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like, like);
  }

  const total = db.prepare(`SELECT COUNT(*) AS cnt FROM packages WHERE ${where}`).get(...params).cnt;
  const packages = db.prepare(`SELECT * FROM packages WHERE ${where} ORDER BY visible DESC, region, price LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({
    packages: packages.map((p) => ({ ...p, highlight: !!p.highlight, visible: !!p.visible })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.patch('/packages/:id/visible', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
  const { visible } = req.body;
  db.prepare('UPDATE packages SET visible = ? WHERE id = ?').run(visible ? 1 : 0, id);
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);
  if (!pkg) return res.status(404).json({ error: 'Paketa nuk u gjet' });
  res.json({ ...pkg, highlight: !!pkg.highlight, visible: !!pkg.visible });
});

router.post('/packages', (req, res) => {
  const { name, region, flag, data, duration, price, currency, highlight, description } = req.body;
  if (!name || !region || !flag || !data || !duration || price == null) {
    return res.status(400).json({ error: 'Fushat e detyrueshme mungojnë' });
  }
  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: 'Çmimi duhet të jetë numër pozitiv' });
  }
  const result = db.prepare(`
    INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(String(name).slice(0, 200), String(region).slice(0, 100), String(flag).slice(0, 10), String(data).slice(0, 50), String(duration).slice(0, 50), numPrice, currency || 'EUR', highlight ? 1 : 0, String(description || '').slice(0, 500));
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...pkg, highlight: !!pkg.highlight });
});

router.put('/packages/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
  const { name, region, flag, data, duration, price, currency, highlight, description } = req.body;
  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: 'Çmimi duhet të jetë numër pozitiv' });
  }
  db.prepare(`
    UPDATE packages SET name=?, region=?, flag=?, data=?, duration=?, price=?, currency=?, highlight=?, description=?
    WHERE id=?
  `).run(String(name).slice(0, 200), String(region).slice(0, 100), String(flag).slice(0, 10), String(data).slice(0, 50), String(duration).slice(0, 50), numPrice, currency || 'EUR', highlight ? 1 : 0, String(description || '').slice(0, 500), id);
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);
  if (!pkg) return res.status(404).json({ error: 'Paketa nuk u gjet' });
  res.json({ ...pkg, highlight: !!pkg.highlight });
});

router.delete('/packages/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
  db.prepare('DELETE FROM packages WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnly);

/* ─── DASHBOARD STATS ─── */
router.get('/stats', async (req, res) => {
  const totalOrders = parseInt((await db.query('SELECT COUNT(*) AS cnt FROM orders')).rows[0].cnt);
  const paidOrders = parseInt((await db.query("SELECT COUNT(*) AS cnt FROM orders WHERE payment_status = 'paid'")).rows[0].cnt);
  const totalRevenue = parseFloat((await db.query("SELECT COALESCE(SUM(p.price),0) AS total FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.payment_status = 'paid'")).rows[0].total);
  const totalUsers = parseInt((await db.query('SELECT COUNT(*) AS cnt FROM users')).rows[0].cnt);
  const totalPackages = parseInt((await db.query('SELECT COUNT(*) AS cnt FROM packages')).rows[0].cnt);

  // Monthly stats for charts (last 6 months)
  const monthlyRevenue = (await db.query(`
    SELECT to_char(o.created_at, 'YYYY-MM') AS month,
           COALESCE(SUM(p.price), 0) AS revenue,
           COUNT(*) AS orders
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= NOW() - INTERVAL '6 months'
    GROUP BY to_char(o.created_at, 'YYYY-MM')
    ORDER BY month
  `)).rows;

  const monthlyUsers = (await db.query(`
    SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*) AS users
    FROM users
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY to_char(created_at, 'YYYY-MM')
    ORDER BY month
  `)).rows;

  res.json({ totalOrders, paidOrders, totalRevenue, totalUsers, totalPackages, monthlyRevenue, monthlyUsers });
});

/* ─── USERS ─── */
router.get('/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const searchQuery = req.query.q || '';

  let where = '1=1';
  const params = [];
  let paramIdx = 1;
  if (searchQuery.trim()) {
    where += ` AND (name ILIKE $${paramIdx} OR email ILIKE $${paramIdx + 1})`;
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like);
    paramIdx += 2;
  }

  const total = parseInt((await db.query(`SELECT COUNT(*) AS cnt FROM users WHERE ${where}`, params)).rows[0].cnt);
  const users = (await db.query(
    `SELECT id, name, email, role, email_verified, created_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset]
  )).rows;
  res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Roli duhet të jetë customer ose admin' });
  }
  await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  const user = (await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.params.id])).rows[0];
  res.json(user);
});

router.delete('/users/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Nuk mund ta fshish veten' });
  }
  await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ─── ORDERS ─── */
router.get('/orders', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const statusFilter = req.query.status || '';
  const paymentFilter = req.query.payment_status || '';
  const searchQuery = req.query.q || '';

  let where = '1=1';
  const params = [];
  let paramIdx = 1;
  if (['pending', 'completed', 'cancelled'].includes(statusFilter)) {
    where += ` AND o.status = $${paramIdx}`;
    params.push(statusFilter);
    paramIdx++;
  }
  if (['unpaid', 'paid', 'refunded'].includes(paymentFilter)) {
    where += ` AND o.payment_status = $${paramIdx}`;
    params.push(paymentFilter);
    paramIdx++;
  }
  if (searchQuery.trim()) {
    where += ` AND (o.email ILIKE $${paramIdx} OR p.name ILIKE $${paramIdx + 1} OR CAST(o.id AS TEXT) LIKE $${paramIdx + 2})`;
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like, like);
    paramIdx += 3;
  }

  const total = parseInt((await db.query(`SELECT COUNT(*) AS cnt FROM orders o JOIN packages p ON p.id = o.package_id WHERE ${where}`, params)).rows[0].cnt);
  const orders = (await db.query(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price AS package_price,
           u.name AS user_name, u.email AS user_email
    FROM orders o
    JOIN packages p ON p.id = o.package_id
    LEFT JOIN users u ON u.id = o.user_id
    WHERE ${where}
    ORDER BY o.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `, [...params, limit, offset])).rows;
  res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
});

router.patch('/orders/:id/status', async (req, res) => {
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
  if (status) await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
  if (payment_status) await db.query('UPDATE orders SET payment_status = $1 WHERE id = $2', [payment_status, id]);
  const order = (await db.query(`
    SELECT o.*, p.name AS package_name, p.flag AS package_flag
    FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.id = $1
  `, [id])).rows[0];
  res.json(order);
});

/* ─── PACKAGES ─── */
router.get('/packages', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  const searchQuery = req.query.q || '';

  let where = '1=1';
  const params = [];
  let paramIdx = 1;
  if (searchQuery.trim()) {
    where += ` AND (name ILIKE $${paramIdx} OR region ILIKE $${paramIdx + 1} OR country_code ILIKE $${paramIdx + 2})`;
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like, like);
    paramIdx += 3;
  }
  // Filter by visible status if specified
  if (req.query.visible === '0' || req.query.visible === '1') {
    where += ` AND visible = $${paramIdx}`;
    params.push(parseInt(req.query.visible));
    paramIdx++;
  }
  // Filter by category
  if (['local', 'regional', 'global'].includes(req.query.category)) {
    where += ` AND category = $${paramIdx}`;
    params.push(req.query.category);
    paramIdx++;
  }

  const total = parseInt((await db.query(`SELECT COUNT(*) AS cnt FROM packages WHERE ${where}`, params)).rows[0].cnt);
  const packages = (await db.query(
    `SELECT * FROM packages WHERE ${where} ORDER BY visible DESC, region, price LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset]
  )).rows;
  res.json({
    packages: packages.map((p) => ({ ...p, highlight: !!p.highlight, visible: !!p.visible })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.patch('/packages/:id/visible', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
    const { visible } = req.body;
    await db.query('UPDATE packages SET visible = $1 WHERE id = $2', [visible ? 1 : 0, id]);
    const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [id])).rows[0];
    if (!pkg) return res.status(404).json({ error: 'Paketa nuk u gjet' });
    res.json({ ...pkg, highlight: !!pkg.highlight, visible: !!pkg.visible });
  } catch (err) {
    console.error('Visible toggle error:', err);
    res.status(500).json({ error: 'Gabim serveri: ' + (err.message || 'Unknown') });
  }
});

router.patch('/packages/:id/highlight', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
    const { highlight } = req.body;
    await db.query('UPDATE packages SET highlight = $1 WHERE id = $2', [highlight ? 1 : 0, id]);
    const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [id])).rows[0];
    if (!pkg) return res.status(404).json({ error: 'Paketa nuk u gjet' });
    res.json({ ...pkg, highlight: !!pkg.highlight, visible: !!pkg.visible });
  } catch (err) {
    console.error('Highlight toggle error:', err);
    res.status(500).json({ error: 'Gabim serveri: ' + (err.message || 'Unknown') });
  }
});

router.patch('/packages/:id/category', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
    const { category } = req.body;
    const validCategories = ['local', 'regional', 'global'];
    if (!validCategories.includes(category)) return res.status(400).json({ error: 'Kategori e pavlefshme' });
    await db.query('UPDATE packages SET category = $1 WHERE id = $2', [category, id]);
    const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [id])).rows[0];
    if (!pkg) return res.status(404).json({ error: 'Paketa nuk u gjet' });
    res.json({ ...pkg, highlight: !!pkg.highlight, visible: !!pkg.visible });
  } catch (err) {
    console.error('Category update error:', err);
    res.status(500).json({ error: 'Gabim serveri: ' + (err.message || 'Unknown') });
  }
});

router.post('/packages', async (req, res) => {
  const { name, region, flag, data, duration, price, currency, highlight, description, category } = req.body;
  if (!name || !region || !flag || !data || !duration || price == null) {
    return res.status(400).json({ error: 'Fushat e detyrueshme mungojnë' });
  }
  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: 'Çmimi duhet të jetë numër pozitiv' });
  }
  const validCategories = ['local', 'regional', 'global'];
  const safeCategory = validCategories.includes(category) ? category : 'local';
  const result = await db.query(`
    INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description, category)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
  `, [String(name).slice(0, 200), String(region).slice(0, 100), String(flag).slice(0, 10), String(data).slice(0, 50), String(duration).slice(0, 50), numPrice, currency || 'EUR', highlight ? 1 : 0, String(description || '').slice(0, 500), safeCategory]);
  const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [result.rows[0].id])).rows[0];
  res.status(201).json({ ...pkg, highlight: !!pkg.highlight });
});

router.put('/packages/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
  const { name, region, flag, data, duration, price, currency, highlight, description, visible, category } = req.body;
  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: 'Çmimi duhet të jetë numër pozitiv' });
  }
  const validCategories = ['local', 'regional', 'global'];
  const safeCategory = validCategories.includes(category) ? category : 'local';
  await db.query(`
    UPDATE packages SET name=$1, region=$2, flag=$3, data=$4, duration=$5, price=$6, currency=$7, highlight=$8, description=$9, visible=$10, category=$11
    WHERE id=$12
  `, [String(name).slice(0, 200), String(region).slice(0, 100), String(flag).slice(0, 10), String(data).slice(0, 50), String(duration).slice(0, 50), numPrice, currency || 'EUR', highlight ? 1 : 0, String(description || '').slice(0, 500), visible ? 1 : 0, safeCategory, id]);
  const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [id])).rows[0];
  if (!pkg) return res.status(404).json({ error: 'Paketa nuk u gjet' });
  res.json({ ...pkg, highlight: !!pkg.highlight, visible: !!pkg.visible });
});

router.delete('/packages/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID i pavlefshëm' });
  await db.query('DELETE FROM packages WHERE id = $1', [id]);
  res.json({ ok: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/packages - List all eSIM packages
router.get('/', (req, res) => {
  const packages = db.prepare('SELECT * FROM packages ORDER BY id').all();
  // Convert highlight from 0/1 to boolean for the frontend
  res.json(packages.map((p) => ({ ...p, highlight: !!p.highlight })));
});

// GET /api/packages/:id - Get a single package
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  res.json({ ...pkg, highlight: !!pkg.highlight });
});

module.exports = router;

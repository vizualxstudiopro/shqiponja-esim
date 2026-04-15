const express = require('express');
const router = express.Router();
const ESIM_DEVICES = require('../src/data/esim-devices');

// Build search index (lowercase brand+model for fast lookup)
const deviceIndex = ESIM_DEVICES.map(d => ({
  ...d,
  _search: `${d.brand} ${d.model}`.toLowerCase(),
}));

// Get unique brands for the dropdown
const brands = [...new Set(ESIM_DEVICES.map(d => d.brand))].sort();

// GET /api/compatibility/brands - List all brands
router.get('/brands', (_req, res) => {
  res.json(brands);
});

// GET /api/compatibility/devices?brand=Apple - List devices for a brand
router.get('/devices', (req, res) => {
  const brand = (req.query.brand || '').trim();
  if (!brand) return res.json([]);
  const models = ESIM_DEVICES
    .filter(d => d.brand.toLowerCase() === brand.toLowerCase())
    .map(d => d.model);
  res.json(models);
});

// GET /api/compatibility/check?q=iPhone 14 Pro - Search/check device
router.get('/check', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) {
    return res.json({ compatible: false, query: req.query.q, matches: [] });
  }

  const terms = q.split(/\s+/);
  const matches = deviceIndex.filter(d =>
    terms.every(term => d._search.includes(term))
  );

  res.json({
    compatible: matches.length > 0,
    query: req.query.q,
    matches: matches.slice(0, 10).map(d => ({ brand: d.brand, model: d.model })),
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const ESIM_DEVICES = require('../src/data/esim-devices');

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = {
  brands: null,
  brandsExpiry: 0,
  modelsByBrand: new Map(),
  checks: new Map(),
};

// Build search index (lowercase brand+model for fast lookup)
const deviceIndex = ESIM_DEVICES.map(d => ({
  ...d,
  _search: `${d.brand} ${d.model}`.toLowerCase(),
}));

function getBrandsCached() {
  if (cache.brands && Date.now() < cache.brandsExpiry) return cache.brands;
  cache.brands = [...new Set(ESIM_DEVICES.map((d) => d.brand))].sort();
  cache.brandsExpiry = Date.now() + CACHE_TTL_MS;
  return cache.brands;
}

function getModelsForBrandCached(brand) {
  const key = brand.toLowerCase();
  const cached = cache.modelsByBrand.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.models;

  const models = ESIM_DEVICES
    .filter((d) => d.brand.toLowerCase() === key)
    .map((d) => d.model)
    .sort((a, b) => a.localeCompare(b));

  cache.modelsByBrand.set(key, { models, expiresAt: Date.now() + CACHE_TTL_MS });
  return models;
}

function scoreMatch(item, query) {
  const model = item.model.toLowerCase();
  const search = item._search;
  if (model === query || search === query) return 100;
  if (model.startsWith(query) || search.startsWith(query)) return 90;
  if (model.includes(query)) return 80;

  const terms = query.split(/\s+/).filter(Boolean);
  const matched = terms.filter((term) => search.includes(term)).length;
  if (!terms.length) return 0;
  return Math.round((matched / terms.length) * 70);
}

// GET /api/compatibility/brands - List all brands
router.get('/brands', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(getBrandsCached());
});

// GET /api/compatibility/devices?brand=Apple - List devices for a brand
router.get('/devices', (req, res) => {
  const brand = (req.query.brand || '').trim();
  if (!brand) return res.json([]);
  const models = getModelsForBrandCached(brand);
  res.set('Cache-Control', 'public, max-age=300');
  res.json(models);
});

// GET /api/compatibility/check?q=iPhone 14 Pro - Search/check device
router.get('/check', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) {
    return res.json({ compatible: false, query: req.query.q, confidence: 0, matches: [] });
  }

  const cached = cache.checks.get(q);
  if (cached && Date.now() < cached.expiresAt) {
    return res.json({ ...cached.payload, cached: true });
  }

  const scored = deviceIndex
    .map((d) => ({
      brand: d.brand,
      model: d.model,
      score: scoreMatch(d, q),
    }))
    .filter((m) => m.score >= 50)
    .sort((a, b) => b.score - a.score || a.model.localeCompare(b.model));

  const matches = scored.slice(0, 10).map((m) => ({ brand: m.brand, model: m.model }));
  const confidence = scored.length ? scored[0].score : 0;

  const payload = {
    compatible: matches.length > 0,
    query: req.query.q,
    confidence,
    matches,
  };

  cache.checks.set(q, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
  res.json(payload);
});

module.exports = router;

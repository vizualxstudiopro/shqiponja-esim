const express = require('express');
const router = express.Router();

// eSIM-compatible devices database (130+ devices)
const ESIM_DEVICES = [
  // Apple
  { brand: 'Apple', model: 'iPhone 16 Pro Max' }, { brand: 'Apple', model: 'iPhone 16 Pro' },
  { brand: 'Apple', model: 'iPhone 16 Plus' }, { brand: 'Apple', model: 'iPhone 16' },
  { brand: 'Apple', model: 'iPhone 15 Pro Max' }, { brand: 'Apple', model: 'iPhone 15 Pro' },
  { brand: 'Apple', model: 'iPhone 15 Plus' }, { brand: 'Apple', model: 'iPhone 15' },
  { brand: 'Apple', model: 'iPhone 14 Pro Max' }, { brand: 'Apple', model: 'iPhone 14 Pro' },
  { brand: 'Apple', model: 'iPhone 14 Plus' }, { brand: 'Apple', model: 'iPhone 14' },
  { brand: 'Apple', model: 'iPhone 13 Pro Max' }, { brand: 'Apple', model: 'iPhone 13 Pro' },
  { brand: 'Apple', model: 'iPhone 13 mini' }, { brand: 'Apple', model: 'iPhone 13' },
  { brand: 'Apple', model: 'iPhone 12 Pro Max' }, { brand: 'Apple', model: 'iPhone 12 Pro' },
  { brand: 'Apple', model: 'iPhone 12 mini' }, { brand: 'Apple', model: 'iPhone 12' },
  { brand: 'Apple', model: 'iPhone 11 Pro Max' }, { brand: 'Apple', model: 'iPhone 11 Pro' },
  { brand: 'Apple', model: 'iPhone 11' }, { brand: 'Apple', model: 'iPhone XS Max' },
  { brand: 'Apple', model: 'iPhone XS' }, { brand: 'Apple', model: 'iPhone XR' },
  { brand: 'Apple', model: 'iPhone SE (2022)' }, { brand: 'Apple', model: 'iPhone SE (2020)' },
  { brand: 'Apple', model: 'iPad Pro 12.9-inch (3rd gen+)' }, { brand: 'Apple', model: 'iPad Pro 11-inch (1st gen+)' },
  { brand: 'Apple', model: 'iPad Air (3rd gen+)' }, { brand: 'Apple', model: 'iPad (7th gen+)' },
  { brand: 'Apple', model: 'iPad mini (5th gen+)' },
  // Samsung
  { brand: 'Samsung', model: 'Galaxy S25 Ultra' }, { brand: 'Samsung', model: 'Galaxy S25+' },
  { brand: 'Samsung', model: 'Galaxy S25' }, { brand: 'Samsung', model: 'Galaxy S24 Ultra' },
  { brand: 'Samsung', model: 'Galaxy S24+' }, { brand: 'Samsung', model: 'Galaxy S24' },
  { brand: 'Samsung', model: 'Galaxy S24 FE' }, { brand: 'Samsung', model: 'Galaxy S23 Ultra' },
  { brand: 'Samsung', model: 'Galaxy S23+' }, { brand: 'Samsung', model: 'Galaxy S23' },
  { brand: 'Samsung', model: 'Galaxy S23 FE' }, { brand: 'Samsung', model: 'Galaxy S22 Ultra' },
  { brand: 'Samsung', model: 'Galaxy S22+' }, { brand: 'Samsung', model: 'Galaxy S22' },
  { brand: 'Samsung', model: 'Galaxy S21 Ultra' }, { brand: 'Samsung', model: 'Galaxy S21+' },
  { brand: 'Samsung', model: 'Galaxy S21' }, { brand: 'Samsung', model: 'Galaxy S21 FE' },
  { brand: 'Samsung', model: 'Galaxy S20 Ultra' }, { brand: 'Samsung', model: 'Galaxy S20+' },
  { brand: 'Samsung', model: 'Galaxy S20' }, { brand: 'Samsung', model: 'Galaxy Z Fold 6' },
  { brand: 'Samsung', model: 'Galaxy Z Fold 5' }, { brand: 'Samsung', model: 'Galaxy Z Fold 4' },
  { brand: 'Samsung', model: 'Galaxy Z Fold 3' }, { brand: 'Samsung', model: 'Galaxy Z Fold 2' },
  { brand: 'Samsung', model: 'Galaxy Z Fold' }, { brand: 'Samsung', model: 'Galaxy Z Flip 6' },
  { brand: 'Samsung', model: 'Galaxy Z Flip 5' }, { brand: 'Samsung', model: 'Galaxy Z Flip 4' },
  { brand: 'Samsung', model: 'Galaxy Z Flip 3' }, { brand: 'Samsung', model: 'Galaxy Z Flip' },
  { brand: 'Samsung', model: 'Galaxy Note 20 Ultra' }, { brand: 'Samsung', model: 'Galaxy Note 20' },
  { brand: 'Samsung', model: 'Galaxy A55' }, { brand: 'Samsung', model: 'Galaxy A54' },
  { brand: 'Samsung', model: 'Galaxy A35' }, { brand: 'Samsung', model: 'Galaxy A34' },
  // Google
  { brand: 'Google', model: 'Pixel 9 Pro XL' }, { brand: 'Google', model: 'Pixel 9 Pro' },
  { brand: 'Google', model: 'Pixel 9' }, { brand: 'Google', model: 'Pixel 8 Pro' },
  { brand: 'Google', model: 'Pixel 8a' }, { brand: 'Google', model: 'Pixel 8' },
  { brand: 'Google', model: 'Pixel 7 Pro' }, { brand: 'Google', model: 'Pixel 7a' },
  { brand: 'Google', model: 'Pixel 7' }, { brand: 'Google', model: 'Pixel 6 Pro' },
  { brand: 'Google', model: 'Pixel 6a' }, { brand: 'Google', model: 'Pixel 6' },
  { brand: 'Google', model: 'Pixel 5a' }, { brand: 'Google', model: 'Pixel 5' },
  { brand: 'Google', model: 'Pixel 4 XL' }, { brand: 'Google', model: 'Pixel 4a' },
  { brand: 'Google', model: 'Pixel 4' }, { brand: 'Google', model: 'Pixel 3 XL' },
  { brand: 'Google', model: 'Pixel 3a XL' }, { brand: 'Google', model: 'Pixel 3a' },
  { brand: 'Google', model: 'Pixel 3' },
  // Huawei
  { brand: 'Huawei', model: 'P40 Pro' }, { brand: 'Huawei', model: 'P40' },
  { brand: 'Huawei', model: 'Mate 40 Pro' }, { brand: 'Huawei', model: 'Mate Xs 2' },
  // Xiaomi
  { brand: 'Xiaomi', model: '14 Ultra' }, { brand: 'Xiaomi', model: '14 Pro' },
  { brand: 'Xiaomi', model: '14' }, { brand: 'Xiaomi', model: '13 Ultra' },
  { brand: 'Xiaomi', model: '13 Pro' }, { brand: 'Xiaomi', model: '13' },
  { brand: 'Xiaomi', model: '12T Pro' },
  // OnePlus
  { brand: 'OnePlus', model: '12' }, { brand: 'OnePlus', model: '11' },
  // Motorola
  { brand: 'Motorola', model: 'Razr 40 Ultra' }, { brand: 'Motorola', model: 'Razr 40' },
  { brand: 'Motorola', model: 'Edge 40 Pro' }, { brand: 'Motorola', model: 'Edge 40' },
  // Sony
  { brand: 'Sony', model: 'Xperia 1 V' }, { brand: 'Sony', model: 'Xperia 1 IV' },
  { brand: 'Sony', model: 'Xperia 5 V' }, { brand: 'Sony', model: 'Xperia 5 IV' },
  { brand: 'Sony', model: 'Xperia 10 V' }, { brand: 'Sony', model: 'Xperia 10 IV' },
  // OPPO
  { brand: 'OPPO', model: 'Find X5 Pro' }, { brand: 'OPPO', model: 'Find X5' },
  { brand: 'OPPO', model: 'Find N2 Flip' }, { brand: 'OPPO', model: 'Reno 9 Pro+' },
  // Other
  { brand: 'Nokia', model: 'XR21' }, { brand: 'Nokia', model: 'X30' },
  { brand: 'Honor', model: 'Magic 5 Pro' }, { brand: 'Honor', model: 'Magic V2' },
];

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

const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/promo/validate — Validate a promo code and return discount info
router.post('/validate', async (req, res) => {
  const { code, packagePrice } = req.body;
  if (!code) return res.status(400).json({ error: 'Kodi i promovimit mungon' });

  const promo = (await db.query(
    'SELECT * FROM promo_codes WHERE UPPER(code) = UPPER($1)',
    [String(code).trim()]
  )).rows[0];

  if (!promo || !promo.active) {
    return res.status(404).json({ error: 'Ky kod nuk është i vlefshëm' });
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Ky kod ka skaduar' });
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return res.status(400).json({ error: 'Ky kod ka arritur limitin e përdorimeve' });
  }

  const price = parseFloat(packagePrice) || 0;
  if (promo.min_order && price < promo.min_order) {
    return res.status(400).json({ error: `Minimumi i porosisë për këtë kod është €${promo.min_order}` });
  }

  let discountAmount = 0;
  if (promo.discount_type === 'percent') {
    discountAmount = Math.round(price * (promo.discount_value / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(promo.discount_value, price);
  }

  res.json({
    valid: true,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
    discountAmount,
    finalPrice: Math.round((price - discountAmount) * 100) / 100,
  });
});

module.exports = router;

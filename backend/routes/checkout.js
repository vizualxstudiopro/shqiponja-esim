const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middleware/rate-limit');
const { validateCheckout } = require('../middleware/validate');

// POST /api/checkout
// Lemon Squeezy has been fully disconnected. Stripe integration will replace this route.
router.post('/', apiLimiter, validateCheckout, async (_req, res) => {
  return res.status(503).json({
    error: 'Pagesat janë përkohësisht të çaktivizuara gjatë migrimit në Stripe. Ju lutem provoni së shpejti.',
    code: 'PAYMENTS_TEMPORARILY_DISABLED',
  });
});

module.exports = router;

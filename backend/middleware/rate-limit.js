const rateLimit = require('express-rate-limit');

// Strict limiter for auth endpoints (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Shumë kërkesa. Provo përsëri pas disa minutash.' },
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Shumë kërkesa. Provo përsëri pas disa minutash.' },
});

module.exports = { authLimiter, apiLimiter };

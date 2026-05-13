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
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Shumë kërkesa. Provo përsëri pas disa minutash.' },
});

// Stricter limiter for order endpoints
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Shumë kërkesa. Provo përsëri pas disa minutash.' },
});

// Payment creation limiter for checkout attempts
const checkoutIntentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Janë arritur maksimumi 5 tentativa pagese për këtë IP në 1 orë.' },
});

// Contact form limiter
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Shumë kërkesa nga forma e kontaktit. Provo përsëri pas disa minutash.' },
});

module.exports = { authLimiter, apiLimiter, orderLimiter, checkoutIntentLimiter, contactLimiter };

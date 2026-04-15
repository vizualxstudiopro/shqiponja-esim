const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiLimiter } = require('./middleware/rate-limit');
const { eurToAllRate, getRates } = require('./services/exchangeRates');

function createApp() {
  const app = express();
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.set('trust proxy', 1);
  app.use(helmet());

  const allowedOrigins = [FRONTEND_URL];
  if (FRONTEND_URL.includes('://www.')) {
    allowedOrigins.push(FRONTEND_URL.replace('://www.', '://'));
  } else if (FRONTEND_URL.includes('://') && !FRONTEND_URL.includes('://www.')) {
    allowedOrigins.push(FRONTEND_URL.replace('://', '://www.'));
  }

  // Allow Electron desktop app (dev mode)
  allowedOrigins.push('http://localhost:5173');
  allowedOrigins.push('http://localhost:5174');

  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

  app.use(morgan('short'));
  app.use(apiLimiter);

  app.use('/api/webhook/lemonsqueezy', express.raw({ type: 'application/json' }), require('../routes/webhook'));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), build: '2026-04-15-v15', lastSync: app.locals.lastSync || null });
  });

  app.get('/api/rates', async (_req, res) => {
    const rates = await getRates();
    const allRate = await eurToAllRate();
    // EUR is base, compute cross-rates from USD-based data
    const eurRate = rates.EUR || 0.92;
    const usdRate = 1 / eurRate;
    const gbpRate = (rates.GBP || 0.79) / eurRate;
    res.json({
      eur_to_all: allRate,
      base: 'EUR',
      rates: {
        EUR: 1,
        ALL: allRate,
        USD: Math.round(usdRate * 10000) / 10000,
        GBP: Math.round(gbpRate * 10000) / 10000,
      },
      updated_at: rates.updatedAt,
    });
  });

  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/auth/oauth', require('../routes/oauth'));
  app.use('/api/auth/2fa', require('../routes/two-factor'));
  app.use('/api/admin', require('../routes/admin'));
  app.use('/api/packages', require('../routes/packages'));
  app.use('/api/orders', require('../routes/orders'));
  app.use('/api/checkout', require('../routes/checkout'));
  app.use('/api/promo', require('../routes/promo'));
  app.use('/api/referrals', require('../routes/referrals'));
  app.use('/api/contact', require('../routes/contact'));
  app.use('/api/compatibility', require('../routes/compatibility'));

  app.get('/', (_req, res) => {
    res.json({ message: 'Shqiponja eSIM API' });
  });

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Gabim i brendshÃ«m i serverit' });
  });

  return app;
}

module.exports = { createApp };

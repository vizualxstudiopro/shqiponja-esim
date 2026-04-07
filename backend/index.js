// Shqiponja eSIM Backend v2.3 — 2026-04-07
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Run database migrations & seed
const { migrate } = require('./db/migrate');
const airalo = require('./lib/airaloService');

const { apiLimiter } = require('./middleware/rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Trust proxy (Railway, Heroku, etc. use reverse proxies)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — allow requests from the frontend
const allowedOrigins = [FRONTEND_URL];
if (FRONTEND_URL.includes('://www.')) {
  allowedOrigins.push(FRONTEND_URL.replace('://www.', '://'));
} else if (FRONTEND_URL.includes('://') && !FRONTEND_URL.includes('://www.')) {
  allowedOrigins.push(FRONTEND_URL.replace('://', '://www.'));
}
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow if in allowed origins list
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Request logging
app.use(morgan('short'));

app.use(apiLimiter);

// Lemon Squeezy webhook route
app.use('/api/webhook/lemonsqueezy', require('./routes/webhook'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Exchange rates endpoint (cached, real-time)
const { eurToAllRate, getRates } = require('./lib/exchangeRates');
app.get('/api/rates', async (req, res) => {
  const rates = await getRates();
  const allRate = await eurToAllRate();
  res.json({ eur_to_all: allRate, updated_at: rates.updatedAt });
});

// Temporary test-email endpoint (remove after testing)
const { sendTransactionalEmail } = require('./lib/emailService');
const { orderConfirmationTemplate } = require('./lib/email');
app.get('/api/test-email', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== 'shqiponja2026test') return res.status(403).json({ error: 'forbidden' });
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    await sendTransactionalEmail({
      toEmail: email,
      subject: 'Porosia jote — Shqiponja eSIM',
      html: await orderConfirmationTemplate({
        orderId: 'TEST-001',
        packageFlag: '🇦🇱',
        packageName: 'Albania — 5 GB',
        price: '13.00',
        iccid: '8999999012345678901',
        qrData: 'LPA:1$smdp.io$TEST-QR-CODE-SAMPLE-DATA-SHQIPONJA-ESIM',
      }),
      logLabel: 'TEST EMAIL',
    });
    res.json({ ok: true, sentTo: email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/oauth', require('./routes/oauth'));
app.use('/api/auth/2fa', require('./routes/two-factor'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/contact', require('./routes/contact'));

app.get('/', (req, res) => {
  res.json({ message: 'Shqiponja eSIM API' });
});

// Global error handler — catch unhandled errors
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Gabim i brendshëm i serverit' });
});

(async () => {
  await migrate();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (build: ${new Date().toISOString().slice(0,16)})`);
  });

  // ── Airalo auto-sync: sync packages on startup + every hour ──
  if (airalo.isEnabled()) {
    const packagesRoute = require('./routes/packages');
    const runSync = async () => {
      try {
        const synced = await packagesRoute.syncPackagesFromAiralo();
        console.log(`[AIRALO CRON] ${synced} packages synced at ${new Date().toISOString()}`);
      } catch (err) {
        console.error('[AIRALO CRON ERROR]', err.message);
      }
    };

    // Sync on startup (delay 10s to let DB settle)
    setTimeout(runSync, 10_000);
    // Then every 55 minutes (safely under the 60-min requirement)
    setInterval(runSync, 55 * 60 * 1000);
    console.log('[AIRALO CRON] Automatic package sync enabled (every 55 min)');
  }
})().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Run database migrations & seed
const { migrate } = require('./db/migrate');

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

// Paddle webhook route
app.use('/api/webhook/paddle', require('./routes/webhook'));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
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
  res.json({ message: 'Shqiponja eSIM API', version: '99e75ca-route-fix' });
});

// Global error handler — catch unhandled errors
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Gabim i brendshëm i serverit' });
});

(async () => {
  await migrate();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

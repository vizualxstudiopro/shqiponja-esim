const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Run database migrations & seed
require('./db/migrate');

const { apiLimiter } = require('./middleware/rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security headers
app.use(helmet());

// CORS — allow requests from the frontend (with and without www)
const allowedOrigins = [FRONTEND_URL];
if (FRONTEND_URL.includes('://www.')) {
  allowedOrigins.push(FRONTEND_URL.replace('://www.', '://'));
} else if (FRONTEND_URL.includes('://') && !FRONTEND_URL.includes('://www.')) {
  allowedOrigins.push(FRONTEND_URL.replace('://', '://www.'));
}
app.use(cors({ origin: allowedOrigins, credentials: true }));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

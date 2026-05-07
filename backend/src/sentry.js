const Sentry = require('@sentry/node');

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[SENTRY] SENTRY_DSN not set — error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Don't leak PII
    sendDefaultPii: false,
    // Ignore noisy non-errors
    ignoreErrors: [
      'Not allowed by CORS',
      'ECONNRESET',
      'EPIPE',
    ],
  });

  console.log('[SENTRY] Error monitoring enabled');
}

module.exports = { Sentry, initSentry };

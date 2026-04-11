require('dotenv').config();

const { createApp } = require('./app');
const { migrate } = require('./db/migrations/migrate');
const airalo = require('./services/airaloService');

const PORT = process.env.PORT || 3001;
const app = createApp();

async function startServer() {
  await migrate();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (build: ${new Date().toISOString().slice(0, 16)})`);
  });

  if (airalo.isEnabled()) {
    const packagesRoute = require('../routes/packages');
    const runSync = async () => {
      try {
        const synced = await packagesRoute.syncPackagesFromAiralo();
        console.log(`[AIRALO CRON] ${synced} packages synced at ${new Date().toISOString()}`);
      } catch (err) {
        console.error('[AIRALO CRON ERROR]', err.message);
      }
    };

    setTimeout(runSync, 10_000);
    setInterval(runSync, 55 * 60 * 1000);
    console.log('[AIRALO CRON] Automatic package sync enabled (every 55 min)');
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

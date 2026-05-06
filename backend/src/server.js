require('dotenv').config();

const { createApp } = require('./app');
const { migrate } = require('./db/migrations/migrate');
const airalo = require('./services/airaloService');
const { checkAndSendUsageSmsAlerts } = require('./services/usageSmsMonitor');

const PORT = process.env.PORT || 3001;
const AIRALO_INITIAL_DELAY_MS = Number(process.env.AIRALO_INITIAL_DELAY_MS || 10_000);
const AIRALO_SYNC_INTERVAL_MS = Number(process.env.AIRALO_SYNC_INTERVAL_MS || 60 * 60 * 1000);
const AIRALO_RETRY_DELAY_MS = Number(process.env.AIRALO_RETRY_DELAY_MS || 5 * 60 * 1000);
const AIRALO_USAGE_SMS_INTERVAL_MS = Number(process.env.AIRALO_USAGE_SMS_INTERVAL_MS || 15 * 60 * 1000);
const app = createApp();

async function startServer() {
  await migrate();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (build: ${new Date().toISOString().slice(0, 16)})`);
  });

  if (airalo.isEnabled()) {
    const packagesRoute = require('../routes/packages');
    let syncInProgress = false;
    let usageSmsInProgress = false;

    const runSync = async (reason = 'cron') => {
      if (syncInProgress) {
        return false;
      }
      syncInProgress = true;
      try {
        const synced = await packagesRoute.syncPackagesFromAiralo();
        const at = new Date().toISOString();
        app.locals.lastSync = { at, count: synced, error: null, reason };
        console.log(`[AIRALO SYNC] ${synced} packages synced at ${at} (${reason})`);
      } catch (err) {
        const at = new Date().toISOString();
        app.locals.lastSync = { at, count: 0, error: err.message, reason };
        console.error('[AIRALO SYNC ERROR]', err.message);
        // Retry soon after temporary failures without waiting for full interval.
        setTimeout(() => {
          runSync('retry-after-error').catch(() => {});
        }, AIRALO_RETRY_DELAY_MS);
      } finally {
        syncInProgress = false;
      }
      return true;
    };

    app.locals.triggerAiraloSync = runSync;

    const runUsageSmsMonitor = async (reason = 'cron') => {
      if (usageSmsInProgress) {
        return false;
      }
      usageSmsInProgress = true;
      try {
        const result = await checkAndSendUsageSmsAlerts();
        const at = new Date().toISOString();
        app.locals.lastUsageSmsCheck = { at, ...result, error: null, reason };
        console.log(`[USAGE SMS CRON] checked=${result.checked} sent=${result.sent} skipped=${result.skipped} at ${at} (${reason})`);
      } catch (err) {
        const at = new Date().toISOString();
        app.locals.lastUsageSmsCheck = { at, checked: 0, sent: 0, skipped: 0, error: err.message, reason };
        console.error('[USAGE SMS CRON ERROR]', err.message);
      } finally {
        usageSmsInProgress = false;
      }
      return true;
    };

    app.locals.triggerUsageSmsMonitor = runUsageSmsMonitor;

    setTimeout(() => {
      runSync('startup').catch(() => {});
    }, AIRALO_INITIAL_DELAY_MS);

    setTimeout(() => {
      runUsageSmsMonitor('startup').catch(() => {});
    }, AIRALO_INITIAL_DELAY_MS + 30_000);

    setInterval(() => {
      runSync('interval').catch(() => {});
    }, AIRALO_SYNC_INTERVAL_MS);

    setInterval(() => {
      runUsageSmsMonitor('interval').catch(() => {});
    }, AIRALO_USAGE_SMS_INTERVAL_MS);

    console.log('[AIRALO CRON] Automatic package sync enabled');
    console.log(`[AIRALO CRON] Interval=${AIRALO_SYNC_INTERVAL_MS}ms, Retry=${AIRALO_RETRY_DELAY_MS}ms`);
    console.log(`[USAGE SMS CRON] Interval=${AIRALO_USAGE_SMS_INTERVAL_MS}ms`);
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

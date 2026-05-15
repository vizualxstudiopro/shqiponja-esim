require('dotenv').config();

const { createApp } = require('./app');
const { migrate } = require('./db/migrations/migrate');
const airalo = require('./services/airaloService');
const { checkAndSendUsageSmsAlerts } = require('./services/usageSmsMonitor');
const { sendEsimActivationReminders } = require('./services/esimActivationReminder');
const { sendAbandonedCartReminders } = require('./services/abandonedCartReminder');
const db = require('./db/client');

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

    // eSIM activation reminder — runs every hour
    const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // 1 orë
    let reminderInProgress = false;
    const runEsimReminder = async (reason = 'cron') => {
      if (reminderInProgress) return;
      reminderInProgress = true;
      try {
        const result = await sendEsimActivationReminders();
        if (result.sent > 0 || result.failed > 0) {
          console.log(`[ESIM REMINDER] checked=${result.checked} sent=${result.sent} failed=${result.failed} (${reason})`);
        }
        app.locals.lastEsimReminder = { at: new Date().toISOString(), ...result, error: null };
      } catch (err) {
        console.error('[ESIM REMINDER ERROR]', err.message);
        app.locals.lastEsimReminder = { at: new Date().toISOString(), checked: 0, sent: 0, failed: 0, error: err.message };
      } finally {
        reminderInProgress = false;
      }
    };
    app.locals.triggerEsimReminder = runEsimReminder;
    setTimeout(() => runEsimReminder('startup').catch(() => {}), AIRALO_INITIAL_DELAY_MS + 60_000);
    setInterval(() => runEsimReminder('interval').catch(() => {}), REMINDER_INTERVAL_MS);
    console.log('[ESIM REMINDER CRON] eSIM activation reminder enabled (every 1h, sends at 48h mark)');

    // Abandoned cart recovery — runs every 30 min
    const CART_INTERVAL_MS = 30 * 60 * 1000;
    let cartReminderInProgress = false;
    const runAbandonedCart = async (reason = 'cron') => {
      if (cartReminderInProgress) return;
      cartReminderInProgress = true;
      try {
        const result = await sendAbandonedCartReminders();
        if (result.sent > 0 || result.failed > 0) {
          console.log(`[ABANDONED CART] checked=${result.checked} sent=${result.sent} failed=${result.failed} (${reason})`);
        }
        app.locals.lastAbandonedCart = { at: new Date().toISOString(), ...result, error: null };
      } catch (err) {
        console.error('[ABANDONED CART ERROR]', err.message);
        app.locals.lastAbandonedCart = { at: new Date().toISOString(), checked: 0, sent: 0, failed: 0, error: err.message };
      } finally {
        cartReminderInProgress = false;
      }
    };
    app.locals.triggerAbandonedCart = runAbandonedCart;
    setTimeout(() => runAbandonedCart('startup').catch(() => {}), AIRALO_INITIAL_DELAY_MS + 90_000);
    setInterval(() => runAbandonedCart('interval').catch(() => {}), CART_INTERVAL_MS);
    console.log('[ABANDONED CART CRON] Abandoned cart recovery enabled (every 30min, sends at 1h mark)');

    console.log('[AIRALO CRON] Automatic package sync enabled');
    console.log(`[AIRALO CRON] Interval=${AIRALO_SYNC_INTERVAL_MS}ms, Retry=${AIRALO_RETRY_DELAY_MS}ms`);
    console.log(`[USAGE SMS CRON] Interval=${AIRALO_USAGE_SMS_INTERVAL_MS}ms`);
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

/* ─── MONTHLY REPORT CRON ─── */
// Runs at 08:00 on the 1st of every month
async function sendMonthlyReport() {
  const { sendTransactionalEmail } = require('../lib/emailService');
  const { monthlyReportTemplate } = require('../lib/email');
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || 'admin@shqiponjaesim.com';

  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLabel = firstOfMonth.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long' });

    const [ordersRow, paidRow, revenueRow, usersRow, topRow] = await Promise.all([
      db.query("SELECT COUNT(*) c FROM orders WHERE created_at >= $1 AND created_at < $2", [firstOfMonth, lastOfMonth]),
      db.query("SELECT COUNT(*) c FROM orders WHERE payment_status='paid' AND created_at >= $1 AND created_at < $2", [firstOfMonth, lastOfMonth]),
      db.query("SELECT COALESCE(SUM(p.price),0) r FROM orders o JOIN packages p ON p.id=o.package_id WHERE o.payment_status='paid' AND o.created_at >= $1 AND o.created_at < $2", [firstOfMonth, lastOfMonth]),
      db.query("SELECT COUNT(*) c FROM users WHERE created_at >= $1 AND created_at < $2", [firstOfMonth, lastOfMonth]),
      db.query(`SELECT p.name, p.flag, COUNT(*) AS count, SUM(p.price) AS revenue
        FROM orders o JOIN packages p ON p.id=o.package_id
        WHERE o.payment_status='paid' AND o.created_at >= $1 AND o.created_at < $2
        GROUP BY p.id, p.name, p.flag ORDER BY count DESC LIMIT 5`, [firstOfMonth, lastOfMonth]),
    ]);

    const topPackages = topRow.rows.map(r => ({
      name: `${r.flag || ''} ${r.name}`,
      count: parseInt(r.count),
      revenue: parseFloat(r.revenue || 0),
    }));

    await sendTransactionalEmail({
      toEmail: ADMIN_EMAIL,
      subject: `Raport Mujor — ${monthLabel} — Shqiponja eSIM`,
      html: await monthlyReportTemplate({
        month: monthLabel,
        totalOrders: parseInt(ordersRow.rows[0].c),
        paidOrders: parseInt(paidRow.rows[0].c),
        totalRevenue: parseFloat(revenueRow.rows[0].r),
        newUsers: parseInt(usersRow.rows[0].c),
        topPackages,
      }),
      logLabel: 'MONTHLY REPORT',
      senderType: 'noreply',
    });
    console.log(`[MONTHLY REPORT] Sent for ${monthLabel} to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('[MONTHLY REPORT ERROR]', err.message);
  }
}

function scheduleMonthlyReport() {
  const now = new Date();
  // Next 1st of month at 08:00
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0);
  const msUntilNext = next.getTime() - now.getTime();
  console.log(`[MONTHLY REPORT] Scheduled in ${Math.round(msUntilNext / 3600000)}h (next: ${next.toISOString()})`);
  setTimeout(() => {
    sendMonthlyReport().catch(() => {});
    setInterval(() => sendMonthlyReport().catch(() => {}), 30 * 24 * 60 * 60 * 1000); // roughly monthly fallback
  }, msUntilNext);
}

scheduleMonthlyReport();

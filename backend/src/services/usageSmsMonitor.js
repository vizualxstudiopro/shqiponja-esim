const db = require('../../db');
const airalo = require('./airaloService');
const { send_sms, MESSAGE_TYPES } = require('./twilioService');

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function findFirstNumberByKey(obj, keyNames) {
  if (!obj || typeof obj !== 'object') return null;

  const entries = Object.entries(obj);
  for (const [key, value] of entries) {
    const normalizedKey = key.toLowerCase();
    if (keyNames.includes(normalizedKey)) {
      const n = toNumber(value);
      if (n !== null) return n;
    }
  }

  for (const [, value] of entries) {
    if (value && typeof value === 'object') {
      const n = findFirstNumberByKey(value, keyNames);
      if (n !== null) return n;
    }
  }

  return null;
}

function extractUsedPercent(usagePayload) {
  const payload = usagePayload || {};

  const directPercent = findFirstNumberByKey(payload, [
    'used_percent',
    'usedpercentage',
    'usage_percent',
    'usagepercentage',
    'consumed_percent',
    'percentage',
  ]);
  if (directPercent !== null) {
    return Math.max(0, Math.min(100, directPercent));
  }

  const used = findFirstNumberByKey(payload, ['used', 'consumed', 'used_bytes', 'consumed_bytes']);
  const total = findFirstNumberByKey(payload, ['total', 'total_bytes', 'allowance', 'allocated']);
  if (used !== null && total !== null && total > 0) {
    return Math.max(0, Math.min(100, (used / total) * 100));
  }

  const remaining = findFirstNumberByKey(payload, ['remaining', 'remaining_bytes']);
  if (remaining !== null && total !== null && total > 0) {
    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  }

  return null;
}

async function wasAlertSent(orderId, threshold) {
  const row = (
    await db.query(
      'SELECT id FROM order_sms_alerts WHERE order_id = $1 AND threshold_percent = $2 LIMIT 1',
      [orderId, threshold]
    )
  ).rows[0];
  return Boolean(row);
}

async function markAlertSent(orderId, threshold, sid, usedPercent) {
  await db.query(
    `INSERT INTO order_sms_alerts (order_id, threshold_percent, message_sid, usage_percent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (order_id, threshold_percent) DO NOTHING`,
    [orderId, threshold, sid || null, usedPercent]
  );
}

async function checkAndSendUsageSmsAlerts() {
  if (!airalo.isEnabled()) {
    return { checked: 0, sent: 0, skipped: 0 };
  }

  const candidates = (
    await db.query(
      `SELECT id, phone, iccid
       FROM orders
       WHERE payment_status = 'paid'
         AND status IN ('completed', 'active', 'awaiting_esim')
         AND iccid IS NOT NULL
         AND phone IS NOT NULL
         AND trim(phone) <> ''
       ORDER BY id DESC
       LIMIT 300`
    )
  ).rows;

  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < candidates.length; i++) {
    const order = candidates[i];
    // Pause 1s every 5 requests to avoid Airalo 429 rate limit
    if (i > 0 && i % 5 === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    try {
      const usage = await airalo.getEsimUsage(order.iccid);
      const usedPercent = extractUsedPercent(usage);

      if (usedPercent === null) {
        skipped += 1;
        continue;
      }

      let threshold = null;
      let messageType = null;

      if (usedPercent >= 100) {
        threshold = 100;
        messageType = MESSAGE_TYPES.usage_100;
      } else if (usedPercent >= 80) {
        threshold = 80;
        messageType = MESSAGE_TYPES.usage_80;
      }

      if (!threshold) {
        skipped += 1;
        continue;
      }

      const alreadySent = await wasAlertSent(order.id, threshold);
      if (alreadySent) {
        skipped += 1;
        continue;
      }

      const sms = await send_sms(order.phone, messageType);
      await markAlertSent(order.id, threshold, sms.sid, usedPercent);
      sent += 1;
      console.log(`[USAGE SMS] Order #${order.id} -> ${threshold}% sent (SID: ${sms.sid})`);
    } catch (err) {
      skipped += 1;
      if (err.response?.status === 429) {
        console.warn(`[USAGE SMS] Order #${order.id} rate-limited (429) — pausing 30s`);
        await new Promise(r => setTimeout(r, 30_000));
      } else {
        console.error(`[USAGE SMS] Order #${order.id} skipped:`, err.message);
      }
    }
  }

  return {
    checked: candidates.length,
    sent,
    skipped,
  };
}

module.exports = {
  checkAndSendUsageSmsAlerts,
  extractUsedPercent,
};

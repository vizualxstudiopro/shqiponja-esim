const db = require('../../db');

const REFERRAL_REWARD_GB = Number(process.env.REFERRAL_REWARD_GB || 3);

async function resolveOrderUser(order) {
  if (order.user_id) return order.user_id;
  const user = (await db.query('SELECT id FROM users WHERE lower(email) = lower($1)', [order.email])).rows[0];
  return user ? user.id : null;
}

async function processReferralRewardForOrder(orderId) {
  const order = (await db.query('SELECT id, user_id, email, payment_status FROM orders WHERE id = $1', [orderId])).rows[0];
  if (!order) {
    return { ok: false, reason: 'order_not_found' };
  }
  if (order.payment_status !== 'paid') {
    return { ok: false, reason: 'order_not_paid' };
  }

  const referredUserId = await resolveOrderUser(order);
  if (!referredUserId) {
    return { ok: false, reason: 'referred_user_not_found' };
  }

  const referral = (await db.query(
    `SELECT id, referrer_id, referred_id, status
     FROM referrals
     WHERE referred_id = $1
     ORDER BY created_at ASC
     LIMIT 1`,
    [referredUserId]
  )).rows[0];

  if (!referral) {
    return { ok: false, reason: 'referral_not_found' };
  }

  const alreadyGranted = (await db.query(
    'SELECT id FROM referral_rewards WHERE referral_id = $1 AND order_id = $2 LIMIT 1',
    [referral.id, order.id]
  )).rows[0];
  if (alreadyGranted) {
    return { ok: true, reason: 'already_granted' };
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE referrals
       SET status = 'completed', reward_type = 'data_gb', reward_value = $1, order_id = $2
       WHERE id = $3`,
      [REFERRAL_REWARD_GB, order.id, referral.id]
    );

    await client.query(
      `INSERT INTO referral_rewards (referral_id, user_id, order_id, reward_kind, reward_amount, status, note)
       VALUES ($1, $2, $3, 'data_gb', $4, 'granted', 'Referrer reward')`,
      [referral.id, referral.referrer_id, order.id, REFERRAL_REWARD_GB]
    );

    await client.query(
      `INSERT INTO referral_rewards (referral_id, user_id, order_id, reward_kind, reward_amount, status, note)
       VALUES ($1, $2, $3, 'data_gb', $4, 'granted', 'New user reward')`,
      [referral.id, referral.referred_id, order.id, REFERRAL_REWARD_GB]
    );

    await client.query('COMMIT');
    return { ok: true, reason: 'granted', referralId: referral.id };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[REFERRAL REWARD] Failed to grant reward:', err.message);
    return { ok: false, reason: 'db_error' };
  } finally {
    client.release();
  }
}

module.exports = {
  processReferralRewardForOrder,
  REFERRAL_REWARD_GB,
};

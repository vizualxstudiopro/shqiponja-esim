const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Generate a unique referral code for user
function generateReferralCode(userId) {
  const hash = crypto.createHash('sha256').update(`ref-${userId}-${Date.now()}`).digest('hex');
  return 'SHQ' + hash.slice(0, 7).toUpperCase();
}

// GET /api/referrals/my — Get my referral code + stats
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const user = (await db.query('SELECT id, referral_code FROM users WHERE id = $1', [req.user.id])).rows[0];
    if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });

    // Generate referral code if user doesn't have one
    let referralCode = user.referral_code;
    if (!referralCode) {
      referralCode = generateReferralCode(user.id);
      await db.query('UPDATE users SET referral_code = $1 WHERE id = $2', [referralCode, user.id]);
    }

    // Get referral stats
    const totalReferred = (await db.query(
      'SELECT COUNT(*) AS cnt FROM referrals WHERE referrer_id = $1', [user.id]
    )).rows[0].cnt;

    const completedReferrals = (await db.query(
      "SELECT COUNT(*) AS cnt FROM referrals WHERE referrer_id = $1 AND status = 'completed'", [user.id]
    )).rows[0].cnt;

    const totalRewardsGb = (await db.query(
      "SELECT COALESCE(SUM(reward_amount), 0) AS total FROM referral_rewards WHERE user_id = $1 AND reward_kind = 'data_gb' AND status = 'granted'", [user.id]
    )).rows[0].total;

    const rewardEntries = (await db.query(
      `SELECT rr.id, rr.reward_amount, rr.reward_kind, rr.status, rr.note, rr.created_at, rr.order_id,
              r.referrer_id, r.referred_id
       FROM referral_rewards rr
       JOIN referrals r ON r.id = rr.referral_id
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC
       LIMIT 20`,
      [user.id]
    )).rows;

    res.json({
      referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'https://shqiponjaesim.com'}/regjistrohu?ref=${referralCode}`,
      stats: {
        totalReferred: parseInt(totalReferred),
        completedReferrals: parseInt(completedReferrals),
        totalEarnings: parseFloat(totalRewardsGb),
        totalRewardsGb: parseFloat(totalRewardsGb),
      },
      rewards: rewardEntries.map((entry) => ({
        id: entry.id,
        amount: parseFloat(entry.reward_amount) || 0,
        kind: entry.reward_kind,
        status: entry.status,
        note: entry.note,
        orderId: entry.order_id,
        createdAt: entry.created_at,
        direction: entry.referrer_id === user.id ? 'referrer' : 'friend',
      })),
    });
  } catch (err) {
    console.error('Referral stats error:', err);
    res.status(500).json({ error: 'Gabim gjatë marrjes së të dhënave' });
  }
});

// GET /api/referrals/rewards — Lightweight rewards-only endpoint
router.get('/rewards', authMiddleware, async (req, res) => {
  try {
    const rewards = (await db.query(
      `SELECT id, reward_amount, reward_kind, status, note, order_id, created_at
       FROM referral_rewards
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    )).rows;

    const total = (await db.query(
      "SELECT COALESCE(SUM(reward_amount), 0) AS total FROM referral_rewards WHERE user_id = $1 AND reward_kind = 'data_gb' AND status = 'granted'",
      [req.user.id]
    )).rows[0].total;

    res.json({
      totalRewardsGb: parseFloat(total) || 0,
      rewards: rewards.map((entry) => ({
        id: entry.id,
        amount: parseFloat(entry.reward_amount) || 0,
        kind: entry.reward_kind,
        status: entry.status,
        note: entry.note,
        orderId: entry.order_id,
        createdAt: entry.created_at,
      })),
    });
  } catch (err) {
    console.error('Referral rewards error:', err);
    res.status(500).json({ error: 'Gabim gjate marrjes se rewards' });
  }
});

// POST /api/referrals/apply — Apply referral code (called during registration)
router.post('/apply', authMiddleware, async (req, res) => {
  const { referralCode } = req.body;
  if (!referralCode) return res.status(400).json({ error: 'Kodi i referimit mungon' });

  try {
    // Find referrer by code
    const referrer = (await db.query(
      'SELECT id FROM users WHERE referral_code = $1', [referralCode.toUpperCase().trim()]
    )).rows[0];
    if (!referrer) return res.status(400).json({ error: 'Kod referimi i pavlefshëm' });

    // Can't refer yourself
    if (referrer.id === req.user.id) {
      return res.status(400).json({ error: 'Nuk mund ta referoni veten' });
    }

    // Check if already referred
    const existing = (await db.query(
      'SELECT id FROM referrals WHERE referred_id = $1', [req.user.id]
    )).rows[0];
    if (existing) return res.status(400).json({ error: 'Tashmë keni një referim të aplikuar' });

    // Create referral record
    await db.query(
      'INSERT INTO referrals (referrer_id, referred_id, status) VALUES ($1, $2, $3)',
      [referrer.id, req.user.id, 'pending']
    );
    await db.query('UPDATE users SET referred_by = $1 WHERE id = $2', [referrer.id, req.user.id]);

    res.json({ ok: true, message: 'Kodi i referimit u aplikua me sukses' });
  } catch (err) {
    console.error('Apply referral error:', err);
    res.status(500).json({ error: 'Gabim gjatë aplikimit të referimit' });
  }
});

module.exports = router;

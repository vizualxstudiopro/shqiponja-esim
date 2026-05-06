const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  MESSAGE_TYPES,
  send_sms,
  sendVerifyCode,
  checkVerifyCode,
} = require('../src/services/twilioService');

const router = express.Router();

router.use(authMiddleware);

// POST /api/twilio/sms
router.post('/sms', async (req, res) => {
  const { toNumber, messageType, airaloLink } = req.body || {};

  if (!toNumber || !messageType) {
    return res.status(400).json({
      error: 'toNumber and messageType are required',
      supportedMessageTypes: Object.values(MESSAGE_TYPES),
    });
  }

  try {
    const result = await send_sms(toNumber, messageType, { airaloLink });
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[TWILIO SMS ERROR]', err.message);
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/twilio/verify/send
router.post('/verify/send', async (req, res) => {
  const { phoneNumber } = req.body || {};
  if (!phoneNumber) {
    return res.status(400).json({ error: 'phoneNumber is required' });
  }

  try {
    const result = await sendVerifyCode(phoneNumber);
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[TWILIO VERIFY SEND ERROR]', err.message);
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/twilio/verify/check
router.post('/verify/check', async (req, res) => {
  const { phoneNumber, code } = req.body || {};
  if (!phoneNumber || !code) {
    return res.status(400).json({ error: 'phoneNumber and code are required' });
  }

  try {
    const result = await checkVerifyCode(phoneNumber, code);
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[TWILIO VERIFY CHECK ERROR]', err.message);
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;

const MIN_ORDER_EUR = 0.5;
const MAX_ORDER_EUR_WITHOUT_VERIFICATION = 500;
const MAX_FAILED_CARD_ATTEMPTS_PER_DAY = 3;

function assertOrderAmountAllowed(amount) {
  if (amount < MIN_ORDER_EUR) {
    const error = new Error('Porositë nën €0.50 nuk lejohen.');
    error.statusCode = 400;
    error.code = 'ORDER_MINIMUM_NOT_MET';
    throw error;
  }

  if (amount > MAX_ORDER_EUR_WITHOUT_VERIFICATION) {
    const error = new Error('Porositë mbi €500 kërkojnë verifikim shtesë para pagesës.');
    error.statusCode = 403;
    error.code = 'EXTRA_VERIFICATION_REQUIRED';
    throw error;
  }
}

async function getFailedAttemptsForCard(db, cardFingerprint) {
  if (!cardFingerprint) {
    return 0;
  }

  const result = await db.query(
    `SELECT COUNT(*) AS count
     FROM payment_fraud_events
     WHERE card_fingerprint = $1
       AND event_type = 'card_payment_failed'
       AND event_date = CURRENT_DATE`,
    [cardFingerprint]
  );

  return Number(result.rows[0]?.count || 0);
}

async function assertCardAttemptsAllowed(db, cardFingerprint) {
  const failedAttempts = await getFailedAttemptsForCard(db, cardFingerprint);
  if (failedAttempts >= MAX_FAILED_CARD_ATTEMPTS_PER_DAY) {
    const error = new Error('Kjo kartë ka arritur limitin ditor të tentativave të dështuara. Përdor një kartë tjetër ose provo nesër.');
    error.statusCode = 429;
    error.code = 'CARD_ATTEMPT_LIMIT_REACHED';
    throw error;
  }
}

async function recordFailedCardAttempt(db, { orderId, stripePaymentIntentId, cardFingerprint, ipAddress, metadata }) {
  if (!cardFingerprint) {
    return;
  }

  await db.query(
    `INSERT INTO payment_fraud_events (
      order_id, stripe_payment_intent_id, card_fingerprint, event_type, ip_address, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      orderId || null,
      stripePaymentIntentId || null,
      cardFingerprint,
      'card_payment_failed',
      ipAddress || null,
      metadata ? JSON.stringify(metadata).slice(0, 2000) : null,
    ]
  );
}

module.exports = {
  MIN_ORDER_EUR,
  MAX_ORDER_EUR_WITHOUT_VERIFICATION,
  MAX_FAILED_CARD_ATTEMPTS_PER_DAY,
  assertOrderAmountAllowed,
  assertCardAttemptsAllowed,
  recordFailedCardAttempt,
};
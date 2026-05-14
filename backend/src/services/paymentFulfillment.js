const crypto = require('crypto');
const db = require('../../db');
const { sendTransactionalEmail } = require('./emailService');
const { orderConfirmationTemplate, paymentReceiptTemplate, generateInvoicePdfBuffer } = require('../utils/email');
const airalo = require('../../lib/airaloService');
const { processReferralRewardForOrder } = require('./referralRewards');

async function incrementPromoUsageIfNeeded(orderId) {
  const result = await db.query(
    `UPDATE promo_codes
     SET used_count = used_count + 1
     WHERE id = (
       SELECT promo_code_id
       FROM orders
       WHERE id = $1
         AND promo_code_id IS NOT NULL
     )
       AND id IN (
         SELECT promo_code_id
         FROM orders
         WHERE id = $1
           AND promo_code_id IS NOT NULL
       )`,
    [Number(orderId)]
  );

  return result.rowCount > 0;
}

async function sendPaidOrderEmails({ orderId, customerEmail }) {
  const updatedOrder = (await db.query(
    `SELECT o.*, p.name AS package_name, p.flag AS package_flag, p.price
     FROM orders o JOIN packages p ON p.id = o.package_id WHERE o.id = $1`,
    [Number(orderId)]
  )).rows[0];

  if (!updatedOrder) return;

  const toEmail = customerEmail || updatedOrder.email;
  const effectivePrice = updatedOrder.final_price || updatedOrder.price;
  const provisioningFailed = updatedOrder.status === 'awaiting_esim';

  if (provisioningFailed) {
    try {
      await sendTransactionalEmail({
        toEmail,
        subject: 'Pagesa u konfirmua — eSIM po përgatitet — Shqiponja eSIM',
        html: await orderConfirmationTemplate({
          orderId,
          packageFlag: updatedOrder.package_flag,
          packageName: updatedOrder.package_name,
          price: effectivePrice,
          iccid: null,
          qrData: null,
          qrCodeUrl: null,
          accessToken: updatedOrder.access_token || null,
        }),
        logLabel: 'ORDER EMAIL (awaiting eSIM)',
        senderType: 'noreply',
      });
    } catch (err) {
      console.error(`[EMAIL] Order #${orderId} awaiting-eSIM email failed:`, err.message);
    }
    return;
  }

  // Send confirmation email with QR code
  try {
    await sendTransactionalEmail({
      toEmail,
      subject: 'Porosia jote — Shqiponja eSIM',
      html: await orderConfirmationTemplate({
        orderId,
        packageFlag: updatedOrder.package_flag,
        packageName: updatedOrder.package_name,
        price: effectivePrice,
        iccid: updatedOrder.iccid,
        qrData: updatedOrder.qr_data,
        qrCodeUrl: updatedOrder.qr_code_url,
        accessToken: updatedOrder.access_token || null,
      }),
      logLabel: 'ORDER EMAIL',
      senderType: 'noreply',
    });
  } catch (err) {
    console.error(`[EMAIL] Order #${orderId} confirmation email failed:`, err.message);
  }

  // Send invoice email with PDF attachment (independent of confirmation)
  try {
    const invoicePdfBuffer = await generateInvoicePdfBuffer({
      orderId,
      packageName: updatedOrder.package_name,
      packageFlag: updatedOrder.package_flag,
      price: effectivePrice,
      email: toEmail,
      date: new Date(),
    });

    await sendTransactionalEmail({
      toEmail,
      subject: 'Fatura e pagesës — Shqiponja eSIM 🧾',
      html: paymentReceiptTemplate({
        orderId,
        packageName: updatedOrder.package_name,
        packageFlag: updatedOrder.package_flag,
        price: effectivePrice,
        email: toEmail,
        date: new Date(),
        accessToken: updatedOrder.access_token || null,
      }),
      logLabel: 'PAYMENT RECEIPT',
      senderType: 'invoice',
      replyTo: 'invoice@shqiponjaesim.com',
      attachments: [
        {
          filename: `invoice-${String(orderId).padStart(5, '0')}.pdf`,
          content: invoicePdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error(`[EMAIL] Order #${orderId} invoice email failed:`, err.message);
  }
}

async function fulfillPaidOrder({ orderId, providerOrderId, provider = 'stripe', customerEmail, customerPhone, paymentIntentId }) {
  const order = (await db.query('SELECT * FROM orders WHERE id = $1', [Number(orderId)])).rows[0];
  if (!order) throw new Error(`Order not found: ${orderId}`);

  // Dedup guard: if already paid AND eSIM already provisioned, nothing to do
  if (order.payment_status === 'paid' && (order.iccid || order.qr_code_url)) {
    console.log(`[FULFILL] Order #${orderId} already fulfilled — skipping`);
    if (provider === 'stripe' && providerOrderId) {
      await db.query(
        'UPDATE orders SET stripe_checkout_session_id = COALESCE($1, stripe_checkout_session_id), stripe_payment_intent_id = COALESCE($2, stripe_payment_intent_id), payment_provider = COALESCE($3, payment_provider), paid_at = COALESCE(paid_at, NOW()) WHERE id = $4',
        [String(providerOrderId), paymentIntentId ? String(paymentIntentId) : null, provider, Number(orderId)]
      );
    }
    return;
  }

  // If paid but no eSIM data — something crashed previously, re-run email at minimum
  const alreadyPaid = order.payment_status === 'paid';
  if (alreadyPaid) {
    console.warn(`[FULFILL] Order #${orderId} is paid but has no eSIM data — re-sending email`);
    await sendPaidOrderEmails({ orderId, customerEmail });
    return;
  }

  const qrData = `SHQIPONJA-ESIM-${orderId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [order.package_id])).rows[0];

  let airaloQr = qrData;
  let iccid = null;
  let qrCodeUrl = null;
  let activationCode = null;
  let airaloOrderId = null;

  const esimProvisioningAttempted = airalo.isEnabled() && pkg && pkg.airalo_package_id;
  let provisioningFailed = false;
  if (esimProvisioningAttempted) {
    try {
      const airaloData = await airalo.createOrder(pkg.airalo_package_id, 1, `Order #${orderId}`);
      const esim = airaloData?.data?.sims?.[0];
      if (esim) {
        airaloQr = esim.qrcode || qrData;
        iccid = esim.iccid || null;
        qrCodeUrl = esim.qrcode_url || null;
        activationCode = esim.direct_apple_installation_url || null;
        airaloOrderId = String(airaloData.data.id);
      } else {
        provisioningFailed = true;
      }
    } catch (err) {
      console.error(`[AIRALO ORDER ERROR] Order #${orderId}:`, err.message);
      provisioningFailed = true;
    }
  }

  const orderStatus = (esimProvisioningAttempted && provisioningFailed) ? 'awaiting_esim' : 'completed';

  await db.query(
    `UPDATE orders SET payment_status = $1, status = $2, qr_data = $3,
      airalo_order_id = $4, iccid = $5, esim_status = $6, qr_code_url = $7, activation_code = $8,
      payment_provider = $9, paid_at = NOW(), phone = COALESCE($10, phone),
      stripe_checkout_session_id = COALESCE($11, stripe_checkout_session_id), stripe_payment_intent_id = COALESCE($12, stripe_payment_intent_id)
    WHERE id = $13`,
    [
      'paid',
      orderStatus,
      provisioningFailed ? null : airaloQr,
      airaloOrderId,
      iccid,
      iccid ? 'active' : (esimProvisioningAttempted ? 'provisioning_failed' : null),
      qrCodeUrl,
      activationCode,
      provider,
      customerPhone || null,
      provider === 'stripe' && providerOrderId ? String(providerOrderId) : null,
      paymentIntentId ? String(paymentIntentId) : null,
      Number(orderId),
    ]
  );

  await incrementPromoUsageIfNeeded(Number(orderId)).catch(err =>
    console.error(`[FULFILL] Order #${orderId} promo increment failed (non-blocking):`, err.message)
  );

  await processReferralRewardForOrder(Number(orderId)).catch(err =>
    console.error(`[FULFILL] Order #${orderId} referral reward failed (non-blocking):`, err.message)
  );

  await sendPaidOrderEmails({ orderId, customerEmail });
}

module.exports = { fulfillPaidOrder, sendPaidOrderEmails };

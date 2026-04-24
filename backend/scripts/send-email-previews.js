require('dotenv').config();

const {
  verifyEmailTemplate,
  resetPasswordTemplate,
  welcomeEmailTemplate,
  contactConfirmationTemplate,
  orderConfirmationTemplate,
  paymentReceiptTemplate,
  generateInvoicePdfBuffer,
} = require('../src/utils/email');
const { sendTransactionalEmail } = require('../src/services/emailService');

const toEmail = process.argv[2];

if (!toEmail) {
  console.error('Usage: node scripts/send-email-previews.js <email>');
  process.exit(1);
}

async function sendPreviewEmails() {
  const now = new Date();
  const orderId = 90001;
  const packageName = 'Global Premium 10GB / 30 Days';
  const packageFlag = '🌍';
  const price = 24.9;

  await sendTransactionalEmail({
    toEmail,
    subject: 'PREVIEW: Verifiko email-in — Shqiponja eSIM',
    html: verifyEmailTemplate('Besmir', 'https://shqiponjaesim.com/verifiko?token=preview-token-123'),
    logLabel: 'PREVIEW VERIFY',
    senderType: 'noreply',
  });

  await sendTransactionalEmail({
    toEmail,
    subject: 'PREVIEW: Rivendos fjalëkalimin — Shqiponja eSIM',
    html: resetPasswordTemplate('Besmir', 'https://shqiponjaesim.com/rivendos-fjalekalimin?token=preview-reset-123'),
    logLabel: 'PREVIEW RESET',
    senderType: 'noreply',
  });

  await sendTransactionalEmail({
    toEmail,
    subject: 'PREVIEW: Mirësevini në Shqiponja eSIM! 🎉',
    html: welcomeEmailTemplate('Besmir'),
    logLabel: 'PREVIEW WELCOME',
    senderType: 'hello',
    replyTo: 'info@shqiponjaesim.com',
  });

  await sendTransactionalEmail({
    toEmail,
    subject: 'PREVIEW: Konfirmim kontakti — Shqiponja eSIM',
    html: contactConfirmationTemplate('Besmir', 'Pershendetje! Ky eshte nje preview i email-it te kontaktit.'),
    logLabel: 'PREVIEW CONTACT',
    senderType: 'info',
    replyTo: 'info@shqiponjaesim.com',
  });

  const orderHtml = await orderConfirmationTemplate({
    orderId,
    packageFlag,
    packageName,
    price,
    iccid: '8944500100000001234',
    qrData: 'LPA:1$RSP.TRUPHONE.COM$ABCDEFG1234567890',
    qrCodeUrl: null,
  });

  await sendTransactionalEmail({
    toEmail,
    subject: 'PREVIEW: Porosia jote — Shqiponja eSIM',
    html: orderHtml,
    logLabel: 'PREVIEW ORDER',
    senderType: 'noreply',
  });

  const invoicePdf = await generateInvoicePdfBuffer({
    orderId,
    packageName,
    packageFlag,
    price,
    email: toEmail,
    date: now,
  });

  await sendTransactionalEmail({
    toEmail,
    subject: 'PREVIEW: Fatura e pagesës — Shqiponja eSIM 🧾',
    html: paymentReceiptTemplate({
      orderId,
      packageName,
      packageFlag,
      price,
      email: toEmail,
      date: now,
    }),
    logLabel: 'PREVIEW INVOICE',
    senderType: 'invoice',
    replyTo: 'invoice@shqiponjaesim.com',
    attachments: [
      {
        filename: `invoice-${String(orderId).padStart(5, '0')}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log(`All preview emails sent to ${toEmail}`);
}

sendPreviewEmails().catch((err) => {
  console.error('Preview sending failed:', err && err.message ? err.message : err);
  process.exit(1);
});

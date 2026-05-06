const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const AIRALO_PARTNER_LINK = process.env.AIRALO_PARTNER_LINK || 'https://www.airalo.com';

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

const MESSAGE_TYPES = {
  welcome_new_customer: 'welcome_new_customer',
  usage_80: 'usage_80',
  usage_100: 'usage_100',
};

function isTwilioSmsConfigured() {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && client);
}

function isTwilioVerifyConfigured() {
  return Boolean(
    TWILIO_ACCOUNT_SID &&
      TWILIO_AUTH_TOKEN &&
      TWILIO_VERIFY_SERVICE_SID &&
      client
  );
}

function normalizeToAlbaniaE164(rawNumber) {
  const value = String(rawNumber || '').trim();
  if (!value) {
    throw new Error('Phone number is required');
  }

  const compact = value.replace(/[\s\-()]/g, '');

  if (/^\+355\d{8,9}$/.test(compact)) {
    return compact;
  }

  if (/^355\d{8,9}$/.test(compact)) {
    return `+${compact}`;
  }

  if (/^0\d{8,9}$/.test(compact)) {
    return `+355${compact.slice(1)}`;
  }

  throw new Error('Phone number must be in E.164 format (+355...)');
}

function buildMessage(messageType, airaloLink = AIRALO_PARTNER_LINK) {
  switch (messageType) {
    case MESSAGE_TYPES.welcome_new_customer:
      return 'Mireserdhet ne Shqiponja eSIM! Numri juaj u verifikua me sukses. Tani mund te eksploroni paketat tona ne shqiponjaesim.com';
    case MESSAGE_TYPES.usage_80:
      return `Kujdes! Keni harxhuar 80 perqind te paketes suaj. Qe te mos mbeteni pa internet, mund te blini nje pakete te re ketu: ${airaloLink}`;
    case MESSAGE_TYPES.usage_100:
      return `Paketa juaj perfundoi 100 perqind. Per te vazhduar lundrimin ne internet, vizitoni linkun per te rimbushur: ${airaloLink}`;
    default:
      throw new Error('Unsupported message_type');
  }
}

async function send_sms(to_number, message_type, options = {}) {
  if (!isTwilioSmsConfigured()) {
    throw new Error('Twilio SMS is not configured');
  }

  const to = normalizeToAlbaniaE164(to_number);
  const body = buildMessage(message_type, options.airaloLink);

  const response = await client.messages.create({
    body,
    from: TWILIO_PHONE_NUMBER,
    to,
  });

  return {
    sid: response.sid,
    status: response.status,
    to,
    messageType: message_type,
  };
}

async function sendVerifyCode(to_number) {
  if (!isTwilioVerifyConfigured()) {
    throw new Error('Twilio Verify is not configured');
  }

  const to = normalizeToAlbaniaE164(to_number);
  const response = await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to, channel: 'sms' });

  return {
    sid: response.sid,
    status: response.status,
    to,
  };
}

async function checkVerifyCode(to_number, code) {
  if (!isTwilioVerifyConfigured()) {
    throw new Error('Twilio Verify is not configured');
  }

  const to = normalizeToAlbaniaE164(to_number);
  const token = String(code || '').trim();
  if (!/^\d{6}$/.test(token)) {
    throw new Error('Code must be 6 digits');
  }

  const response = await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to, code: token });

  return {
    approved: response.status === 'approved',
    status: response.status,
    to,
  };
}

module.exports = {
  MESSAGE_TYPES,
  isTwilioSmsConfigured,
  isTwilioVerifyConfigured,
  normalizeToAlbaniaE164,
  send_sms,
  sendVerifyCode,
  checkVerifyCode,
};

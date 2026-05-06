const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const TWILIO_ALPHA_SENDER = process.env.TWILIO_ALPHA_SENDER || 'SHQIPONJA';
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
const AIRALO_PARTNER_LINK = process.env.AIRALO_PARTNER_LINK || 'https://shqiponjaesim.com/packages';

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

const MESSAGE_TYPES = {
  welcome_new_customer: 'welcome_new_customer',
  usage_80: 'usage_80',
  usage_100: 'usage_100',
};

// Country prefixes that support Alphanumeric Sender ID.
// Serbia (+381) is intentionally excluded.
const ALPHA_SENDER_PREFIXES = [
  '+355', // Albania
  '+383', // Kosovo
  '+382', // Montenegro
  '+387', // Bosnia & Herzegovina
  '+389', // North Macedonia
  '+385', // Croatia
  '+386', // Slovenia
  '+43',  // Austria
  '+32',  // Belgium
  '+359', // Bulgaria
  '+420', // Czech Republic
  '+45',  // Denmark
  '+372', // Estonia
  '+358', // Finland
  '+33',  // France
  '+49',  // Germany
  '+30',  // Greece
  '+36',  // Hungary
  '+353', // Ireland
  '+39',  // Italy
  '+371', // Latvia
  '+370', // Lithuania
  '+352', // Luxembourg
  '+356', // Malta
  '+31',  // Netherlands
  '+47',  // Norway
  '+48',  // Poland
  '+351', // Portugal
  '+40',  // Romania
  '+421', // Slovakia
  '+34',  // Spain
  '+46',  // Sweden
  '+41',  // Switzerland
  '+44',  // United Kingdom
];

function supportsAlphaSender(e164) {
  return ALPHA_SENDER_PREFIXES.some((prefix) => e164.startsWith(prefix));
}

// Returns messaging params: uses Messaging Service (alpha sender) for supported
// countries, falls back to direct phone number for unsupported ones.
function getMessageParams(toE164) {
  if (TWILIO_MESSAGING_SERVICE_SID && supportsAlphaSender(toE164)) {
    return { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID };
  }
  return { from: TWILIO_PHONE_NUMBER };
}

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

// Normalizes Albanian (0xx), Kosovo (04x), and any valid E.164 number.
function normalizeToAlbaniaE164(rawNumber) {
  const value = String(rawNumber || '').trim();
  if (!value) {
    throw new Error('Phone number is required');
  }

  const compact = value.replace(/[\s\-().]/g, '');

  // Already valid E.164
  if (/^\+\d{7,15}$/.test(compact)) {
    return compact;
  }

  // Albania: 355xxxxxxxxx → +355xxxxxxxxx
  if (/^355\d{8,9}$/.test(compact)) {
    return `+${compact}`;
  }

  // Albania local: 06x/07x → +355
  if (/^0[67]\d{7,8}$/.test(compact)) {
    return `+355${compact.slice(1)}`;
  }

  // Kosovo: 383xxxxxxxxx → +383xxxxxxxxx
  if (/^383\d{8,9}$/.test(compact)) {
    return `+${compact}`;
  }

  // Kosovo local: 04x → +383
  if (/^04\d{7,8}$/.test(compact)) {
    return `+383${compact.slice(1)}`;
  }

  throw new Error(`Phone number format not recognized: ${rawNumber}`);
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
  const senderParams = getMessageParams(to);

  const response = await client.messages.create({
    body,
    ...senderParams,
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

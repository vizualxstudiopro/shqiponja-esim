require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  send_sms,
  sendVerifyCode,
  checkVerifyCode,
  MESSAGE_TYPES,
} = require('../src/services/twilioService');

function usage() {
  console.log('Usage:');
  console.log('  node scripts/twilio-sms.js sms <to_number> <message_type> [airalo_link]');
  console.log('  node scripts/twilio-sms.js verify-send <to_number>');
  console.log('  node scripts/twilio-sms.js verify-check <to_number> <code>');
  console.log('');
  console.log('message_type values:');
  console.log(`  - ${MESSAGE_TYPES.welcome_new_customer}`);
  console.log(`  - ${MESSAGE_TYPES.usage_80}`);
  console.log(`  - ${MESSAGE_TYPES.usage_100}`);
}

async function run() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === 'sms') {
    const [toNumber, messageType, airaloLink] = args;
    if (!toNumber || !messageType) {
      usage();
      process.exit(1);
    }
    const result = await send_sms(toNumber, messageType, { airaloLink });
    console.log('SMS sent:', result);
    return;
  }

  if (command === 'verify-send') {
    const [toNumber] = args;
    if (!toNumber) {
      usage();
      process.exit(1);
    }
    const result = await sendVerifyCode(toNumber);
    console.log('Verify code sent:', result);
    return;
  }

  if (command === 'verify-check') {
    const [toNumber, code] = args;
    if (!toNumber || !code) {
      usage();
      process.exit(1);
    }
    const result = await checkVerifyCode(toNumber, code);
    console.log('Verify check:', result);
    return;
  }

  usage();
  process.exit(1);
}

run().catch((err) => {
  console.error('Twilio script error:', err.message);
  process.exit(1);
});

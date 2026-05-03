const fs = require("fs");
const path = require("path");

// Load .env.local file manually from root, or .env from backend
let envPaths = [
  path.join(__dirname, "../.env.local"),
  path.join(__dirname, "../backend/.env")
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key) {
          process.env[key.trim()] = valueParts.join("=").trim();
        }
      }
    });
    console.log(`✓ Loaded environment from ${envPath}`);
    break;
  }
}

const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);
const TEST_PHONE = "+355696969348";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendSMS(to, message) {
  try {
    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to,
    });
    console.log(`✓ SMS sent: "${message.substring(0, 50)}..."`);
    console.log(`  SID: ${result.sid}\n`);
  } catch (error) {
    console.error(`✗ Failed to send SMS:`, error.message);
  }
}

async function run() {
  console.log("Starting comprehensive Twilio test sequence...\n");

  // Purchase Confirmation
  console.log("1. Sending purchase confirmation...");
  await sendSMS(
    TEST_PHONE,
    "Shqiponja eSIM: Hello Besmir! Your package for Evrope (10GB, 30 days) is active. View details: https://shqiponjaesim.com/profili"
  );
  await sleep(2000);

  // Usage Alert 80%
  console.log("2. Sending usage alert (80%)...");
  await sendSMS(TEST_PHONE, "Hi Besmir, you used 80% of your data. Top up soon.");
  await sleep(2000);

  // Usage Alert 100%
  console.log("3. Sending usage alert (100%)...");
  await sendSMS(TEST_PHONE, "Hi Besmir, you used 100% of your data. Please top up.");
  await sleep(2000);

  // OTP SMS
  console.log("4. Sending OTP...");
  await sendSMS(TEST_PHONE, "Shqiponja eSIM: Your verification code is 123456.");

  console.log("\n✓ Comprehensive Twilio test sequence completed.");
}

run().catch((error) => {
  console.error("✗ Twilio test sequence failed:", error);
  process.exit(1);
});

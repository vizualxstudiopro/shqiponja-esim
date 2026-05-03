import {
  sendOTPSMS,
  sendPurchaseConfirmation,
  sendUsageAlert,
} from "../lib/twilio.ts";

const TEST_PHONE = "+355696969348";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
  console.log("Starting comprehensive Twilio test sequence...");

  await sendPurchaseConfirmation(
    TEST_PHONE,
    "Besmir",
    "Evrope",
    10,
    30,
    "https://shqiponjaesim.com/profili"
  );
  await sleep(2000);

  await sendUsageAlert(TEST_PHONE, "Besmir", 80);
  await sleep(2000);

  await sendUsageAlert(TEST_PHONE, "Besmir", 100);
  await sleep(2000);

  await sendOTPSMS(TEST_PHONE, "123456");

  console.log("Comprehensive Twilio test sequence completed.");
}

run().catch((error) => {
  console.error("Twilio test sequence failed:", error);
  process.exit(1);
});


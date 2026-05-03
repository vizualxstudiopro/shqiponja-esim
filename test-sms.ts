import { sendSMS } from "./lib/twilio";

async function main() {
  await sendSMS("+355696969348", "Test nga Shqiponja eSIM");
}

main().catch((error) => {
  console.error("SMS test failed:", error);
  process.exit(1);
});

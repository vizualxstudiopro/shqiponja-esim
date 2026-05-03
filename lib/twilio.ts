import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client =
  accountSid && authToken
    ? twilio(accountSid, authToken)
    : null;

export async function sendSMS(to: string, message: string): Promise<void> {
  try {
    if (!accountSid || !authToken || !fromPhoneNumber) {
      throw new Error("Missing Twilio environment variables");
    }

    if (!client) {
      throw new Error("Twilio client is not initialized");
    }

    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to,
    });

    console.log(`SMS sent successfully. SID: ${result.sid}`);
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}

export async function sendPurchaseConfirmation(
  to: string,
  clientName: string,
  region: string,
  dataGB: number,
  validityDays: number,
  profileLink: string
): Promise<void> {
  try {
    if (!accountSid || !authToken || !fromPhoneNumber) {
      throw new Error("Missing Twilio environment variables");
    }

    if (!client) {
      throw new Error("Twilio client is not initialized");
    }

    const message = `Shqiponja eSIM: Hello ${clientName}! Your package for ${region} (${dataGB}GB, ${validityDays} days) is active. View details: ${profileLink}`;

    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to,
    });

    console.log(`Purchase confirmation SMS sent successfully. SID: ${result.sid}`);
  } catch (error) {
    console.error("Failed to send purchase confirmation SMS:", error);
    throw error;
  }
}

export async function sendUsageAlert(
  to: string,
  clientName: string,
  usagePercent: 80 | 100
): Promise<void> {
  try {
    if (!accountSid || !authToken || !fromPhoneNumber) {
      throw new Error("Missing Twilio environment variables");
    }

    if (!client) {
      throw new Error("Twilio client is not initialized");
    }

    const message =
      usagePercent === 80
        ? `Shqiponja eSIM: Hi ${clientName}, you used 80% of your data. Top up soon.`
        : `Shqiponja eSIM: Hi ${clientName}, you used 100% of your data. Please top up.`;

    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to,
    });

    console.log(`Usage alert SMS sent successfully. SID: ${result.sid}`);
  } catch (error) {
    console.error("Failed to send usage alert SMS:", error);
    throw error;
  }
}

export async function sendOTPSMS(to: string, code: string): Promise<void> {
  try {
    if (!accountSid || !authToken || !fromPhoneNumber) {
      throw new Error("Missing Twilio environment variables");
    }

    if (!client) {
      throw new Error("Twilio client is not initialized");
    }

    const message = `Shqiponja eSIM: Your verification code is ${code}.`;

    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to,
    });

    console.log(`OTP SMS sent successfully. SID: ${result.sid}`);
  } catch (error) {
    console.error("Failed to send OTP SMS:", error);
    throw error;
  }
}

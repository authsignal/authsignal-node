import {createHmac} from "crypto";

// Default tolerance (in minutes) for difference between timestamp in signature and current time
// This is used to prevent replay attacks
const DEFAULT_TOLERANCE = 5;

export class Webhook {
  apiSecretKey: string;
  tolerance: number;

  constructor(apiSecretKey: string, tolerance?: number) {
    this.apiSecretKey = apiSecretKey;
    this.tolerance = tolerance ?? DEFAULT_TOLERANCE;
  }

  constructEvent(payload: WebhookPayload, signature: string): WebhookEvent {
    const parsedSignature = this.parseSignature(signature);

    const secondsSinceEpoch = Math.round(Date.now() / 1000);

    if (this.tolerance > 0 && parsedSignature.timestamp < secondsSinceEpoch - this.tolerance * 60) {
      throw new InvalidSignatureError("Timestamp is outside the tolerance zone.");
    }

    const hmacContent = parsedSignature.timestamp + "." + payload;

    const computedSignature = createHmac("sha256", this.apiSecretKey)
      .update(hmacContent)
      .digest("base64")
      .replace("=", "");

    if (parsedSignature.signature !== computedSignature) {
      throw new InvalidSignatureError("Signature mismatch.");
    }

    return JSON.parse(payload) as WebhookEvent;
  }

  parseSignature(value: string): SignatureHeaderData {
    try {
      const parts = value.split(",");

      const timestamp = parts[0].split("=")[1];
      const parsedTimestamp = parseInt(timestamp);

      const signature = parts[1].split("=")[1];

      return {
        signature,
        timestamp: parsedTimestamp,
      };
    } catch (ex) {
      throw new Error("Signature format is invalid.");
    }
  }
}

type WebhookPayload = string;

type WebhookEvent = {
  version: number;
  type: string;
  id: string;
  source: string;
  time: string;
  tenantId: string;
  data: unknown;
};

type SignatureHeaderData = {
  signature: string;
  timestamp: number;
};

class InvalidSignatureError extends Error {
  constructor(message: string) {
    super(message);
  }
}

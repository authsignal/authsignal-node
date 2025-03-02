import {createHmac} from "crypto";

// Default tolerance (in minutes) for difference between timestamp in signature and current time
// This is used to prevent replay attacks
const DEFAULT_TOLERANCE = 5;

export class Webhook {
  apiSecretKey: string;

  constructor(apiSecretKey: string) {
    this.apiSecretKey = apiSecretKey;
  }

  constructEvent(payload: WebhookPayload, signature: string, tolerance: number = DEFAULT_TOLERANCE): WebhookEvent {
    const parsedSignature = this.parseSignature(signature);

    const secondsSinceEpoch = Math.round(Date.now() / 1000);

    if (tolerance > 0 && parsedSignature.timestamp < secondsSinceEpoch - tolerance * 60) {
      throw new InvalidSignatureError("Timestamp is outside the tolerance zone.");
    }

    const hmacContent = parsedSignature.timestamp + "." + payload;

    const computedSignature = createHmac("sha256", this.apiSecretKey)
      .update(hmacContent)
      .digest("base64")
      .replace("=", "");

    let match = false;

    for (const signature of parsedSignature.signatures) {
      if (signature === computedSignature) {
        match = true;
      }
    }

    if (!match) {
      throw new InvalidSignatureError("Signature mismatch.");
    }

    return JSON.parse(payload) as WebhookEvent;
  }

  parseSignature(value: string): SignatureHeaderData {
    const parsedValue = value?.split(",").reduce<SignatureHeaderData>(
      (acc, item) => {
        const kv = item.split("=");

        if (kv[0] === "t") {
          acc.timestamp = parseInt(kv[1], 10);
        }

        if (kv[0] === VERSION) {
          acc.signatures.push(kv[1]);
        }

        return acc;
      },
      {
        timestamp: -1,
        signatures: [],
      }
    );

    if (!parsedValue || parsedValue.timestamp === -1 || parsedValue.signatures.length === 0) {
      throw new InvalidSignatureError("Signature format is invalid.");
    }

    return parsedValue;
  }
}

const VERSION = "v2";

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

interface SignatureHeaderData {
  signatures: string[];
  timestamp: number;
}

class InvalidSignatureError extends Error {
  constructor(message: string) {
    super(message);
  }
}

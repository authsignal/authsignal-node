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
    this.verifySignature(payload, signature, tolerance);

    const parsedPayload = this.parsePayload(payload);

    if ("records" in parsedPayload) {
      throw new InvalidPayloadError("Payload is a batch of log events. Use constructLogEventBatch instead.");
    }

    this.validateEvent(parsedPayload, "data");

    return parsedPayload as WebhookEvent;
  }

  constructLogEventBatch(
    payload: WebhookPayload,
    signature: string,
    tolerance: number = DEFAULT_TOLERANCE
  ): WebhookEventBatch {
    this.verifySignature(payload, signature, tolerance);

    const parsedPayload = this.parsePayload(payload);

    if (!("records" in parsedPayload) || !Array.isArray(parsedPayload.records)) {
      throw new InvalidPayloadError("Payload format is invalid. Expected a 'records' array.");
    }

    for (const event of parsedPayload.records) {
      this.validateEvent(event, "record");
    }

    return parsedPayload as WebhookEventBatch;
  }

  private parsePayload(payload: WebhookPayload): Record<string, unknown> {
    try {
      const parsedPayload = JSON.parse(payload) as unknown;

      if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
        throw new InvalidPayloadError("Payload format is invalid.");
      }

      return parsedPayload as Record<string, unknown>;
    } catch (error) {
      if (error instanceof InvalidPayloadError) {
        throw error;
      }

      throw new InvalidPayloadError("Payload format is invalid.");
    }
  }

  private validateEvent(event: unknown, contentField: "data" | "record"): void {
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      throw new InvalidPayloadError("Payload format is invalid.");
    }

    const fields = event as Record<string, unknown>;

    if (typeof fields.version !== "number" || fields.version <= 0) {
      throw new InvalidPayloadError("Payload is missing required field 'version'.");
    }

    for (const field of ["type", "id", "source", "time", "tenantId"]) {
      const value = fields[field];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new InvalidPayloadError(`Payload is missing required field '${field}'.`);
      }
    }

    const content = fields[contentField];
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      throw new InvalidPayloadError(`Payload is missing required field '${contentField}'.`);
    }
  }

  private verifySignature(payload: WebhookPayload, signature: string, tolerance: number): void {
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

export type WebhookPayload = string;

export type WebhookEvent = {
  version: number;
  type: string;
  id: string;
  source: string;
  time: string;
  tenantId: string;
  data: WebhookEventData;
};

export type WebhookEventData = Record<string, unknown>;

export type WebhookLogEvent = {
  version: number;
  type: string;
  id: string;
  source: string;
  time: string;
  tenantId: string;
  record: WebhookEventData;
};

export type WebhookEventBatch = {
  records: WebhookLogEvent[];
};

interface SignatureHeaderData {
  signatures: string[];
  timestamp: number;
}

export class InvalidSignatureError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
  }
}

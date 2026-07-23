import {createHmac} from "crypto";
import {test, expect, describe} from "vitest";

import {Authsignal} from "../src";

const apiSecretKey = "test-secret-key";
const client = new Authsignal({apiSecretKey, apiUrl: "https://api.authsignal.com/v1"});

const createSignature = (payload: string, timestamp = Math.floor(Date.now() / 1000)): string => {
  const signature = createHmac("sha256", apiSecretKey)
    .update(`${timestamp}.${payload}`)
    .digest("base64")
    .replace("=", "");

  return `t=${timestamp},v2=${signature}`;
};

describe("authsignal webhook tests", () => {
  test("test invalid signature format", async () => {
    const payload = JSON.stringify({});
    const signature = "123";

    try {
      client.webhook.constructEvent(payload, signature);
    } catch (ex) {
      if (!(ex instanceof Error)) {
        throw new Error("Expected Error to be thrown");
      }

      expect(ex.message).toEqual("Signature format is invalid.");
    }
  });

  test("test timestamp tolerance error", async () => {
    const payload = JSON.stringify({});
    const signature = "t=1630000000,v2=invalid_signature";

    try {
      client.webhook.constructEvent(payload, signature);
    } catch (ex) {
      if (!(ex instanceof Error)) {
        throw new Error("Expected Error to be thrown");
      }

      expect(ex.message).toEqual("Timestamp is outside the tolerance zone.");
    }
  });

  test("test invalid computed signature", async () => {
    const payload = JSON.stringify({});
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `t=${timestamp},v2=invalid_signature`;

    try {
      client.webhook.constructEvent(payload, signature);
    } catch (ex) {
      if (!(ex instanceof Error)) {
        throw new Error("Expected Error to be thrown");
      }

      expect(ex.message).toEqual("Signature mismatch.");
    }
  });

  test("test valid signature", async () => {
    const payload = JSON.stringify({
      version: 1,
      id: "bc1598bc-e5d6-4c69-9afb-1a6fe3469d6e",
      source: "https://authsignal.com",
      time: "2025-02-20T01:51:56.070Z",
      tenantId: "7752d28e-e627-4b1b-bb81-b45d68d617bc",
      type: "email.created",
      data: {
        to: "chris@authsignal.com",
        code: "157743",
        userId: "b9f74d36-fcfc-4efc-87f1-3664ab5a7fb0",
        actionCode: "accountRecovery",
        idempotencyKey: "ba8c1a7c-775d-4dff-9abe-be798b7b8bb9",
        verificationMethod: "EMAIL_OTP",
      },
    });

    const event = client.webhook.constructEvent(payload, createSignature(payload));

    expect(event).toBeDefined();

    expect(event.version).toEqual(1);

    expect(event.data.actionCode).toEqual("accountRecovery");
  });

  test("test valid signature when 2 API keys active", async () => {
    const payload = JSON.stringify({
      version: 1,
      id: "af7be03c-ea8f-4739-b18e-8b48fcbe4e38",
      source: "https://authsignal.com",
      time: "2025-02-20T01:47:17.248Z",
      tenantId: "7752d28e-e627-4b1b-bb81-b45d68d617bc",
      type: "email.created",
      data: {
        to: "chris@authsignal.com",
        code: "718190",
        userId: "b9f74d36-fcfc-4efc-87f1-3664ab5a7fb0",
        actionCode: "accountRecovery",
        idempotencyKey: "68d68190-fac9-4e91-b277-c63d31d3c6b1",
        verificationMethod: "EMAIL_OTP",
      },
    });

    const validSignature = createSignature(payload);
    const signature = `${validSignature},v2=invalid_signature`;

    const event = client.webhook.constructEvent(payload, signature);

    expect(event).toBeDefined();
  });

  test("test event with custom variables", () => {
    const payload = JSON.stringify({
      version: 1,
      id: "bc1598bc-e5d6-4c69-9afb-1a6fe3469d6e",
      source: "https://authsignal.com",
      time: "2025-02-20T01:51:56.070Z",
      tenantId: "7752d28e-e627-4b1b-bb81-b45d68d617bc",
      type: "sms.created",
      data: {
        actionCode: "smsVerify",
        customVariables: {
          action_journeyType: "ForgotChangePassword",
          retryCount: 2,
          isRecovery: true,
          channels: ["sms", "email"],
        },
      },
    });

    const event = client.webhook.constructEvent(payload, createSignature(payload));
    const customVariables = event.data.customVariables as Record<string, unknown>;

    expect(customVariables.action_journeyType).toEqual("ForgotChangePassword");
    expect(customVariables.retryCount).toEqual(2);
    expect(customVariables.isRecovery).toEqual(true);
    expect(customVariables.channels).toEqual(["sms", "email"]);
  });

  test("test log event batch", () => {
    const payload = JSON.stringify({
      records: [
        {
          version: 1,
          id: "bc1598bc-e5d6-4c69-9afb-1a6fe3469d6e",
          source: "https://authsignal.com",
          time: "2025-02-20T01:51:56.070Z",
          tenantId: "7752d28e-e627-4b1b-bb81-b45d68d617bc",
          type: "action.log_created",
          record: {
            userId: "b9f74d36-fcfc-4efc-87f1-3664ab5a7fb0",
            customVariables: {journeyType: "accountRecovery"},
          },
        },
      ],
    });

    const batch = client.webhook.constructLogEventBatch(payload, createSignature(payload));

    expect(batch.records).toHaveLength(1);
    expect(batch.records[0].record.customVariables).toEqual({journeyType: "accountRecovery"});
  });

  test("test log event batch passed to construct event", () => {
    const payload = JSON.stringify({records: []});

    expect(() => client.webhook.constructEvent(payload, createSignature(payload))).toThrow(
      "Use constructLogEventBatch instead."
    );
  });

  test("test invalid payload", () => {
    const payload = "not-json";

    expect(() => client.webhook.constructEvent(payload, createSignature(payload))).toThrow(
      "Payload format is invalid."
    );
  });
});

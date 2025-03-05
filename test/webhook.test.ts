import {test, expect, describe} from "vitest";
import "dotenv/config";

import {Authsignal} from "../src";

const apiUrl = process.env.AUTHSIGNAL_API_URL;
const apiSecretKey = process.env.AUTHSIGNAL_API_SECRET_KEY;

if (!apiUrl) {
  console.log("AUTHSIGNAL_API_URL is undefined in env");
  process.exit(1);
}

if (!apiSecretKey) {
  console.log("AUTHSIGNAL_API_SECRET_KEY is undefined in env");
  process.exit(1);
}

const client = new Authsignal({apiSecretKey, apiUrl});

describe("authsignal webhook tests", () => {
  test("test invalid signature format", async () => {
    const payload = JSON.stringify({});
    const signature = "123";

    try {
      client.webhook.constructEvent(payload, signature);
    } catch (ex) {
      expect(ex.message).toEqual("Signature format is invalid.");
    }
  });

  test("test timestamp tolerance error", async () => {
    const payload = JSON.stringify({});
    const signature = "t=1630000000,v2=invalid_signature";

    try {
      client.webhook.constructEvent(payload, signature);
    } catch (ex) {
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

    // Ignore tolerance window
    const tolerance = -1;

    const signature = "t=1740016316,v2=NwFcIT68pK7g+m365Jj4euXj/ke3GSnkTpMPcRVi5q4";

    const event = client.webhook.constructEvent(payload, signature, tolerance);

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

    // Ignore tolerance window
    const tolerance = -1;

    const signature =
      "t=1740016037,v2=zI5rg1XJtKH8dXTX9VCSwy07qTPJliXkK9ppgNjmzqw,v2=KMg8mXXGO/SmNNmcszKXI4UaEVHLc21YNWthHfispQo";

    const event = client.webhook.constructEvent(payload, signature, tolerance);

    expect(event).toBeDefined();
  });
});

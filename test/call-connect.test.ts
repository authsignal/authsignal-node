import {v4} from "uuid";
import {test, expect, describe} from "vitest";
import "dotenv/config";

import {CallConnect} from "../src";

const apiUrl = process.env.AUTHSIGNAL_CALL_CONNECT_URL;
const apiSecretKey = process.env.AUTHSIGNAL_CALL_CONNECT_API_SECRET_KEY;

if (!apiUrl) {
  console.log("AUTHSIGNAL_CALL_CONNECT_URL is undefined in env");
  process.exit(1);
}

if (!apiSecretKey) {
  console.log("AUTHSIGNAL_CALL_CONNECT_API_SECRET_KEY is undefined in env");
  process.exit(1);
}

const client = new CallConnect({apiSecretKey, apiUrl});

describe("authsignal call connect tests", () => {
  test("start call test", async () => {
    const referenceId = v4();
    const channel = "WHATSAPP";

    const startCallRequest = {
      referenceId,
      phoneNumber: "+6427123456",
    };

    const startCallResponse = await client.startCall(startCallRequest);

    expect(startCallResponse).toBeDefined();
    expect(startCallResponse.channel).toEqual(channel);
  });
});

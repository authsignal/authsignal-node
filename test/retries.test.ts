import {createServer, IncomingMessage, ServerResponse} from "node:http";
import {AddressInfo} from "node:net";
import {afterEach, describe, expect, test} from "vitest";

import {Authsignal, AuthsignalError} from "../src";

const servers: ReturnType<typeof createServer>[] = [];

async function startServer(handler: (request: IncomingMessage, response: ServerResponse) => void) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const {port} = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function json(response: ServerResponse, status: number, body: object, headers: Record<string, string> = {}) {
  response.writeHead(status, {"Content-Type": "application/json", ...headers});
  response.end(JSON.stringify(body));
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("retry policy", () => {
  test("retries safe requests twice on 5xx", async () => {
    let attempts = 0;
    const apiUrl = await startServer((_request, response) => {
      attempts += 1;
      if (attempts < 3) return json(response, 503, {error: "unavailable"});
      return json(response, 200, {isEnrolled: false, emailVerified: false, phoneNumberVerified: false});
    });

    const client = new Authsignal({apiSecretKey: "secret", apiUrl});
    await expect(client.getUser({userId: "user"})).resolves.toMatchObject({isEnrolled: false});
    expect(attempts).toBe(3);
  });

  test("retries 429 and honors a zero Retry-After", async () => {
    let attempts = 0;
    const apiUrl = await startServer((_request, response) => {
      attempts += 1;
      if (attempts === 1) return json(response, 429, {error: "rate_limited"}, {"Retry-After": "0"});
      return json(response, 200, {isEnrolled: false, emailVerified: false, phoneNumberVerified: false});
    });

    const client = new Authsignal({apiSecretKey: "secret", apiUrl});
    await client.getUser({userId: "user"});
    expect(attempts).toBe(2);
  });

  test("retries transient network failures", async () => {
    let attempts = 0;
    const apiUrl = await startServer((_request, response) => {
      attempts += 1;
      if (attempts === 1) {
        response.socket?.destroy();
        return;
      }
      return json(response, 200, {isEnrolled: false, emailVerified: false, phoneNumberVerified: false});
    });

    const client = new Authsignal({apiSecretKey: "secret", apiUrl});
    await client.getUser({userId: "user"});
    expect(attempts).toBe(2);
  });

  test("retries an idempotent write", async () => {
    let attempts = 0;
    const apiUrl = await startServer((_request, response) => {
      attempts += 1;
      if (attempts === 1) return json(response, 503, {error: "unavailable"});
      return json(response, 200, {
        idempotencyKey: "key",
        state: "ALLOW",
        url: "",
        token: "",
        isEnrolled: false,
      });
    });

    const client = new Authsignal({apiSecretKey: "secret", apiUrl});
    await client.track({userId: "user", action: "withdrawal", attributes: {idempotencyKey: "key"}});
    expect(attempts).toBe(2);
  });

  test("does not retry a non-idempotent write or a 499", async () => {
    let postAttempts = 0;
    let challengeAttempts = 0;
    const apiUrl = await startServer((request, response) => {
      if (request.method === "POST") {
        postAttempts += 1;
        return json(response, 503, {error: "unavailable"});
      }
      challengeAttempts += 1;
      return json(response, 499, {error: "challenge_required"});
    });

    const client = new Authsignal({apiSecretKey: "secret", apiUrl});
    await expect(client.track({userId: "user", action: "withdrawal"})).rejects.toBeInstanceOf(AuthsignalError);
    await expect(client.getUser({userId: "user"})).rejects.toBeInstanceOf(AuthsignalError);
    expect(postAttempts).toBe(1);
    expect(challengeAttempts).toBe(1);
  });

  test("allows retries to be disabled", async () => {
    let attempts = 0;
    const apiUrl = await startServer((_request, response) => {
      attempts += 1;
      return json(response, 503, {error: "unavailable"});
    });

    const client = new Authsignal({apiSecretKey: "secret", apiUrl, retries: 0});
    await expect(client.getUser({userId: "user"})).rejects.toBeInstanceOf(AuthsignalError);
    expect(attempts).toBe(1);
  });
});

import {v4} from "uuid";
import {test, expect, describe} from "vitest";
import "dotenv/config";

import {Authsignal, AuthsignalError} from "../src";
import {UserActionState, VerificationMethod} from "../src/types";

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

describe("authsignal client tests", () => {
  test("user tests", async () => {
    const userId = v4();

    const enrollRequest = {
      userId,
      attributes: {
        verificationMethod: VerificationMethod.SMS,
        phoneNumber: "+6427000000",
      },
    };

    const enrollResponse = await client.enrollVerifiedAuthenticator(enrollRequest);

    expect(enrollResponse).toBeDefined();

    const userRequest = {userId};

    const userResponse = await client.getUser(userRequest);

    expect(userResponse).toBeDefined();
    expect(userResponse.isEnrolled).toBeTruthy();
    expect(userResponse.email).toBeUndefined();

    const email = "test@example.com";
    const phoneNumber = "+6427123456";
    const username = email;
    const displayName = "Test User";
    const custom = {foo: "bar"};

    const updateUserRequest = {
      userId,
      attributes: {
        email,
        phoneNumber,
        username,
        displayName,
        custom,
      },
    };

    const updateUserResponse = await client.updateUser(updateUserRequest);

    expect(updateUserResponse).toBeDefined();
    expect(updateUserResponse.email).toEqual(email);
    expect(updateUserResponse.phoneNumber).toEqual(phoneNumber);
    expect(updateUserResponse.username).toEqual(username);
    expect(updateUserResponse.displayName).toEqual(displayName);
    expect(updateUserResponse.custom?.foo).toEqual("bar");

    await client.deleteUser(userRequest);

    const deletedUserResponse = await client.getUser(userRequest);

    expect(deletedUserResponse.isEnrolled).toBeFalsy();
  });

  test("authenticator tests", async () => {
    const userId = v4();

    const enrollRequest = {
      userId,
      attributes: {
        verificationMethod: VerificationMethod.SMS,
        phoneNumber: "+6427000000",
      },
    };

    const enrollResponse = await client.enrollVerifiedAuthenticator(enrollRequest);

    expect(enrollResponse).toBeDefined();

    const userRequest = {userId};

    const authenticatorsResponse = await client.getAuthenticators(userRequest);

    expect(authenticatorsResponse).toBeDefined();
    expect(authenticatorsResponse.length).toBeGreaterThan(0);

    const authenticator = authenticatorsResponse[0];

    expect(authenticator.verificationMethod).toEqual(VerificationMethod.SMS);

    const authenticatorRequest = {
      userId,
      userAuthenticatorId: authenticator.userAuthenticatorId,
    };

    await client.deleteAuthenticator(authenticatorRequest);

    const emptyAuthenticatorsResponse = await client.getAuthenticators(userRequest);

    expect(emptyAuthenticatorsResponse).toBeDefined();
    expect(emptyAuthenticatorsResponse.length).toEqual(0);
  });

  test("action tests", async () => {
    const userId = v4();
    const action = "Login";

    const enrollRequest = {
      userId,
      attributes: {
        verificationMethod: VerificationMethod.SMS,
        phoneNumber: "+6427000000",
      },
    };

    const enrollResponse = await client.enrollVerifiedAuthenticator(enrollRequest);

    expect(enrollResponse).toBeDefined();

    const trackRequest = {userId, action};

    const trackResponse = await client.track(trackRequest);

    expect(trackResponse).toBeDefined();
    expect(trackResponse.state).toEqual(UserActionState.CHALLENGE_REQUIRED);

    const validateRequest = {
      attributes: {
        token: trackResponse.token,
      },
    };

    const validateResponse = await client.validateChallenge(validateRequest);

    expect(validateResponse).toBeDefined();
    expect(validateResponse.action).toEqual(action);
    expect(validateResponse.userId).toEqual(userId);
    expect(validateResponse.state).toEqual(UserActionState.CHALLENGE_REQUIRED);
    expect(validateResponse.isValid).toBeFalsy();

    const updateActionRequest = {
      userId,
      action,
      idempotencyKey: trackResponse.idempotencyKey,
      attributes: {
        state: UserActionState.REVIEW_REQUIRED,
      },
    };

    const updateActionResponse = await client.updateAction(updateActionRequest);

    expect(updateActionResponse).toBeDefined();

    const actionRequest = {userId, action, idempotencyKey: trackResponse.idempotencyKey};

    const actionResponse = await client.getAction(actionRequest);

    expect(actionResponse).toBeDefined();
    expect(actionResponse?.state).toEqual(UserActionState.REVIEW_REQUIRED);
  });

  test("invalid secret error", async () => {
    const invalidClient = new Authsignal({apiSecretKey: "invalid_secret", apiUrl});

    const userRequest = {
      userId: v4(),
    };

    try {
      await invalidClient.getUser(userRequest);
    } catch (ex) {
      const isAuthsignalError = ex instanceof AuthsignalError;

      const expectedDescription =
        "The request is unauthorized. Check that your API key and region base URL are correctly configured.";

      expect(isAuthsignalError).toBeTruthy();
      expect(ex.statusCode).toEqual(401);
      expect(ex.errorCode).toEqual("unauthorized");
      expect(ex.errorDescription).toEqual(expectedDescription);

      expect(ex.message).toEqual(`AuthsignalError: 401 - ${expectedDescription}`);
    }
  });

  test("test passkey authenticator", async () => {
    const userId = "b60429a1-6288-43dc-80c0-6a3e73dd51b9";

    const userRequest = {userId};

    const authenticators = await client.getAuthenticators(userRequest);

    expect(authenticators).toBeDefined();
    expect(authenticators.length).toBeGreaterThan(0);

    for (const authenticator of authenticators) {
      if (authenticator.verificationMethod === VerificationMethod.PASSKEY) {
        const name = authenticator.webauthnCredential?.aaguidMapping.name;

        expect(name).toBeDefined();

        if (name) {
          expect(["Google Password Manager", "iCloud Keychain"].includes(name)).toBeTruthy();
        }

        expect(authenticator.webauthnCredential?.parsedUserAgent?.browser?.name).toEqual("Chrome");
      }
    }
  });
});

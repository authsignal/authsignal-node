import axios from "axios";
import jwt, {GetPublicKeyOrSecret} from "jsonwebtoken";
import jwksRsa from "jwks-rsa";

import {
  AuthsignalConstructor,
  EnrollVerifiedAuthenticatorRequest,
  EnrollVerifiedAuthenticatorResponse,
  GetActionRequest,
  GetActionResponse,
  RedirectTokenPayload,
  TrackRequest,
  TrackResponse,
  UserActionState,
  UserRequest,
  UserResponse,
  ValidateChallengeRequest,
  ValidateChallengeResponse,
} from "./types";

export const DEFAULT_API_BASE_URL = "https://api.authsignal.com/v1";

export class Authsignal {
  tenantId: string;
  secret: string;
  apiBaseUrl: string;
  redirectUrl?: string;

  constructor({tenantId, secret, apiBaseUrl, redirectUrl}: AuthsignalConstructor) {
    this.tenantId = tenantId;
    this.secret = secret;
    this.apiBaseUrl = apiBaseUrl ?? DEFAULT_API_BASE_URL;
    this.redirectUrl = redirectUrl;
  }

  public async getUser(request: UserRequest): Promise<UserResponse> {
    const {userId} = request;

    const url = `${this.apiBaseUrl}/users/${userId}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.get<UserResponse>(url, config);

    return response.data;
  }

  public async track(request: TrackRequest): Promise<TrackResponse> {
    const {userId, action, redirectUrl = this.redirectUrl, ...rest} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}`;

    const data = {redirectUrl, ...rest};

    const config = this.getBasicAuthConfig();

    const response = await axios.post<TrackResponse>(url, data, config);

    return response.data;
  }

  public async getAction(request: GetActionRequest): Promise<GetActionResponse | undefined> {
    const {userId, action, idempotencyKey} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.get<GetActionResponse>(url, config);

      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return undefined;
      } else {
        throw err;
      }
    }
  }

  public async enrollVerifiedAuthenticator(
    request: EnrollVerifiedAuthenticatorRequest
  ): Promise<EnrollVerifiedAuthenticatorResponse> {
    const {userId, ...data} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/authenticators`;

    const config = this.getBasicAuthConfig();

    const response = await axios.post<EnrollVerifiedAuthenticatorResponse>(url, data, config);

    return response.data;
  }

  public async validateChallenge(request: ValidateChallengeRequest): Promise<ValidateChallengeResponse> {
    const {token} = request;

    const decodedToken = <RedirectTokenPayload>jwt.decode(token);

    const {userId, actionCode: action, idempotencyKey} = decodedToken.other;

    try {
      await this.verifyToken(token);
    } catch (err) {
      return {userId, success: false};
    }

    if (request.userId && request.userId !== userId) {
      return {userId, success: false};
    }

    if (action && idempotencyKey) {
      const actionResult = await this.getAction({userId, action, idempotencyKey});

      if (actionResult) {
        const {state} = actionResult;
        const success = state === UserActionState.CHALLENGE_SUCCEEDED;

        return {userId, success, state, action};
      }
    }

    return {userId, success: false};
  }

  private getBasicAuthConfig() {
    return {
      auth: {
        username: this.secret,
        password: "",
      },
    };
  }

  private async verifyToken(token: string): Promise<void> {
    const jwksUri = `${this.apiBaseUrl}/client/public/${this.tenantId}/.well-known/jwks`;

    const jwksClient = jwksRsa({jwksUri});

    const getPublicKeyOrSecret: GetPublicKeyOrSecret = (header, callback) => {
      if (header.alg === "RS256") {
        jwksClient.getSigningKey(header.kid, function (err, key) {
          const publicKey = key?.getPublicKey();

          callback(err, publicKey);
        });
      } else {
        callback(null, this.secret);
      }
    };

    return new Promise((resolve, reject) => {
      jwt.verify(token, getPublicKeyOrSecret, {}, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

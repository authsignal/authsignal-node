import axios, {AxiosError} from "axios";
import axiosRetry from "axios-retry";

import {mapToAuthsignalError} from "./error";
import {
  AuthsignalConstructor,
  GetActionRequest,
  GetActionResponse,
  GetChallengeRequest,
  GetChallengeResponse,
  DeleteAuthenticatorRequest,
  EnrollVerifiedAuthenticatorRequest,
  EnrollVerifiedAuthenticatorResponse,
  TrackRequest,
  TrackResponse,
  UpdateActionRequest,
  UpdateUserRequest,
  UserAuthenticator,
  GetUserRequest,
  GetUserResponse,
  ValidateChallengeRequest,
  ValidateChallengeResponse,
  UserAttributes,
  DeleteUserRequest,
  GetAuthenticatorsRequest,
  ActionAttributes,
} from "./types";
import {Webhook} from "./webhook";

export const DEFAULT_API_URL = "https://api.authsignal.com/v1";

const DEFAULT_RETRIES = 2;
const RETRY_ERROR_CODES = ["ECONNRESET", "EPIPE", "ECONNREFUSED"];
const SAFE_HTTP_METHODS = ["GET", "HEAD", "OPTIONS"];

function isRetryableAuthsignalError(error: AxiosError): boolean {
  // Retry on connection error
  if (!error.response) {
    return true;
  }

  if (error.code && RETRY_ERROR_CODES.includes(error.code)) {
    return true;
  }

  const {method} = error.request;
  const {status} = error.response;

  if (status >= 500 && status <= 599) {
    if (method && SAFE_HTTP_METHODS.includes(method)) {
      return true;
    }
  }

  return false;
}

export class Authsignal {
  apiSecretKey: string;
  apiUrl: string;
  webhook: Webhook;

  constructor({apiSecretKey, apiUrl, retries}: AuthsignalConstructor) {
    this.apiSecretKey = apiSecretKey;
    this.apiUrl = apiUrl ?? DEFAULT_API_URL;

    const axiosRetries = retries ?? DEFAULT_RETRIES;

    if (axiosRetries > 0) {
      axiosRetry(axios, {
        retries: axiosRetries,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: isRetryableAuthsignalError,
      });
    }

    this.webhook = new Webhook(apiSecretKey);
  }

  public async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    const {userId} = request;

    const url = `${this.apiUrl}/users/${userId}`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.get<GetUserResponse>(url, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async updateUser(request: UpdateUserRequest): Promise<UserAttributes> {
    const {userId, attributes} = request;

    const url = `${this.apiUrl}/users/${userId}`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.patch<UserAttributes>(url, attributes, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async deleteUser(request: DeleteUserRequest): Promise<void> {
    const {userId} = request;

    const url = `${this.apiUrl}/users/${userId}`;

    const config = this.getRequestConfig();

    try {
      await axios.delete(url, config);
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async getAuthenticators(request: GetAuthenticatorsRequest): Promise<UserAuthenticator[]> {
    const {userId} = request;

    const url = `${this.apiUrl}/users/${userId}/authenticators`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.get<UserAuthenticator[]>(url, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async enrollVerifiedAuthenticator(
    request: EnrollVerifiedAuthenticatorRequest
  ): Promise<EnrollVerifiedAuthenticatorResponse> {
    const {userId, attributes} = request;

    const url = `${this.apiUrl}/users/${userId}/authenticators`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.post<EnrollVerifiedAuthenticatorResponse>(url, attributes, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async deleteAuthenticator(request: DeleteAuthenticatorRequest): Promise<void> {
    const {userId, userAuthenticatorId} = request;

    const url = `${this.apiUrl}/users/${userId}/authenticators/${userAuthenticatorId}`;

    const config = this.getRequestConfig();

    try {
      await axios.delete(url, config);
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async track(request: TrackRequest): Promise<TrackResponse> {
    const {userId, action, attributes = {}} = request;

    const url = `${this.apiUrl}/users/${userId}/actions/${action}`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.post<TrackResponse>(url, attributes, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async validateChallenge(request: ValidateChallengeRequest): Promise<ValidateChallengeResponse> {
    const url = `${this.apiUrl}/validate`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.post<ValidateChallengeRawResponse>(url, request, config);

      const {actionCode: action, ...rest} = response.data;

      return {action, ...rest};
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async getAction(request: GetActionRequest): Promise<GetActionResponse> {
    const {userId, action, idempotencyKey} = request;

    const url = `${this.apiUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.get<GetActionResponse>(url, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async updateAction(request: UpdateActionRequest): Promise<ActionAttributes> {
    const {userId, action, idempotencyKey, attributes} = request;

    const url = `${this.apiUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.patch<ActionAttributes>(url, attributes, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async getChallenge(request: GetChallengeRequest): Promise<GetChallengeResponse> {
    const {userId, action, verificationMethod} = request;

    const url = new URL(`${this.apiUrl}/users/${userId}/challenge`);

    if (action) {
      url.searchParams.set("action", action);
    }

    if (verificationMethod) {
      url.searchParams.set("verificationMethod", verificationMethod);
    }

    const config = this.getRequestConfig();

    try {
      const response = await axios.get<GetChallengeResponse>(url.toString(), config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  private getRequestConfig() {
    return {
      auth: {
        username: this.apiSecretKey,
        password: "",
      },
    };
  }
}

type ValidateChallengeRawResponse = Omit<ValidateChallengeResponse, "action"> & {
  actionCode?: string;
};

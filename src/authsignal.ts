import axios, {AxiosInstance} from "axios";
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
  QueryUsersRequest,
  QueryUsersResponse,
  QueryUserActionsRequest,
  QueryUserActionsResponse,
  ClaimChallengeRequest,
  ClaimChallengeResponse,
  ChallengeRequest,
  ChallengeResponse,
  VerifyRequest,
  VerifyResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  ValidateSessionRequest,
  ValidateSessionResponse,
  RefreshSessionRequest,
  RefreshSessionResponse,
  RevokeSessionRequest,
  RevokeUserSessionsRequest,
} from "./types";
import {Webhook} from "./webhook";
import {DEFAULT_API_URL, VERSION} from "./config";
import {DEFAULT_RETRIES, DEFAULT_TIMEOUT, isRetryableAuthsignalError} from "./retries";

export class Authsignal {
  apiSecretKey: string;
  apiUrl: string;
  webhook: Webhook;
  private client: AxiosInstance;

  constructor({apiSecretKey, apiUrl, retries, timeout}: AuthsignalConstructor) {
    this.apiSecretKey = apiSecretKey;
    this.apiUrl = apiUrl ?? DEFAULT_API_URL;
    this.client = axios.create({timeout: timeout ?? DEFAULT_TIMEOUT});

    const axiosRetries = retries ?? DEFAULT_RETRIES;

    if (axiosRetries > 0) {
      axiosRetry(this.client, {
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
      const response = await this.client.get<GetUserResponse>(url, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async queryUsers(request: QueryUsersRequest): Promise<QueryUsersResponse> {
    const {username, email, phoneNumber, token, limit, lastEvaluatedUserId} = request;

    const url = new URL(`${this.apiUrl}/users`);

    if (username) {
      url.searchParams.set("username", username);
    }

    if (email) {
      url.searchParams.set("email", email);
    }

    if (phoneNumber) {
      url.searchParams.set("phoneNumber", phoneNumber);
    }

    if (token) {
      url.searchParams.set("token", token);
    }

    if (limit) {
      url.searchParams.set("limit", limit.toString());
    }

    if (lastEvaluatedUserId) {
      url.searchParams.set("lastEvaluatedUserId", lastEvaluatedUserId);
    }

    const config = this.getRequestConfig();

    try {
      const response = await this.client.get<QueryUsersResponse>(url.toString(), config);

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
      const response = await this.client.patch<UserAttributes>(url, attributes, config);

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
      await this.client.delete(url, config);
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async getAuthenticators(request: GetAuthenticatorsRequest): Promise<UserAuthenticator[]> {
    const {userId} = request;

    const url = `${this.apiUrl}/users/${userId}/authenticators`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.get<UserAuthenticator[]>(url, config);

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
      const response = await this.client.post<EnrollVerifiedAuthenticatorResponse>(url, attributes, config);

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
      await this.client.delete(url, config);
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async track(request: TrackRequest): Promise<TrackResponse> {
    const {userId, action, attributes = {}} = request;

    const url = `${this.apiUrl}/users/${userId}/actions/${action}`;

    const config = this.getRequestConfig(attributes.idempotencyKey);

    try {
      const response = await this.client.post<TrackResponse>(url, attributes, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async validateChallenge(request: ValidateChallengeRequest): Promise<ValidateChallengeResponse> {
    const url = `${this.apiUrl}/validate`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.post<ValidateChallengeRawResponse>(url, request, config);

      const {actionCode: action, ...rest} = response.data;

      return {action, ...rest};
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async claimChallenge(request: ClaimChallengeRequest): Promise<ClaimChallengeResponse> {
    const url = `${this.apiUrl}/claim`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.post<ClaimChallengeResponse>(url, request, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async getAction(request: GetActionRequest): Promise<GetActionResponse> {
    const {userId, action, idempotencyKey} = request;

    const url = `${this.apiUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.get<GetActionResponse>(url, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async queryUserActions(request: QueryUserActionsRequest): Promise<QueryUserActionsResponse> {
    const {userId, fromDate, actionCodes = [], state} = request;

    const url = new URL(`${this.apiUrl}/users/${userId}/actions`);

    if (fromDate) {
      url.searchParams.set("fromDate", fromDate);
    }

    if (actionCodes.length > 0) {
      url.searchParams.set("codes", actionCodes.join(","));
    }

    if (state) {
      url.searchParams.set("state", state);
    }

    const config = this.getRequestConfig();

    try {
      const response = await this.client.get<QueryUserActionsResponse>(url.toString(), config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async updateAction(request: UpdateActionRequest): Promise<ActionAttributes> {
    const {userId, action, idempotencyKey, attributes} = request;

    const url = `${this.apiUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getRequestConfig(idempotencyKey);

    try {
      const response = await this.client.patch<ActionAttributes>(url, attributes, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async challenge(request: ChallengeRequest): Promise<ChallengeResponse> {
    const url = `${this.apiUrl}/challenge`;

    const config = this.getRequestConfig(request.idempotencyKey);

    try {
      const response = await this.client.post<ChallengeResponse>(url, request, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const url = `${this.apiUrl}/verify`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.post<VerifyResponse>(url, request, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async getChallenge(request: GetChallengeRequest): Promise<GetChallengeResponse> {
    const {challengeId, userId, action, verificationMethod} = request;

    const url = new URL(`${this.apiUrl}/challenges`);

    if (challengeId) {
      url.searchParams.set("challengeId", challengeId);
    }

    if (userId) {
      url.searchParams.set("userId", userId);
    }

    if (action) {
      url.searchParams.set("action", action);
    }

    if (verificationMethod) {
      url.searchParams.set("verificationMethod", verificationMethod);
    }

    const config = this.getRequestConfig();

    try {
      const response = await this.client.get<GetChallengeResponse>(url.toString(), config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const url = `${this.apiUrl}/sessions`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.post<CreateSessionResponse>(url, request, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async validateSession(request: ValidateSessionRequest): Promise<ValidateSessionResponse> {
    const url = `${this.apiUrl}/sessions/validate`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.post<ValidateSessionResponse>(url, request, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
    const url = `${this.apiUrl}/sessions/refresh`;

    const config = this.getRequestConfig();

    try {
      const response = await this.client.post<RefreshSessionResponse>(url, request, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async revokeSession(request: RevokeSessionRequest): Promise<void> {
    const url = `${this.apiUrl}/sessions/revoke`;

    const config = this.getRequestConfig();

    try {
      await this.client.post(url, request, config);
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async revokeUserSessions(request: RevokeUserSessionsRequest): Promise<void> {
    const url = `${this.apiUrl}/sessions/user/revoke`;

    const config = this.getRequestConfig();

    try {
      await this.client.post(url, request, config);
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  private getRequestConfig(idempotencyKey?: string) {
    return {
      auth: {
        username: this.apiSecretKey,
        password: "",
      },
      headers: {
        "X-Authsignal-Version": VERSION,
        "User-Agent": "authsignal-node",
        ...(idempotencyKey ? {"Idempotency-Key": idempotencyKey} : {}),
      },
    };
  }
}

type ValidateChallengeRawResponse = Omit<ValidateChallengeResponse, "action"> & {
  actionCode?: string;
};

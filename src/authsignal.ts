import axios from "axios";

import {
  AuthsignalConstructor,
  ChallengeRequest,
  ChallengeResponse,
  EnrollVerifiedAuthenticatorRequest,
  EnrollVerifiedAuthenticatorResponse,
  GetActionRequest,
  GetActionResponse,
  TrackRequest,
  TrackResponse,
  UpdateUserRequest,
  UserRequest,
  UserResponse,
  ValidateChallengeRequest,
  ValidateChallengeResponse,
} from "./types";

export const DEFAULT_API_BASE_URL = "https://api.authsignal.com/v1";

export class Authsignal {
  secret: string;
  apiBaseUrl: string;
  redirectUrl?: string;

  constructor({secret, apiBaseUrl, redirectUrl}: AuthsignalConstructor) {
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

  public async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    const {userId, ...data} = request;

    const url = `${this.apiBaseUrl}/users/${userId}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.post<UserResponse>(url, data, config);

    return response.data;
  }

  public async getChallenge(request: ChallengeRequest): Promise<ChallengeResponse> {
    const {userId, action} = request;

    const urlParams = action ? `?action=${action}` : "";

    const url = `${this.apiBaseUrl}/users/${userId}/challenge${urlParams}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.get<ChallengeResponse>(url, config);

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
    const url = `${this.apiBaseUrl}/validate`;

    const config = this.getBasicAuthConfig();

    const response = await axios.post<ValidateChallengeRawResponse>(url, request, config);

    const {actionCode: action, ...rest} = response.data;

    return {action, ...rest};
  }

  private getBasicAuthConfig() {
    return {
      auth: {
        username: this.secret,
        password: "",
      },
    };
  }
}

type ValidateChallengeRawResponse = Omit<ValidateChallengeResponse, "action"> & {
  actionCode?: string;
};

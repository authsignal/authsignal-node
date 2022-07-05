import axios from "axios";

import {
  AuthsignalServerConstructor,
  EnrollVerifiedAuthenticatorRequest,
  EnrollVerifiedAuthenticatorResponse,
  GetActionRequest,
  GetActionResponse,
  MfaRequest,
  MfaResponse,
  TrackRequest,
  TrackResponse,
} from "./types";

const DEFAULT_SIGNAL_API_BASE_URL = "https://signal.authsignal.com/v1";

export class AuthsignalServer {
  secret: string;
  apiBaseUrl: string;

  constructor({secret, apiBaseUrl}: AuthsignalServerConstructor) {
    this.secret = secret;
    this.apiBaseUrl = apiBaseUrl ?? DEFAULT_SIGNAL_API_BASE_URL;
  }

  public async mfa(request: MfaRequest): Promise<MfaResponse> {
    const {userId, redirectUrl} = request;

    const queryParams = redirectUrl ? `?redirectUrl=${redirectUrl}` : "";

    const url = `${this.apiBaseUrl}/users/${userId}${queryParams}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.get<MfaResponse>(url, config);

    return response.data;
  }

  public async track(request: TrackRequest): Promise<TrackResponse> {
    const {userId, action, email, idempotencyKey, redirectUrl, ipAddress, userAgent, deviceId, custom} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}`;

    const data = {email, idempotencyKey, redirectUrl, ipAddress, userAgent, deviceId, custom};

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
    const {userId, oobChannel, phoneNumber, email} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/authenticators`;

    const data = {oobChannel, phoneNumber, email};

    const config = this.getBasicAuthConfig();

    const response = await axios.post<EnrollVerifiedAuthenticatorResponse>(url, data, config);

    return response.data;
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

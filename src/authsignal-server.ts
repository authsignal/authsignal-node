import axios from "axios";

import {
  AuthsignalServerConstructor,
  GetActionRequest,
  GetActionResponse,
  MfaRequest,
  MfaResponse,
  TrackRequest,
  TrackResponse,
  UserActionState,
} from "./types";

const DEFAULT_SIGNAL_API_BASE_URL = "https://signal.authsignal.com/v1";

export class AuthsignalServer {
  secret: string;
  apiBaseUrl: string;

  constructor({secret, apiBaseUrl}: AuthsignalServerConstructor) {
    this.secret = secret;
    this.apiBaseUrl = apiBaseUrl ?? DEFAULT_SIGNAL_API_BASE_URL;
  }

  public async mfa(input: MfaRequest): Promise<MfaResponse> {
    const {userId, redirectUrl} = input;

    const queryParams = redirectUrl ? `?redirectUrl=${redirectUrl}` : "";

    const url = `${this.apiBaseUrl}/users/${userId}${queryParams}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.get<MfaRawResponse>(url, config);

    return {
      url: response.data.url,
      isEnrolled: response.data.isEnrolled,
    };
  }

  public async track(input: TrackRequest): Promise<TrackResponse> {
    const {userId, action, email, idempotencyKey, redirectUrl, ipAddress, userAgent, deviceId, custom} = input;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}`;

    const data = {email, idempotencyKey, redirectUrl, ipAddress, userAgent, deviceId, custom};

    const config = this.getBasicAuthConfig();

    const response = await axios.post<TrackRawResponse>(url, data, config);

    return {
      state: response.data.state,
      idempotencyKey: response.data.idempotencyKey,
      challengeUrl: response.data.challengeUrl,
      ruleIds: response.data.ruleIds,
    };
  }

  public async getAction(input: GetActionRequest): Promise<GetActionResponse | undefined> {
    const {userId, action, idempotencyKey} = input;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.get<GetActionRawResponse>(url, config);

      return {
        state: response.data.state,
      };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return undefined;
      } else {
        throw err;
      }
    }
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

interface MfaRawResponse {
  isEnrolled: boolean;
  url: string;
}

interface TrackRawResponse {
  state: UserActionState;
  idempotencyKey: string;
  ruleIds: string[];
  challengeUrl?: string;
}

interface GetActionRawResponse {
  state: UserActionState;
}

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
    const {userId, action, idempotencyKey, redirectUrl, ipAddress, userAgent, deviceId, custom} = input;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const data = {redirectUrl, ipAddress, userAgent, deviceId, custom};

    const config = this.getBasicAuthConfig();

    const response = await axios.post<TrackRawResponse>(url, data, config);

    return {
      state: response.data.state,
      idempotencyKey: response.data.idempotencyKey,
      challengeUrl: response.data.challenge?.challengeUrl,
      ruleIds: response.data.ruleIds,
    };
  }

  public async getAction(input: GetActionRequest): Promise<GetActionResponse> {
    const {userId, action, idempotencyKey} = input;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.get<GetActionRawResponse>(url, config);

    return {
      state: response.data.state,
    };
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
  accessToken: string;
  url: string;
}

interface TrackRawResponse {
  challenge?: {
    accessToken: string;
    challengeUrl: string;
  };
  state: UserActionState;
  idempotencyKey: string;
  ruleIds: string[];
}

interface GetActionRawResponse {
  state: UserActionState;
}

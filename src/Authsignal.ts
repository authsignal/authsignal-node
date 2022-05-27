import axios from "axios";

import {
  AuthsignalConstructor,
  GetActionInput,
  GetActionOutput,
  MfaInput,
  MfaOutput,
  TrackInput,
  TrackOutput,
  UserActionState,
} from "./types";

const DEFAULT_SIGNAL_API_BASE_URL = "https://dev-signal.authsignal.com/v1";

export class Authsignal {
  secret: string;
  apiBaseUrl: string;

  constructor({secret, apiBaseUrl}: AuthsignalConstructor) {
    this.secret = secret;
    this.apiBaseUrl = apiBaseUrl ?? DEFAULT_SIGNAL_API_BASE_URL;
  }

  public async mfa(input: MfaInput): Promise<MfaOutput> {
    const {userId, redirectUrl} = input;

    const queryParams = redirectUrl ? `?redirectUrl=${redirectUrl}` : "";

    const url = `${this.apiBaseUrl}/users/${userId}${queryParams}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.get<MfaRawResponse>(url, config);

    return {
      mfaUrl: response.data.url,
      isEnrolled: response.data.isEnrolled,
    };
  }

  public async track(input: TrackInput): Promise<TrackOutput> {
    const {userId, action, idempotencyKey, redirectUrl, ipAddress, userAgent, deviceId, custom} = input;

    const url = `${this.apiBaseUrl}/action/track`;

    const data = {
      userId,
      actionCode: action,
      idempotencyKey,
      redirectUrl,
      ipAddress,
      userAgent,
      deviceId,
      custom,
    };

    const config = this.getBasicAuthConfig();

    const response = await axios.post<TrackRawResponse>(url, data, config);

    return {
      state: response.data.state,
      idempotencyKey: response.data.idempotencyKey,
      challengeUrl: response.data.challenge?.challengeUrl,
      ruleIds: response.data.ruleIds,
    };
  }

  public async getAction(input: GetActionInput): Promise<GetActionOutput> {
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

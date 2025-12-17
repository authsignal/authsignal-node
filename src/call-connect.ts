import axios from "axios";
import axiosRetry from "axios-retry";

import {mapToAuthsignalError} from "./error";
import {AuthsignalConstructor} from "./types";
import {VERSION} from "./config";
import {DEFAULT_RETRIES, isRetryableAuthsignalError} from "./retries";

const DEFAULT_API_URL = "https://us-connect.authsignal.com";

export class CallConnect {
  apiSecretKey: string;
  apiUrl: string;

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
  }

  public async startCall(request: StartCallRequest): Promise<StartCallResponse> {
    const url = `${this.apiUrl}/call/start`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.post<StartCallResponse>(url, request, config);

      return response.data;
    } catch (error) {
      throw mapToAuthsignalError(error);
    }
  }

  public async finishCall(request: FinishCallRequest): Promise<FinishCallResponse> {
    const url = `${this.apiUrl}/call/finish`;

    const config = this.getRequestConfig();

    try {
      const response = await axios.post<FinishCallResponse>(url, request, config);

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
      headers: {
        "X-Authsignal-Version": VERSION,
        "User-Agent": "authsignal-node",
      },
    };
  }
}

export type StartCallRequest = {
  referenceId: string;
  phoneNumber: string;
  userId?: string;
  username?: string;
  channel?: CallConnectMessageChannel;
  email?: string;
  locale?: string;
};

export type StartCallResponse = {
  messageId?: string;
  status?: string;
  error?: string;
  channel?: CallConnectMessageChannel;
};

export enum CallConnectMessageChannel {
  "WHATSAPP" = "WHATSAPP",
  "SMS" = "SMS",
}

export type FinishCallRequest = {
  referenceId: string;
  state: CallState;
  userId?: string;
  payload?: Record<string, unknown>;
};

export type FinishCallResponse = {
  success: boolean;
};

export enum CallState {
  "CHALLENGE_SUCCEEDED" = "CHALLENGE_SUCCEEDED",
  "CHALLENGE_FAILED" = "CHALLENGE_FAILED",
}

import {AxiosError} from "axios";
import {VERSION} from "../config";
import {AuthsignalError} from "../error";

export class AuthsignalFlowsClient {
  apiSecretKey: string;
  apiUrl: string;

  constructor(apiSecretKey: string, apiUrl: string) {
    this.apiSecretKey = apiSecretKey;
    this.apiUrl = apiUrl;
  }

  getRequestConfig(challengeToken: string) {
    return {
      headers: {
        "X-Authsignal-Version": VERSION,
        "User-Agent": "authsignal-node",
        "X-Authsignal-Challenge-Token": challengeToken,
      },
    };
  }

  mapToAuthsignalFlowsError(error: unknown) {
    if (error instanceof AxiosError) {
      const {response} = error;

      if (response?.data) {
        const {error: errorCode, errorDescription} = response.data;

        switch (errorCode) {
          case "invalid_code":
            return new InvalidCodeError(response.status, errorCode, errorDescription, error);

          default:
            return new AuthsignalError(response.status, errorCode, errorDescription, error);
        }
      }
    }

    if (error instanceof Error) {
      return new AuthsignalError(500, "unexpected_error", error.message);
    }

    return new AuthsignalError(500, "unexpected_error");
  }
}

export class InvalidCodeError extends AuthsignalError {
  constructor(statusCode: number, errorCode: string, errorDescription?: string, axiosError?: AxiosError) {
    super(statusCode, errorCode, errorDescription, axiosError);

    this.name = "InvalidCodeError";
  }
}

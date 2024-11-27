import {AxiosError} from "axios";

export class AuthsignalError extends Error {
  statusCode: number;
  errorCode: string;
  errorDescription?: string;
  axiosError?: AxiosError;

  constructor(statusCode: number, errorCode: string, errorDescription?: string, axiosError?: AxiosError) {
    const message = formatMessage(statusCode, errorCode, errorDescription);

    super(message);

    this.name = "AuthsignalError";

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription;
    this.axiosError = axiosError;
  }
}

export function mapToAuthsignalError(error: unknown): AuthsignalError {
  if (error instanceof AxiosError) {
    const {response} = error;

    if (response?.data) {
      const {error: errorCode, errorDescription} = response.data;

      return new AuthsignalError(response.status, errorCode, errorDescription, error);
    }
  }

  if (error instanceof Error) {
    return new AuthsignalError(500, "unexpected_error", error.message);
  }

  return new AuthsignalError(500, "unexpected_error");
}

function formatMessage(statusCode: number, errorCode: string, errorDescription?: string) {
  return `AuthsignalError: ${statusCode} - ${formatDescription(errorCode, errorDescription)}`;
}

function formatDescription(errorCode: string, errorDescription?: string) {
  return errorDescription && errorDescription.length > 0 ? errorDescription : errorCode;
}

import {AxiosError} from "axios";

export const DEFAULT_RETRIES = 2;

const RETRY_ERROR_CODES = ["ECONNRESET", "EPIPE", "ECONNREFUSED"];
const SAFE_HTTP_METHODS = ["GET", "HEAD", "OPTIONS"];

export function isRetryableAuthsignalError(error: AxiosError): boolean {
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

import {AxiosError} from "axios";

export const DEFAULT_RETRIES = 2;
export const DEFAULT_TIMEOUT = 10_000;

const SAFE_HTTP_METHODS = ["GET", "HEAD", "OPTIONS"];

export function isRetryableAuthsignalError(error: AxiosError): boolean {
  const method = error.config?.method?.toUpperCase();
  const idempotencyKey = error.config?.headers?.get("Idempotency-Key");
  const canReplay = Boolean(method && SAFE_HTTP_METHODS.includes(method)) || Boolean(idempotencyKey);

  if (!canReplay) return false;

  // A missing response means the request failed at the transport layer.
  if (!error.response) return true;

  const {status} = error.response;

  return status === 429 || (status >= 500 && status <= 599);
}

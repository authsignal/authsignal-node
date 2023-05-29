import {Authsignal, DEFAULT_SIGNAL_API_BASE_URL} from "../authsignal";
import {UserActionState} from "../types";

const DEFAULT_ACTION_NAME = "auth0-login";

export interface ExecutePostLoginOptions {
  secret?: string;
  userId?: string;
  action?: string;
  redirectUrl?: string;
  custom?: object;
  apiBaseUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleAuth0ExecutePostLogin(event: any, api: any, options: ExecutePostLoginOptions) {
  // Redirects are not possible for refresh token exchange
  // https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/redirect-with-actions#refresh-tokens
  if (event.transaction?.protocol === "oauth2-refresh-token") {
    return;
  }

  const {
    secret = event.secrets.AUTHSIGNAL_SECRET,
    userId = event.user.user_id,
    action = DEFAULT_ACTION_NAME,
    redirectUrl = `https://${event.request.hostname}/continue`,
    custom = {},
    apiBaseUrl = DEFAULT_SIGNAL_API_BASE_URL,
  } = options ?? {};

  const sessionMfaMethod = event.authentication?.methods.find(({name}: {name: string}) => name === apiBaseUrl);

  // If user has already completed MFA for the current Auth0 session, don't prompt again
  if (sessionMfaMethod) {
    return;
  }

  const authsignal = new Authsignal({secret, apiBaseUrl});

  const result = await authsignal.track({
    action,
    userId,
    redirectUrl,
    custom,
    email: event.user.email,
    ipAddress: event.request.ip,
    userAgent: event.request.user_agent,
  });

  const {isEnrolled, state, url} = result;

  if (!isEnrolled || state === UserActionState.CHALLENGE_REQUIRED) {
    api.redirect.sendUserTo(url);
  } else if (state === UserActionState.BLOCK) {
    api.access.deny("Action blocked");
  }
}

export interface ContinuePostLoginOptions {
  secret?: string;
  userId?: string;
  action?: string;
  failureMessage?: string;
  apiBaseUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleAuth0ContinuePostLogin(event: any, api: any, options: ContinuePostLoginOptions) {
  const {
    secret = event.secrets.AUTHSIGNAL_SECRET,
    userId = event.user.user_id,
    action = DEFAULT_ACTION_NAME,
    failureMessage = "MFA challenge failed",
    apiBaseUrl = DEFAULT_SIGNAL_API_BASE_URL,
  } = options ?? {};

  const payload = api.redirect.validateToken({secret, tokenParameterName: "token"});

  const authsignal = new Authsignal({secret, apiBaseUrl});

  const actionResult = await authsignal.getAction({
    action,
    userId,
    idempotencyKey: payload.other.idempotencyKey,
  });

  if (actionResult && actionResult.state !== UserActionState.CHALLENGE_SUCCEEDED) {
    api.access.deny(failureMessage);
  } else {
    api.authentication.recordMethod(apiBaseUrl);
  }
}

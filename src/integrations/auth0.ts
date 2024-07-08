import {Authsignal, DEFAULT_API_BASE_URL} from "../authsignal";
import {UserActionState} from "../types";

const DEFAULT_ACTION_NAME = "auth0-login";

export interface ExecutePostLoginOptions {
  secret?: string;
  userId?: string;
  action?: string;
  redirectUrl?: string;
  custom?: object;
  apiBaseUrl?: string;
  forceEnrollment?: boolean;
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
    apiBaseUrl = DEFAULT_API_BASE_URL,
    forceEnrollment = false,
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
    deviceId: event.request.query?.["device_id"],
  });

  const {isEnrolled, state, url} = result;

  const challengeUrl = forceEnrollment ? `${url}&force_enrollment=true` : url;

  if (!isEnrolled || state === UserActionState.CHALLENGE_REQUIRED) {
    api.redirect.sendUserTo(challengeUrl);
  } else if (state === UserActionState.BLOCK) {
    api.access.deny("Action blocked");
  }
}

export interface ContinuePostLoginOptions {
  tenantId?: string;
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
    apiBaseUrl = DEFAULT_API_BASE_URL,
  } = options ?? {};

  const authsignal = new Authsignal({secret, apiBaseUrl});

  const result = await authsignal.validateChallenge({
    token: event.request.query?.["token"],
    userId,
  });

  if (result.action !== action || result.state !== UserActionState.CHALLENGE_SUCCEEDED) {
    api.access.deny(failureMessage);
  } else {
    api.authentication.recordMethod(apiBaseUrl);
  }
}

import {AuthsignalServer} from "../authsignal-server";
import {UserActionState} from "../types";

const DEFAULT_ACTION_NAME = "auth0-login";

export interface ExecutePostLoginOptions {
  secret?: string;
  userId?: string;
  action?: string;
  redirectUrl?: string;
  custom?: object;
}

export async function handleAuth0ExecutePostLogin(event: any, api: any, options: ExecutePostLoginOptions) {
  const {
    secret = event.secrets.AUTHSIGNAL_SECRET,
    userId = event.user.user_id,
    action = DEFAULT_ACTION_NAME,
    redirectUrl = `https://${event.request.hostname}/continue`,
    custom = {challenge: true},
  } = options;

  const authsignalServer = new AuthsignalServer({secret});

  const mfaResult = await authsignalServer.mfa({userId, redirectUrl});

  if (!mfaResult.isEnrolled) {
    api.redirect.sendUserTo(mfaResult.url);
  } else {
    const trackResult = await authsignalServer.track({
      action,
      userId,
      redirectUrl,
      custom,
      email: event.user.email,
      ipAddress: event.request.ip,
      userAgent: event.request.user_agent,
    });

    if (trackResult.state === UserActionState.CHALLENGE_INITIATED && trackResult.challengeUrl) {
      api.redirect.sendUserTo(trackResult.challengeUrl);
    }
  }
}

export interface ContinuePostLoginOptions {
  secret?: string;
  userId?: string;
  action?: string;
  failureMessage?: string;
}

export async function handleAuth0ContinuePostLogin(event: any, api: any, options: ContinuePostLoginOptions) {
  const {
    secret = event.secrets.AUTHSIGNAL_SECRET,
    userId = event.user.user_id,
    action = DEFAULT_ACTION_NAME,
    failureMessage = "MFA challenge failed",
  } = options;

  const payload = api.redirect.validateToken({secret, tokenParameterName: "token"});

  const authsignalServer = new AuthsignalServer({secret});

  const getActionResult = await authsignalServer.getAction({
    action,
    userId,
    idempotencyKey: payload.other.idempotencyKey,
  });

  if (getActionResult.state !== UserActionState.CHALLENGE_SUCCEEDED) {
    api.access.deny(failureMessage);
  }
}

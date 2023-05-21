import axios from "axios";
import jwt from "jsonwebtoken";

import {
  AuthsignalConstructor,
  EnrollVerifiedAuthenticatorRequest,
  EnrollVerifiedAuthenticatorResponse,
  GetActionRequest,
  GetActionResponse,
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  RedirectTokenPayload,
  TokenRequest,
  TokenResponse,
  TrackRequest,
  TrackResponse,
  UserActionState,
  UserRequest,
  UserResponse,
  ValidateChallengeRequest,
  ValidateChallengeResponse,
} from "./types";

const DEFAULT_SIGNAL_API_BASE_URL = "https://signal.authsignal.com/v1";

export class Authsignal {
  secret: string;
  apiBaseUrl: string;
  redirectUrl?: string;

  constructor({secret, apiBaseUrl, redirectUrl}: AuthsignalConstructor) {
    this.secret = secret;
    this.apiBaseUrl = apiBaseUrl ?? DEFAULT_SIGNAL_API_BASE_URL;
    this.redirectUrl = redirectUrl;
  }

  public async getUser(request: UserRequest): Promise<UserResponse> {
    const {userId} = request;

    const url = `${this.apiBaseUrl}/users/${userId}`;

    const config = this.getBasicAuthConfig();

    const response = await axios.get<UserResponse>(url, config);

    return response.data;
  }

  public async track(request: TrackRequest): Promise<TrackResponse> {
    const {userId, action, redirectUrl = this.redirectUrl, ...rest} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}`;

    const data = {redirectUrl, ...rest};

    const config = this.getBasicAuthConfig();

    const response = await axios.post<TrackResponse>(url, data, config);

    return response.data;
  }

  public async getAction(request: GetActionRequest): Promise<GetActionResponse | undefined> {
    const {userId, action, idempotencyKey} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.get<GetActionResponse>(url, config);

      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return undefined;
      } else {
        throw err;
      }
    }
  }

  public async enrollVerifiedAuthenticator(
    request: EnrollVerifiedAuthenticatorRequest
  ): Promise<EnrollVerifiedAuthenticatorResponse> {
    const {userId, ...data} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/authenticators`;

    const config = this.getBasicAuthConfig();

    const response = await axios.post<EnrollVerifiedAuthenticatorResponse>(url, data, config);

    return response.data;
  }

  public async loginWithEmail(request: LoginWithEmailRequest): Promise<LoginWithEmailResponse> {
    const {email, redirectUrl} = request;

    const url = `${this.apiBaseUrl}/users/email/${email}/challenge`;

    const data = {email, redirectUrl};

    const config = this.getBasicAuthConfig();

    const response = await axios.post<LoginWithEmailResponse>(url, data, config);

    return response.data;
  }

  public async validateChallenge(request: ValidateChallengeRequest): Promise<ValidateChallengeResponse> {
    const {token} = request;

    jwt.verify(token, this.secret);

    const decodedToken = <RedirectTokenPayload>jwt.decode(token);

    const {userId, actionCode: action, idempotencyKey} = decodedToken.other;

    if (action && idempotencyKey) {
      const actionResult = await this.getAction({userId, action, idempotencyKey});

      if (actionResult) {
        const {state} = actionResult;
        const success = state === UserActionState.CHALLENGE_SUCCEEDED;

        return {userId, success, state};
      }
    }

    return {userId, success: false, state: undefined};
  }

  public async token(request: TokenRequest): Promise<TokenResponse> {
    const url = `${this.apiBaseUrl}/token`;

    const config = this.getBasicAuthConfig();

    const response = await axios.post<TokenResponse>(url, request, config);

    return response.data;
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

import axios from "axios";

import {
  ActionRequest,
  ActionResponse,
  AuthsignalConstructor,
  ChallengeRequest,
  ChallengeResponse,
  DeleteAuthenticatorRequest,
  EnrollVerifiedAuthenticatorRequest,
  EnrollVerifiedAuthenticatorResponse,
  TrackRequest,
  TrackResponse,
  UpdateActionStateRequest,
  UpdateUserRequest,
  UserAuthenticator,
  UserRequest,
  UserResponse,
  ValidateChallengeRequest,
  ValidateChallengeResponse,
} from "./types";
import {mapToAuthsignalError} from "./error";

export const DEFAULT_API_BASE_URL = "https://api.authsignal.com/v1";

export class Authsignal {
  secret: string;
  apiBaseUrl: string;
  redirectUrl?: string;

  constructor({secret, apiBaseUrl, redirectUrl}: AuthsignalConstructor) {
    this.secret = secret;
    this.apiBaseUrl = apiBaseUrl ?? DEFAULT_API_BASE_URL;
    this.redirectUrl = redirectUrl;
  }

  public async getUser(request: UserRequest): Promise<UserResponse> {
    const {userId} = request;

    const url = `${this.apiBaseUrl}/users/${userId}`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.get<UserResponse>(url, config);

      return response.data;
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    const {userId, ...data} = request;

    const url = `${this.apiBaseUrl}/users/${userId}`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.post<UserResponse>(url, data, config);

      return response.data;
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async deleteUser(request: UserRequest): Promise<void> {
    const {userId} = request;

    const url = `${this.apiBaseUrl}/users/${userId}`;

    const config = this.getBasicAuthConfig();

    try {
      await axios.delete(url, config);
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async getAuthenticators(request: UserRequest): Promise<UserAuthenticator[]> {
    const {userId} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/authenticators`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.get<UserAuthenticator[]>(url, config);

      return response.data;
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async enrollVerifiedAuthenticator(
    request: EnrollVerifiedAuthenticatorRequest
  ): Promise<EnrollVerifiedAuthenticatorResponse> {
    const {userId, ...data} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/authenticators`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.post<EnrollVerifiedAuthenticatorResponse>(url, data, config);

      return response.data;
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async deleteAuthenticator(request: DeleteAuthenticatorRequest): Promise<void> {
    const {userId, userAuthenticatorId} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/authenticators/${userAuthenticatorId}`;

    const config = this.getBasicAuthConfig();

    try {
      await axios.delete(url, config);
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async track(request: TrackRequest): Promise<TrackResponse> {
    const {userId, action, redirectUrl = this.redirectUrl, ...rest} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}`;

    const data = {redirectUrl, ...rest};

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.post<TrackResponse>(url, data, config);

      return response.data;
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async validateChallenge(request: ValidateChallengeRequest): Promise<ValidateChallengeResponse> {
    const url = `${this.apiBaseUrl}/validate`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.post<ValidateChallengeRawResponse>(url, request, config);

      const {actionCode: action, ...rest} = response.data;

      return {action, ...rest};
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async getAction(request: ActionRequest): Promise<ActionResponse | undefined> {
    const {userId, action, idempotencyKey} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.get<ActionResponse>(url, config);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      } else {
        throw await mapToAuthsignalError(error);
      }
    }
  }

  public async updateActionState(request: UpdateActionStateRequest): Promise<ActionResponse> {
    const {userId, action, idempotencyKey, state} = request;

    const url = `${this.apiBaseUrl}/users/${userId}/actions/${action}/${idempotencyKey}`;

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.patch<ActionResponse>(url, {state}, config);

      return response.data;
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
  }

  public async getChallenge(request: ChallengeRequest): Promise<ChallengeResponse> {
    const {userId, action, verificationMethod} = request;

    const url = new URL(`${this.apiBaseUrl}/users/${userId}/challenge`);

    if (action) {
      url.searchParams.set("action", action);
    }

    if (verificationMethod) {
      url.searchParams.set("verificationMethod", verificationMethod);
    }

    const config = this.getBasicAuthConfig();

    try {
      const response = await axios.get<ChallengeResponse>(url.toString(), config);

      return response.data;
    } catch (error) {
      throw await mapToAuthsignalError(error);
    }
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

type ValidateChallengeRawResponse = Omit<ValidateChallengeResponse, "action"> & {
  actionCode?: string;
};

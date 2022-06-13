export interface AuthsignalServerConstructor {
  secret: string;
  apiBaseUrl?: string;
}

export interface MfaRequest {
  userId: string;
  redirectUrl?: string;
}

export interface MfaResponse {
  isEnrolled: boolean;
  url: string;
}

export interface TrackRequest {
  userId: string;
  action: string;
  email?: string;
  idempotencyKey?: string;
  redirectUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  custom?: object;
}

export interface TrackResponse {
  state: UserActionState;
  idempotencyKey: string;
  ruleIds: string[];
  challengeUrl?: string;
}

export interface GetActionRequest {
  userId: string;
  action: string;
  idempotencyKey: string;
}

export interface GetActionResponse {
  state: UserActionState;
}

export enum UserActionState {
  ALLOW = "ALLOW",
  BLOCK = "BLOCK",
  CHALLENGE_INITIATED = "CHALLENGE_INITIATED",
  CHALLENGE_SUCCEEDED = "CHALLENGE_SUCCEEDED",
  CHALLENGE_FAILED = "CHALLENGE_FAILED",
}

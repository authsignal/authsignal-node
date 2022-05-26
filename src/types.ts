export interface AuthsignalConstructor {
  secret: string;
  apiBaseUrl?: string;
}

export interface MfaInput {
  userId: string;
  redirectUrl?: string;
}

export interface MfaOutput {
  isEnrolled: boolean;
  mfaUrl: string;
}

export interface TrackInput {
  userId: string;
  action: string;
  idempotencyKey?: string;
  redirectUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  custom?: object;
}

export interface TrackOutput {
  state: UserActionState;
  idempotencyKey: string;
  ruleIds: string[];
  challengeUrl?: string;
}

export enum UserActionState {
  ALLOW = "ALLOW",
  BLOCK = "BLOCK",
  CHALLENGE_INITIATED = "CHALLENGE_INITIATED",
  CHALLENGE_SUCCEEDED = "CHALLENGE_SUCCEEDED",
  CHALLENGE_FAILED = "CHALLENGE_FAILED",
}

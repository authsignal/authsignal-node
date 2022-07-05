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

export interface EnrollVerifiedAuthenticatorRequest {
  userId: string;
  oobChannel: string;
  phoneNumber?: string;
  email?: string;
}

export interface EnrollVerifiedAuthenticatorResponse {
  authenticator: UserAuthenticator;
  recoveryCodes?: string[];
}

export enum UserActionState {
  ALLOW = "ALLOW",
  BLOCK = "BLOCK",
  CHALLENGE_REQUIRED = "CHALLENGE_REQUIRED",
  CHALLENGE_SUCCEEDED = "CHALLENGE_SUCCEEDED",
  CHALLENGE_FAILED = "CHALLENGE_FAILED",
}

export interface UserAuthenticator {
  userId: string;
  userAuthenticatorId: string;
  authenticatorType: AuthenticatorType;
  createdAt: string;
  isDefault: boolean;
  verifiedAt?: string;
  isActive?: boolean;
  oobChannel?: OobChannel;
  otpBinding?: OtpBinding;
  phoneNumber?: string;
  email?: string;
}

export enum AuthenticatorType {
  OOB = "OOB",
  OTP = "OTP",
}

export interface OtpBinding {
  secret: string;
  uri: string;
}

export enum OobChannel {
  SMS = "SMS",
  EMAIL_MAGIC_LINK = "EMAIL_MAGIC_LINK",
}

export interface RedirectTokenPayload {
  other: {
    tenantId: string;
    publishableKey: string;
    userId: string;
    actionCode?: string;
    idempotencyKey: string;
  };
}

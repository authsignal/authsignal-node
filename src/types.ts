export interface AuthsignalConstructor {
  secret: string;
  apiBaseUrl?: string;
  redirectUrl?: string;
}

export interface UserRequest {
  userId: string;
}

export interface UserResponse {
  isEnrolled: boolean;
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
  redirectToSettings?: boolean;
}

export interface TrackResponse {
  state: UserActionState;
  idempotencyKey: string;
  ruleIds: string[];
  url: string;
  isEnrolled: boolean;
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

export interface LoginWithEmailRequest {
  email: string;
  redirectUrl?: string;
}

export interface LoginWithEmailResponse {
  url: string;
}

export interface ValidateChallengeRequest {
  token: string;
}

export interface ValidateChallengeResponse {
  success: boolean;
  user: {
    userId: string;
    email?: string;
    phoneNumber?: string;
  };
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
    email?: string;
    phoneNumber?: string;
    actionCode?: string;
    idempotencyKey?: string;
  };
}

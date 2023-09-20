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
  email?: string;
  phoneNumber?: string;
  enrolledVerificationMethods?: VerificationMethod[];
  allowedVerificationMethods?: VerificationMethod[];
}

export interface TrackRequest {
  userId: string;
  action: string;
  idempotencyKey?: string;
  redirectUrl?: string;
  redirectToSettings?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  scope?: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  custom?: object;
}

export interface TrackResponse {
  state: UserActionState;
  idempotencyKey: string;
  url: string;
  token: string;
  isEnrolled: boolean;
  enrolledVerificationMethods?: VerificationMethod[];
  allowedVerificationMethods?: VerificationMethod[];
}

export interface GetActionRequest {
  userId: string;
  action: string;
  idempotencyKey: string;
}

export interface GetActionResponse {
  state: UserActionState;
  verificationMethod?: VerificationMethod;
}

export interface EnrollVerifiedAuthenticatorRequest {
  userId: string;
  oobChannel: string;
  phoneNumber?: string;
  email?: string;
  isDefault?: boolean;
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
  userId?: string;
}

export interface ValidateChallengeResponse {
  userId: string;
  success: boolean;
  state?: UserActionState;
  action?: string;
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

export enum VerificationMethod {
  SMS = "SMS",
  AUTHENTICATOR_APP = "AUTHENTICATOR_APP",
  RECOVERY_CODE = "RECOVERY_CODE",
  EMAIL_MAGIC_LINK = "EMAIL_MAGIC_LINK",
  PUSH = "PUSH",
  SECURITY_KEY = "SECURITY_KEY",
  VERIFF = "VERIFF",
  IPROOV = "IPROOV",
}

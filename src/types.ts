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
  username?: string;
  displayName?: string;
  enrolledVerificationMethods?: VerificationMethod[];
  allowedVerificationMethods?: VerificationMethod[];
  custom?: CustomData;
}

export interface UpdateUserRequest {
  userId: string;
  email?: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  displayName?: string | null;
  custom?: CustomData;
}

export interface ChallengeRequest {
  userId: string;
  action?: string;
  verificationMethod?: VerificationMethod;
}

export interface ChallengeResponse {
  challengeId?: string;
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
  custom?: CustomData;
  challengeId?: string;
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

export interface ActionRequest {
  userId: string;
  action: string;
  idempotencyKey: string;
}

export interface ActionResponse {
  state: UserActionState;
  verificationMethod?: VerificationMethod;
}

export interface EnrollVerifiedAuthenticatorRequest {
  userId: string;
  verificationMethod: VerificationMethod;
  phoneNumber?: string;
  email?: string;
  isDefault?: boolean;
}

export interface EnrollVerifiedAuthenticatorResponse {
  authenticator: UserAuthenticator;
  recoveryCodes?: string[];
}

export interface ValidateChallengeRequest {
  token: string;
  action?: string;
  userId?: string;
}

export interface ValidateChallengeResponse {
  isValid: boolean;
  state?: UserActionState;
  stateUpdatedAt?: string;
  userId?: string;
  action?: string;
  idempotencyKey?: string;
  verificationMethod?: VerificationMethod;
  error?: string;
}

export interface DeleteAuthenticatorRequest {
  userId: string;
  userAuthenticatorId: string;
}

export enum UserActionState {
  ALLOW = "ALLOW",
  BLOCK = "BLOCK",
  CHALLENGE_REQUIRED = "CHALLENGE_REQUIRED",
  CHALLENGE_SUCCEEDED = "CHALLENGE_SUCCEEDED",
  CHALLENGE_FAILED = "CHALLENGE_FAILED",
  REVIEW_REQUIRED = "REVIEW_REQUIRED",
  REVIEW_SUCCEEDED = "REVIEW_SUCCEEDED",
  REVIEW_FAILED = "REVIEW_FAILED",
}

export interface UserAuthenticator {
  userId: string;
  userAuthenticatorId: string;
  verificationMethod: VerificationMethod;
  createdAt: string;
  verifiedAt?: string;
  phoneNumber?: string;
  email?: string;
}

export enum VerificationMethod {
  SMS = "SMS",
  EMAIL_OTP = "EMAIL_OTP",
  EMAIL_MAGIC_LINK = "EMAIL_MAGIC_LINK",
  AUTHENTICATOR_APP = "AUTHENTICATOR_APP",
  PASSKEY = "PASSKEY",
  SECURITY_KEY = "SECURITY_KEY",
  PUSH = "PUSH",
  VERIFF = "VERIFF",
  IPROOV = "IPROOV",
  RECOVERY_CODE = "RECOVERY_CODE",
}

type CustomData = {[key: string]: string};

export interface UpdateActionStateRequest {
  userId: string;
  action: string;
  idempotencyKey: string;
  state: UserActionState;
}

export interface AuthsignalConstructor {
  apiSecretKey: string;
  apiUrl?: string;
  retries?: number;
}

export interface GetUserRequest {
  userId: string;
}

export interface GetUserResponse {
  isEnrolled: boolean;
  email?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneNumberVerified: boolean;
  username?: string;
  displayName?: string;
  custom?: CustomData;
  enrolledVerificationMethods?: VerificationMethod[];
  allowedVerificationMethods?: VerificationMethod[];
}

export interface QueryUsersRequest {
  username?: string;
  email?: string;
  phoneNumber?: string;
  token?: string;
  limit?: number;
  lastEvaluatedUserId?: string;
}

export interface QueryUsersResponse {
  users: {
    userId: string;
    email?: string;
    emailVerified: boolean;
    phoneNumber?: string;
    phoneNumberVerified: boolean;
    username?: string;
  }[];
  lastEvaluatedUserId?: string;
  tokenPayload?: TokenPayload;
}

export interface UpdateUserRequest {
  userId: string;
  attributes: UserAttributes;
}

export interface UserAttributes {
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  username?: string;
  displayName?: string;
  custom?: CustomData;
}

export interface DeleteUserRequest {
  userId: string;
}

export interface TrackRequest {
  userId: string;
  action: string;
  attributes?: TrackAttributes;
}

export interface TrackAttributes {
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
  idempotencyKey: string;
  state: UserActionState;
  url: string;
  token: string;
  isEnrolled: boolean;
  enrolledVerificationMethods?: VerificationMethod[];
  allowedVerificationMethods?: VerificationMethod[];
  defaultVerificationMethod?: VerificationMethod;
}

export interface GetActionRequest {
  userId: string;
  action: string;
  idempotencyKey: string;
}

export interface GetActionResponse {
  state: UserActionState;
  stateUpdatedAt: string;
  createdAt: string;
  verificationMethod?: VerificationMethod;
  rules?: Rule[];
  output?: ActionOutput;
}

export interface QueryUserActionsRequest {
  userId: string;
  fromDate?: string;
  actionCodes?: string[];
  state?: UserActionState;
}

export type QueryUserActionsResponse = {
  actionCode: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt?: string;
  state: string;
  stateUpdatedAt?: string;
  verificationMethod?: VerificationMethod;
  verifiedByAuthenticatorId?: string;
}[];

export interface GetAuthenticatorsRequest {
  userId: string;
}

export interface EnrollVerifiedAuthenticatorRequest {
  userId: string;
  attributes: EnrollVerifiedAuthenticatorAttributes;
}

export interface EnrollVerifiedAuthenticatorAttributes {
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

export interface ClaimChallengeRequest {
  challengeId: string;
  userId: string;
}

export interface ClaimChallengeResponse {
  token: string;
  verificationMethod: VerificationMethod;
}

export interface DeleteAuthenticatorRequest {
  userId: string;
  userAuthenticatorId: string;
}

export interface UpdateActionRequest {
  userId: string;
  action: string;
  idempotencyKey: string;
  attributes: ActionAttributes;
}

export interface ActionAttributes {
  state: UserActionState;
}

export interface GetChallengeRequest {
  challengeId?: string;
  userId?: string;
  action?: string;
  verificationMethod?: VerificationMethod;
}

export interface GetChallengeResponse {
  challengeId?: string;
  expiresAt?: number;
  verificationMethod?: VerificationMethod;
  smsChannel?: SmsChannel;
  phoneNumber?: string;
  email?: string;
  action?: string;
}

export interface ChallengeRequest {
  verificationMethod: "SMS" | "EMAIL_OTP";
  action: string;
  email?: string;
  phoneNumber?: string;
  smsChannel?: SmsChannel;
}

export interface ChallengeResponse {
  challengeId: string;
}

export interface VerifyRequest {
  challengeId: string;
  verificationCode: string;
}

export interface VerifyResponse {
  isVerified: boolean;
  email?: string;
  phoneNumber?: string;
  verificationMethod?: "SMS" | "EMAIL_OTP";
}

export interface CreateSessionRequest {
  clientId: string;
  token: string;
}

export interface CreateSessionResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ValidateSessionRequest {
  accessToken: string;
}

export interface ValidateSessionResponse {
  user: {userId: string} & UserAttributes;
  expiresAt: number;
}

export interface RefreshSessionRequest {
  refreshToken: string;
}

export interface RefreshSessionResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RevokeSessionRequest {
  accessToken: string;
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
  lastVerifiedAt?: string;
  phoneNumber?: string;
  email?: string;
  username?: string;
  displayName?: string;
  webauthnCredential?: WebauthnCredential;
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
  IDVERSE = "IDVERSE",
  PALM_BIOMETRICS_RR = "PALM_BIOMETRICS_RR",
  RECOVERY_CODE = "RECOVERY_CODE",
}

export interface WebauthnCredential {
  credentialId: string;
  deviceId: string;
  name: string;
  aaguid?: string;
  aaguidMapping?: AaguidMapping;
  credentialBackedUp?: boolean;
  credentialDeviceType?: string;
  authenticatorAttachment?: string;
  parsedUserAgent?: UserAgent;
}

export interface AaguidMapping {
  name: string;
  svgIconLight: string;
  svgIconDark: string;
}

type CustomData = {[key: string]: string};

export interface UserAgent {
  ua: string;
  browser?: UserAgentBrowser;
  device?: UserAgentDevice;
  engine?: UserAgentEngine;
  os?: UserAgentOs;
  cpu?: UserAgentCpu;
}

export interface UserAgentBrowser {
  name: string;
  version: string;
  major: string;
}

export interface UserAgentDevice {
  model: string;
  type: string;
  vendor: string;
}

export interface UserAgentEngine {
  name: string;
  version: string;
}

export interface UserAgentOs {
  name: string;
  version: string;
}

export interface UserAgentCpu {
  architecture: string;
}

export interface Rule {
  ruleId: string;
  name: string;
  description?: string;
}

export enum SmsChannel {
  WHATSAPP = "WHATSAPP",
  DEFAULT = "DEFAULT",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionOutput = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TokenPayload = any;

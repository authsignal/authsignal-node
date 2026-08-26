import type {CustomData, VerificationMethod} from "../index";

export interface StartFlowRequest {
  actionCode: string;
  user: UserLookup;
  attributes?: ChallengeAttributes;
  redirectUrl?: string;
}

export interface StartFlowResponse {
  action: FlowAction;
  challengeToken: string;
  challengeUrl: string;
  user?: FlowUser;
}

export interface VerifyFlowRequest {
  actionCode: string;
  challengeToken: string;
}

export interface VerifyFlowResponse {
  action: FlowAction;
  session?: AuthenticationSession;
  user?: FlowUser;
}

export type UserLookup = {userId: string} | {email: string} | {phoneNumber: string} | {username: string};

export type FlowAction = {
  state: FlowState;
  completedSteps: CompletedActionStep[];
  nextStep?: ActionStep;
};

export type ActionStep = {
  stepType: ActionStepType;
  verificationMethods: VerificationMethod[];
};

export type CompletedActionStep = {
  stepType: ActionStepType;
  verificationMethod: VerificationMethod;
  userAuthenticatorId: string;
};

export enum ActionStepType {
  VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED",
  ENROLLMENT_REQUIRED = "ENROLLMENT_REQUIRED",
  ENROLLMENT_OPTIONAL = "ENROLLMENT_OPTIONAL",
}

export type ChallengeAttributes = {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  custom?: CustomData;
  locale?: string;
};

export type FlowUser = {
  userId: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  displayName?: string;
  authenticators: FlowUserAuthenticator[];
};

export type FlowUserAuthenticator = {
  userAuthenticatorId: string;
  verificationMethod: VerificationMethod;
  email?: string;
  phoneNumber?: string;
  username?: string;
  displayName: string;
};

export type AuthenticationSession = {
  accessToken: string;
  refreshToken: string;
};

export enum FlowState {
  CHALLENGE_REQUIRED = "CHALLENGE_REQUIRED",
  CHALLENGE_SUCCEEDED = "CHALLENGE_SUCCEEDED",
  CHALLENGE_FAILED = "CHALLENGE_FAILED",
}

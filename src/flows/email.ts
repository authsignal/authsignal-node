import axios from "axios";
import {EmailChallengeRequest, OtpChallengeResponse, OtpVerifyRequest, OtpVerifyResponse} from "../types";
import {AuthsignalFlowsClient} from "./client";

export class AuthsignalFlowsEmail extends AuthsignalFlowsClient {
  async challenge(request: EmailChallengeRequest): Promise<OtpChallengeResponse> {
    const {challengeToken, email} = request;

    const url = `${this.apiUrl}/client/flows/challenge/email-otp`;

    const body = {email};

    const config = this.getRequestConfig(challengeToken);

    try {
      const response = await axios.post<OtpChallengeResponse>(url, body, config);

      return response.data;
    } catch (error) {
      throw this.mapToAuthsignalFlowsError(error);
    }
  }

  /**
   * @throws {InvalidCodeError} if `verificationCode` doesn't match.
   */
  async verify(request: OtpVerifyRequest): Promise<OtpVerifyResponse> {
    const {challengeToken, verificationCode} = request;

    const url = `${this.apiUrl}/client/flows/verify/email-otp`;

    const body = {verificationCode};

    const config = this.getRequestConfig(challengeToken);

    try {
      const response = await axios.post<OtpVerifyResponse>(url, body, config);

      return response.data;
    } catch (error) {
      throw this.mapToAuthsignalFlowsError(error);
    }
  }
}

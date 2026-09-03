import axios from "axios";
import {WhatsappChallengeRequest, OtpChallengeResponse, OtpVerifyRequest, OtpVerifyResponse} from "../types";
import {AuthsignalFlowsClient} from "./client";

export class AuthsignalFlowsWhatsapp extends AuthsignalFlowsClient {
  async challenge(request: WhatsappChallengeRequest): Promise<OtpChallengeResponse> {
    const {challengeToken, phoneNumber} = request;

    const url = `${this.apiUrl}/client/flows/challenge/whatsapp`;

    const body = {phoneNumber};

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

    const url = `${this.apiUrl}/client/flows/verify/whatsapp`;

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

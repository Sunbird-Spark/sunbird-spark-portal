import { getClient, ApiResponse } from '../lib/http-client';

export class LearnerService {
  public async fuzzyUserSearch(
    request: any,
    captchaResponse?: string
  ): Promise<ApiResponse<any>> {
    const query = captchaResponse ? `?captchaResponse=${encodeURIComponent(captchaResponse)}` : '';
    return getClient().post(
      `/user/v1/fuzzy/search${query}`,
      request
    );
  }

  public async generateOtp(
    request: any,
    captchaResponse?: string
  ): Promise<ApiResponse<any>> {
    const query = captchaResponse ? `?captchaResponse=${encodeURIComponent(captchaResponse)}` : '';
    return getClient().post(
      `/anonymous/otp/v1/generate${query}`,
      request
    );
  }

  public async verifyOtp(
    request: any
  ): Promise<ApiResponse<any>> {
    return getClient().post(
      `/otp/v1/verify`,
      request
    );
  }

  public async resetPassword(
    request: any
  ): Promise<ApiResponse<any>> {
    return getClient().post(
      `/user/v1/password/reset`,
      request
    );
  }
}
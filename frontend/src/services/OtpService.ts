import { getClient, ApiResponse } from '../lib/http-client';

export class OtpService {
    public async generateOtp(
        request: any,
        captchaResponse?: string
    ): Promise<ApiResponse<any>> {
        const query = captchaResponse ? `?captchaResponse=${encodeURIComponent(captchaResponse)}` : '';
        return getClient().post(
            `/otp/v1/generate${query}`,
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
}
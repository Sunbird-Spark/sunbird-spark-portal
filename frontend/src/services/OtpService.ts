import { getClient, ApiResponse } from '../lib/http-client';

export class OtpService {
    public async generateOtp(
        request: Record<string, unknown>,
        captchaResponse?: string
    ): Promise<ApiResponse<unknown>> {
        const query = captchaResponse ? `?captchaResponse=${encodeURIComponent(captchaResponse)}` : '';
        return getClient().post(
            `/otp/v1/generate${query}`,
            request
        );
    }

    public async verifyOtp(
        request: Record<string, unknown>
    ): Promise<ApiResponse<unknown>> {
        return getClient().post(
            `/otp/v1/verify`,
            request
        );
    }
}
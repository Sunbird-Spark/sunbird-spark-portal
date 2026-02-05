import { getClient, ApiResponse } from '../lib/http-client';

export class UserService {
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

    public async resetPassword(
        request: any
    ): Promise<ApiResponse<any>> {
        return getClient().post(
            `/user/v1/password/reset`,
            request
        );
    }
}
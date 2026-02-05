import { getClient, ApiResponse } from '../lib/http-client';

export class UserService {
    public async searchUser(
        identifier: string,
        name: string,
        captchaResponse?: string
    ): Promise<ApiResponse<any>> {
        const isPhone = /^[6-9]\d{9}$/.test(identifier.trim());
        const payload: any = {
            request: {
                filters: {
                    isDeleted: 'false',
                    fuzzy: { firstName: name.trim() },
                    $or: {},
                },
            },
        };

        if (isPhone) {
            payload.request.filters.$or = {
                phone: identifier.trim(),
                prevUsedPhone: identifier.trim(),
            };
        } else {
            payload.request.filters.$or = {
                email: identifier.trim(),
                prevUsedEmail: identifier.trim(),
            };
        }

        return this.fuzzyUserSearch(payload, captchaResponse);
    }

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
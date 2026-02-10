import { getClient, ApiResponse } from '../lib/http-client';

interface SignupRequest {
    request: {
        firstName?: string;
        email?: string;
        phone?: string;
        password: string;
        emailVerified?: boolean;
        phoneVerified?: boolean;
    };
    params?: {
        source?: string;
        signupType?: string;
    };
}

interface SignupResponse {
    userId: string;
    accessToken?: string;
    refreshToken?: string;
}

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

    /**
     * Determines if the identifier is an email or phone number
     */
    private isEmail(identifier: string): boolean {
        return identifier.includes('@');
    }

    /**
     * Sign up a new user with email or phone
     * @param firstName - User's first name
     * @param identifier - Email or phone number
     * @param password - User password
     * @param deviceId - Optional device ID
     * @returns Promise with the signup response
     */
    public async signup(
        firstName: string,
        identifier: string,
        password: string,
        deviceId?: string
    ): Promise<ApiResponse<SignupResponse>> {
        const headers: Record<string, string> = {};
        if (deviceId) {
            headers['x-device-id'] = deviceId;
        }

        const isEmail = this.isEmail(identifier);
        
        const requestBody: SignupRequest = {
            request: {
                firstName,
                password,
                ...(isEmail 
                    ? { email: identifier, emailVerified: false }
                    : { phone: identifier, phoneVerified: false }
                )
            },
            params: {
                source: 'web',
                signupType: 'self'
            }
        };

        return getClient().post<SignupResponse>(
            `/user/v2/signup`,
            requestBody,
            headers
        );
    }
}
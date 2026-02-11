import { getClient, ApiResponse } from '../lib/http-client';
import _ from 'lodash';
import { SignupRequest, SignupResponse } from '../types/signupTypes'

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

    private isEmail(identifier: string): boolean {
        return _.includes(identifier, '@');
    }

    public async signup(
        firstName: string,
        identifier: string,
        password: string,
        deviceId?: string
    ): Promise<ApiResponse<SignupResponse>> {
        const headers: Record<string, string> = {};
        if (!_.isEmpty(deviceId) && !_.isUndefined(deviceId)) {
            headers['x-device-id'] = deviceId;
        }

        const isEmail = this.isEmail(identifier);

        const requestBody: SignupRequest = {
            request: _.assign(
                {
                    firstName,
                    password,
                },
                isEmail
                    ? { email: identifier, emailVerified: true }
                    : { phone: identifier, phoneVerified: true }
            ),
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
import { getClient, ApiResponse } from '../lib/http-client';
import _ from 'lodash';
import { SignupRequest, SignupResponse } from '../types/signupTypes'
import { UserReadResponse } from '../types/userTypes';
import { CourseEnrollmentResponse } from '../types/TrackableCollections';
import { UpdateProfileRequest, UpdateProfileResponse } from '../types/profileTypes';

const ORG_DETAILS_FIELDS = ['orgName', 'email'] as const;
const LICENSE_DETAILS_FIELDS = ['name', 'description', 'url'] as const;
const ENROLLMENT_CONTENT_FIELDS = [
  'contentType',
  'topic',
  'name',
  'channel',
  'mimeType',
  'appIcon',
  'resourceType',
  'identifier',
  'pkgVersion',
  'trackable',
  'primaryCategory',
  'organisation',
  'board',
  'medium',
  'gradeLevel',
  'subject',
] as const;
const BATCH_DETAILS_FIELDS = [
  'name',
  'endDate',
  'startDate',
  'status',
  'enrollmentType',
  'createdBy',
  'certificates',
] as const;

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

    public async userRead(
        id: string
    ): Promise<ApiResponse<UserReadResponse>> {
        const fields = 'organisations,roles,locations,declarations,externalIds,framework';
        return getClient().get<UserReadResponse>(
            `/user/v5/read/${id}?fields=${encodeURIComponent(fields)}`
        );
    }

    public async getUserRoles(userId: string): Promise<ApiResponse<UserReadResponse>> {
        return getClient().get<UserReadResponse>(
            `/user/v5/read/${userId}?fields=roles`
        );
    }

    public async searchUserByUserName(userName: string): Promise<ApiResponse<any>> {
        return getClient().post(
            '/user/v3/search',
            {
                request: {
                    filters: {
                        userName: userName.trim(),
                    }
                },
            }
        );
    }

    public async searchMentors(rootOrgId: string, query: string = ''): Promise<ApiResponse<any>> {
        return getClient().post(
            '/user/v3/search',
            {
                request: {
                    filters: {
                        status: '1',
                        rootOrgId,
                        'organisations.roles': ['COURSE_MENTOR'],
                    },
                    query,
                },
            }
        );
    }
public async updateProfile(
        request: UpdateProfileRequest
    ): Promise<ApiResponse<UpdateProfileResponse>> {
        return getClient().patch<UpdateProfileResponse>(
            '/user/v3/update',
            request
        );
    }
    public async getUserEnrollments(userId: string): Promise<ApiResponse<CourseEnrollmentResponse>> {
        const searchParams = new URLSearchParams({
            orgdetails: ORG_DETAILS_FIELDS.join(','),
            licenseDetails: LICENSE_DETAILS_FIELDS.join(','),
            fields: ENROLLMENT_CONTENT_FIELDS.join(','),
            batchDetails: BATCH_DETAILS_FIELDS.join(','),
        });
        const url = `/course/v1/user/enrollment/list/${userId}?${searchParams.toString()}`;
        return getClient().get<CourseEnrollmentResponse>(url);
    }

    public async getPrivateUserEnrollments(userId: string): Promise<ApiResponse<CourseEnrollmentResponse>> {
        const searchParams = new URLSearchParams({
            orgdetails: ORG_DETAILS_FIELDS.join(','),
            licenseDetails: LICENSE_DETAILS_FIELDS.join(','),
            fields: ENROLLMENT_CONTENT_FIELDS.join(','),
            batchDetails: BATCH_DETAILS_FIELDS.join(','),
        });
        const url = `/course/private/v1/user/enrollment/list/${userId}?${searchParams.toString()}`;
        return getClient().get<CourseEnrollmentResponse>(url);
    }
}

export const userService = new UserService();
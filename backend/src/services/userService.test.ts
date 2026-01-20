import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getCurrentUser } from './userService.js';
import logger from '../utils/logger.js';
import { saveSession } from '../utils/sessionUtils.js';

vi.mock('axios');
vi.mock('uuid');
vi.mock('dayjs');
vi.mock('../config/env.js', () => ({
    envConfig: {
        KONG_URL: 'http://localhost:8000',
        KONG_LOGGEDIN_FALLBACK_TOKEN: 'fallback-token-loggedin',
        KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-token-anonymous',
    },
}));
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));
vi.mock('../utils/sessionUtils.js', () => ({
    saveSession: vi.fn().mockResolvedValue(undefined),
}));

const mockAxios = vi.mocked(axios);
const mockUuidv4 = vi.mocked(uuidv4);
const mockDayjs = vi.mocked(dayjs);
const mockLogger = vi.mocked(logger);
const mockSaveSession = vi.mocked(saveSession);

describe('UserService', () => {
    let mockRequest: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRequest = {
            session: {
                save: vi.fn((callback: any) => callback(null)),
            },
            sessionID: 'test-session-id',
        };

        mockUuidv4.mockReturnValue('test-uuid' as any);
        mockDayjs.mockReturnValue({
            format: vi.fn().mockReturnValue('2024-01-01 12:00:00:000')
        } as any);
        mockSaveSession.mockResolvedValue(undefined);
    });

    describe('getCurrentUser', () => {
        it('should successfully get current user with valid response', async () => {
            mockRequest.session.userId = 'test-user-id';
            mockRequest.session.kongToken = 'test-kong-token';
            mockRequest.kauth = {
                grant: {
                    access_token: {
                        token: 'test-auth-token',
                    },
                },
            };

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userId: 'test-user-id',
                        userName: 'testuser',
                        roles: [{ role: 'USER' }, { role: 'LEARNER' }],
                        organisations: [
                            {
                                organisationId: 'org1',
                                roles: ['CONTENT_CREATOR'],
                            },
                            {
                                organisationId: 'org2',
                                roles: ['ADMIN'],
                            },
                        ],
                        rootOrg: {
                            id: 'root-org-id',
                            hashTagId: 'root-hashtag',
                            slug: 'root-slug',
                            orgName: 'Root Organization',
                            channel: 'root-channel',
                            rootOrgId: 'root-org-id',
                        },
                    },
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

            const result = await getCurrentUser(mockRequest as unknown as Request);

            expect(mockAxios.get).toHaveBeenCalledWith(
                'http://localhost:8000/user/v5/read/test-user-id',
                {
                    headers: {
                        'x-msgid': 'test-uuid',
                        ts: '2024-01-01 12:00:00:000',
                        'Content-Type': 'application/json',
                        accept: 'application/json',
                        Authorization: 'Bearer test-kong-token',
                        'x-authenticated-user-token': 'test-auth-token',
                    },
                }
            );

            expect(mockRequest.session.userId).toBe('test-user-id');
            expect(mockRequest.session.userName).toBe('testuser');
            expect(mockRequest.session.userSid).toBe('test-session-id');
            expect(mockRequest.session.roles).toEqual(['USER', 'LEARNER', 'CONTENT_CREATOR', 'ADMIN', 'PUBLIC', 'ANONYMOUS']);
            expect(mockRequest.session.orgs).toEqual(['org1', 'org2']);
            expect(mockRequest.session.rootOrgId).toBe('root-org-id');
            expect(mockRequest.session.rootOrg).toEqual({
                id: 'root-org-id',
                slug: 'root-slug',
                orgName: 'Root Organization',
                channel: 'root-channel',
                hashTagId: 'root-hashtag',
                rootOrgId: 'root-org-id',
            });

            expect(mockSaveSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeUndefined();
        });

        it('should use fallback tokens when no kong token available', async () => {
            mockRequest.session.userId = 'test-user-id';
            mockRequest.session.kongToken = undefined;

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userName: 'testuser',
                        roles: [],
                        organisations: [],
                        rootOrg: {
                            id: 'root-org-id',
                            hashTagId: 'root-hashtag',
                        },
                    },
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

            await getCurrentUser(mockRequest as unknown as Request);

            expect(mockAxios.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer fallback-token-loggedin',
                    }),
                })
            );
        });

        it('should handle organizations with missing data', async () => {
            mockRequest.session.userId = 'test-user-id';

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userName: 'testuser',
                        roles: [{ role: 'USER' }],
                        organisations: [
                            {
                                organisationId: 'org1',
                            },
                            {
                                organisationId: null,
                                roles: ['CONTENT_CREATOR'],
                            },
                            {
                                organisationId: 'valid-org',
                                roles: ['LEARNER'],
                            },
                        ],
                    },
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

            await getCurrentUser(mockRequest as unknown as Request);

            expect(mockRequest.session.roles).toEqual(['USER', 'CONTENT_CREATOR', 'LEARNER', 'PUBLIC', 'ANONYMOUS']);
            expect(mockRequest.session.orgs).toEqual(['org1', 'valid-org']);
            expect(mockRequest.session.rootOrgId).toBeUndefined();
        });

        it('should throw error when userId is missing', async () => {
            mockRequest.session.userId = undefined;

            await expect(getCurrentUser(mockRequest as unknown as Request)).rejects.toThrow('fetchAndStoreCurrentUser :: userId missing from session');
        });

        it('should handle API and network errors', async () => {
            mockRequest.session.userId = 'test-user-id';

            // Test API error response
            const mockErrorData = {
                responseCode: 'CLIENT_ERROR',
                params: {
                    err: 'USER_NOT_FOUND',
                    status: 'failed',
                    errmsg: 'User not found',
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockErrorData });

            await expect(getCurrentUser(mockRequest as unknown as Request)).rejects.toEqual(mockErrorData);
            expect(mockLogger.error).toHaveBeenCalledWith('fetchAndStoreCurrentUser :: user API returned non-OK response', mockErrorData);

            // Test network error
            const networkError = {
                message: 'Network Error',
                response: {
                    status: 500,
                    data: { error: 'Internal Server Error' },
                },
            };

            (mockAxios.get as any).mockRejectedValue(networkError);

            await expect(getCurrentUser(mockRequest as unknown as Request)).rejects.toEqual(networkError);
            expect(mockLogger.error).toHaveBeenCalledWith('fetchAndStoreCurrentUser :: user API call failed with status 500', { error: 'Internal Server Error' });
        });

        it('should handle roles and session correctly', async () => {
            mockRequest.session.userId = 'test-user-id';

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userName: 'testuser',
                        roles: [{ role: 'USER' }, { role: 'LEARNER' }],
                        organisations: [
                            {
                                organisationId: 'org1',
                                roles: ['USER', 'ADMIN'], // Duplicate USER role
                            },
                        ],
                        rootOrg: {
                            id: 'root-org-id',
                            hashTagId: 'root-hashtag',
                        },
                    },
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

            await getCurrentUser(mockRequest as unknown as Request);

            // Should handle duplicate roles and always add PUBLIC/ANONYMOUS
            expect(mockRequest.session.roles).toEqual(['USER', 'LEARNER', 'ADMIN', 'PUBLIC', 'ANONYMOUS']);

            // Should log session data
            expect(mockLogger.info).toHaveBeenCalledWith('fetchAndStoreCurrentUser :: session data set successfully', {
                userId: 'test-user-id',
                rootOrgId: 'root-org-id',
                roles: ['USER', 'LEARNER', 'ADMIN', 'PUBLIC', 'ANONYMOUS'],
                userSid: 'test-session-id',
                orgs: ['org1'],
            });
        });
    });
});
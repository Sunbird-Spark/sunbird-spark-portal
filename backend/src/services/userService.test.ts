import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dateFormat from 'dateformat';
import { getCurrentUser } from './userService.js';
import logger from '../utils/logger.js';

vi.mock('axios');
vi.mock('uuid');
vi.mock('dateformat');
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

const mockAxios = vi.mocked(axios);
const mockUuidv4 = vi.mocked(uuidv4);
const mockDateFormat = vi.mocked(dateFormat);
const mockLogger = vi.mocked(logger);

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

        (mockUuidv4 as any).mockReturnValue('test-uuid');
        (mockDateFormat as any).mockReturnValue('2024-01-01 12:00:00:000');
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

            expect(mockRequest.session.save).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        it('should use userId from result.response.userId when id is not present', async () => {
            mockRequest.session.userId = 'test-user-id';

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        userId: 'user-id-from-userId-field',
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

            expect(mockRequest.session.userId).toBe('user-id-from-userId-field');
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

        it('should use anonymous fallback token when no userId in session', async () => {
            mockRequest.session.userId = undefined;
            mockRequest.session.kongToken = undefined;

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'anonymous-user',
                        userName: 'anonymous',
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

            await expect(getCurrentUser(mockRequest as unknown as Request)).rejects.toThrow('fetchAndStoreCurrentUser :: userId missing from session');
        });

        it('should handle organizations without roles', async () => {
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
                                organisationId: 'org2',
                                roles: null,
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

            expect(mockRequest.session.roles).toEqual(['USER', 'PUBLIC', 'ANONYMOUS']);
            expect(mockRequest.session.orgs).toEqual(['org1', 'org2']);
        });

        it('should handle organizations without organisationId', async () => {
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
                                roles: ['ADMIN'],
                                // No organisationId
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
                        rootOrg: {
                            id: 'root-org-id',
                            hashTagId: 'root-hashtag',
                        },
                    },
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

            await getCurrentUser(mockRequest as unknown as Request);

            expect(mockRequest.session.roles).toEqual(['USER', 'ADMIN', 'CONTENT_CREATOR', 'LEARNER', 'PUBLIC', 'ANONYMOUS']);
            expect(mockRequest.session.orgs).toEqual(['valid-org']);
        });

        it('should handle missing rootOrg', async () => {
            mockRequest.session.userId = 'test-user-id';

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userName: 'testuser',
                        roles: [{ role: 'USER' }],
                        organisations: [],
                    },
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

            await getCurrentUser(mockRequest as unknown as Request);

            expect(mockRequest.session.rootOrgId).toBeUndefined();
            expect(mockRequest.session.rootOrg).toBeUndefined();
        });

        it('should throw error when userId is missing', async () => {
            mockRequest.session.userId = undefined;

            await expect(getCurrentUser(mockRequest as unknown as Request)).rejects.toThrow('fetchAndStoreCurrentUser :: userId missing from session');
        });

        it('should handle API error response', async () => {
            mockRequest.session.userId = 'test-user-id';

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
        });

        it('should handle axios network error', async () => {
            mockRequest.session.userId = 'test-user-id';

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

        it('should handle axios error without response', async () => {
            mockRequest.session.userId = 'test-user-id';

            const error = new Error('Request timeout');

            (mockAxios.get as any).mockRejectedValue(error);

            await expect(getCurrentUser(mockRequest as unknown as Request)).rejects.toEqual(error);

            expect(mockLogger.error).toHaveBeenCalledWith('fetchAndStoreCurrentUser :: user API call failed with status undefined', undefined);
        });

        it('should handle session save error', async () => {
            mockRequest.session.userId = 'test-user-id';
            const saveError = new Error('Session save failed');
            mockRequest.session.save = vi.fn().mockImplementation((callback) => callback(saveError));

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

            await expect(getCurrentUser(mockRequest as unknown as Request)).rejects.toEqual(saveError);
        });

        it('should handle empty roles array', async () => {
            mockRequest.session.userId = 'test-user-id';

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userName: 'testuser',
                        roles: null,
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

            expect(mockRequest.session.roles).toEqual(['PUBLIC', 'ANONYMOUS']);
        });

        it('should handle duplicate roles correctly', async () => {
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
                                roles: ['USER', 'ADMIN'],
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

            expect(mockRequest.session.roles).toEqual(['USER', 'LEARNER', 'ADMIN', 'PUBLIC', 'ANONYMOUS']);
        });

        it('should always add PUBLIC and ANONYMOUS roles', async () => {
            mockRequest.session.userId = 'test-user-id';

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userName: 'testuser',
                        roles: [{ role: 'PUBLIC' }, { role: 'ANONYMOUS' }],
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

            expect(mockRequest.session.roles).toEqual(['PUBLIC', 'ANONYMOUS']);
        });

        it('should log session data correctly', async () => {
            mockRequest.session.userId = 'test-user-id';

            const mockUserData = {
                responseCode: 'OK',
                result: {
                    response: {
                        id: 'test-user-id',
                        userName: 'testuser',
                        roles: [{ role: 'USER' }],
                        organisations: [{ organisationId: 'org1', roles: ['ADMIN'] }],
                        rootOrg: {
                            id: 'root-org-id',
                            hashTagId: 'root-hashtag',
                        },
                    },
                },
            };

            (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

            await getCurrentUser(mockRequest as unknown as Request);

            expect(mockLogger.info).toHaveBeenCalledWith('fetchAndStoreCurrentUser :: session data set successfully', {
                userId: 'test-user-id',
                rootOrgId: 'root-org-id',
                roles: ['USER', 'ADMIN', 'PUBLIC', 'ANONYMOUS'],
                userSid: 'test-session-id',
                orgs: ['org1'],
            });
        });
    });
});
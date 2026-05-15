import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './UserService';
import * as httpClient from '../lib/http-client';

vi.mock('../lib/http-client');

describe('UserService', () => {
    let userService: UserService;
    let mockClient: any;

    beforeEach(() => {
        userService = new UserService();
        mockClient = {
            post: vi.fn(),
        };
        vi.spyOn(httpClient, 'getClient').mockReturnValue(mockClient);
    });

    describe('searchUser', () => {
        it('should search user by email', async () => {
            const mockResponse = {
                data: { users: [] },
                status: 200,
                headers: {}
            };
            mockClient.post.mockResolvedValue(mockResponse);

            await userService.searchUser('test@example.com', 'John');

            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v1/fuzzy/search',
                expect.objectContaining({
                    request: expect.objectContaining({
                        filters: expect.objectContaining({
                            $or: {
                                email: 'test@example.com',
                                prevUsedEmail: 'test@example.com'
                            }
                        })
                    })
                })
            );
        });

        it('should search user by phone', async () => {
            const mockResponse = {
                data: { users: [] },
                status: 200,
                headers: {}
            };
            mockClient.post.mockResolvedValue(mockResponse);

            await userService.searchUser('9876543210', 'John');

            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v1/fuzzy/search',
                expect.objectContaining({
                    request: expect.objectContaining({
                        filters: expect.objectContaining({
                            $or: {
                                phone: '9876543210',
                                prevUsedPhone: '9876543210'
                            }
                        })
                    })
                })
            );
        });
    });

    describe('signup', () => {
        it('should successfully sign up with email', async () => {
            const mockResponse = {
                data: { userId: 'user123' },
                status: 200,
                headers: {}
            };
            mockClient.post.mockResolvedValue(mockResponse);

            const result = await userService.signup('John', 'test@example.com', 'Password123!');

            expect(result).toEqual(mockResponse);
            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v2/signup',
                expect.objectContaining({
                    request: expect.objectContaining({
                        firstName: 'John',
                        email: 'test@example.com',
                        password: 'Password123!',
                        emailVerified: true
                    }),
                    params: {
                        source: 'web',
                        signupType: 'self'
                    }
                }),
                {}
            );
        });

        it('should successfully sign up with phone', async () => {
            const mockResponse = {
                data: { userId: 'user123' },
                status: 200,
                headers: {}
            };
            mockClient.post.mockResolvedValue(mockResponse);

            const result = await userService.signup('Jane', '9876543210', 'Password123!');

            expect(result).toEqual(mockResponse);
            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v2/signup',
                expect.objectContaining({
                    request: expect.objectContaining({
                        firstName: 'Jane',
                        phone: '9876543210',
                        password: 'Password123!',
                        phoneVerified: true
                    }),
                    params: {
                        source: 'web',
                        signupType: 'self'
                    }
                }),
                {}
            );
        });

        it('should include device ID in headers when provided', async () => {
            const mockResponse = {
                data: { userId: 'user123' },
                status: 200,
                headers: {}
            };
            mockClient.post.mockResolvedValue(mockResponse);

            await userService.signup('John', 'test@example.com', 'Password123!', 'device-123');

            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v2/signup',
                expect.any(Object),
                { 'x-device-id': 'device-123' }
            );
        });
    });

    describe('checkUserExists', () => {
        it('should check existence by email', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: { exists: true } });

            const result = await userService.checkUserExists('test@example.com');

            expect(mockClient.get).toHaveBeenCalledWith(
                '/user/v1/exists/email/test%40example.com'
            );
            expect(result).toEqual({ data: { exists: true } });
        });

        it('should check existence by phone', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: { exists: false } });

            const result = await userService.checkUserExists('9876543210');

            expect(mockClient.get).toHaveBeenCalledWith(
                '/user/v1/exists/phone/9876543210'
            );
            expect(result).toEqual({ data: { exists: false } });
        });

        it('should append captchaResponse query param when provided', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: { exists: false } });

            await userService.checkUserExists('test@example.com', 'captcha-token-123');

            expect(mockClient.get).toHaveBeenCalledWith(
                '/user/v1/exists/email/test%40example.com?captchaResponse=captcha-token-123'
            );
        });

        it('should not append query param when captchaResponse is undefined', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: { exists: false } });

            await userService.checkUserExists('9876543210');

            const calledUrl: string = mockClient.get.mock.calls[0][0];
            expect(calledUrl).not.toContain('captchaResponse');
        });
    });

    describe('resetPassword', () => {
        it('should reset password', async () => {
            const mockResponse = {
                data: { success: true },
                status: 200,
                headers: {}
            };
            mockClient.post.mockResolvedValue(mockResponse);

            const request = { key: 'test@example.com', password: 'NewPass123!' };
            const result = await userService.resetPassword(request);

            expect(result).toEqual(mockResponse);
            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v1/password/reset',
                request
            );
        });
    });

    describe('userRead', () => {
        it('should call GET with correct URL including fields', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: { response: {} } });
            await userService.userRead('user-123');
            expect(mockClient.get).toHaveBeenCalledWith(
                expect.stringContaining('/user/v5/read/user-123')
            );
            const calledUrl: string = mockClient.get.mock.calls[0][0];
            expect(calledUrl).toContain('organisations');
            expect(calledUrl).toContain('roles');
        });
    });

    describe('getUserRoles', () => {
        it('should call GET with roles field', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: {} });
            await userService.getUserRoles('user-abc');
            expect(mockClient.get).toHaveBeenCalledWith(
                '/user/v5/read/user-abc?fields=roles'
            );
        });
    });

    describe('searchUserByUserName', () => {
        it('should POST with trimmed userName filter', async () => {
            mockClient.post.mockResolvedValue({ data: {} });
            await userService.searchUserByUserName('  john_doe  ');
            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v3/search',
                expect.objectContaining({
                    request: expect.objectContaining({
                        filters: { userName: 'john_doe' },
                    }),
                })
            );
        });
    });

    describe('searchMentors', () => {
        it('should POST with correct filters and empty query by default', async () => {
            mockClient.post.mockResolvedValue({ data: {} });
            await userService.searchMentors('org-1');
            expect(mockClient.post).toHaveBeenCalledWith(
                '/user/v3/search',
                expect.objectContaining({
                    request: expect.objectContaining({
                        filters: expect.objectContaining({
                            rootOrgId: 'org-1',
                            'organisations.roles': ['COURSE_MENTOR'],
                        }),
                        query: '',
                    }),
                })
            );
        });

        it('should pass query when provided', async () => {
            mockClient.post.mockResolvedValue({ data: {} });
            await userService.searchMentors('org-1', 'alice');
            const body = mockClient.post.mock.calls[0][1];
            expect(body.request.query).toBe('alice');
        });
    });

    describe('updateProfile', () => {
        it('should PATCH to /user/v3/update with request body', async () => {
            mockClient.patch = vi.fn().mockResolvedValue({ data: {} });
            const req = { userId: 'u1', framework: {} };
            await userService.updateProfile(req as any);
            expect(mockClient.patch).toHaveBeenCalledWith('/user/v3/update', req);
        });
    });

    describe('getUserEnrollments', () => {
        it('should GET enrollment list URL with query params', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: {} });
            await userService.getUserEnrollments('user-xyz');
            const calledUrl: string = mockClient.get.mock.calls[0][0];
            expect(calledUrl).toContain('/course/v1/user/enrollment/list/user-xyz');
            expect(calledUrl).toContain('orgdetails');
            expect(calledUrl).toContain('batchDetails');
        });
    });

    describe('getPrivateUserEnrollments', () => {
        it('should GET private enrollment list URL with query params', async () => {
            mockClient.get = vi.fn().mockResolvedValue({ data: {} });
            await userService.getPrivateUserEnrollments('user-xyz');
            const calledUrl: string = mockClient.get.mock.calls[0][0];
            expect(calledUrl).toContain('/course/private/v1/user/enrollment/list/user-xyz');
            expect(calledUrl).toContain('orgdetails');
        });
    });
});

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
});

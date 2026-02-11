import { describe, it, expect, vi, beforeEach } from 'vitest';
import userAuthInfoService, { userAuthInfoService as UserAuthInfoServiceClass } from './userAuthInfoService';
import * as httpClient from '../../lib/http-client';

vi.mock('../../lib/http-client', () => ({
    getClient: vi.fn()
}));

describe('userAuthInfoService', () => {
    const mockGet = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        userAuthInfoService.clearAuth();
        (httpClient.getClient as any).mockReturnValue({
            get: mockGet
        });
    });

    it('should maintain singleton instance', () => {
        const instance1 = UserAuthInfoServiceClass.getInstance();
        const instance2 = UserAuthInfoServiceClass.getInstance();
        expect(instance1).toBe(instance2);
        expect(instance1).toBe(userAuthInfoService);
    });

    describe('getAuthInfo', () => {
        const mockDeviceId = 'test-device-id';
        const mockSuccessResponse = {
            data: {
                id: 'api.user.auth.info',
                ver: '1.0',
                ts: new Date(),
                params: {
                    status: 'successful',
                    resmsgid: 'msg-id',
                    msgid: 'msg-id',
                    err: null,
                    errmsg: null
                },
                responseCode: 'OK',
                result: {
                    sid: 'session-123',
                    uid: 'user-456',
                    isAuthenticated: true
                }
            },
            status: 200,
            headers: {}
        };

        const mockAnonymousResponse = {
            data: {
                params: { status: 'successful' },
                result: {
                    sid: 'session-789',
                    uid: null,
                    isAuthenticated: false
                }
            },
            status: 200,
            headers: {}
        };

        it('should successfully fetch auth status and update state', async () => {
            mockGet.mockResolvedValue(mockSuccessResponse);

            const result = await userAuthInfoService.getAuthInfo(mockDeviceId);

            // Check HTTP client call
            expect(mockGet).toHaveBeenCalledWith('/user/v1/auth/info', {
                'x-device-id': mockDeviceId
            });

            // Check result
            expect(result).toEqual(mockSuccessResponse.data.result);

            // Check internal state update
            expect(userAuthInfoService.getSessionId()).toBe('session-123');
            expect(userAuthInfoService.getUserId()).toBe('user-456');
            expect(userAuthInfoService.isUserAuthenticated()).toBe(true);
        });

        it('should handle anonymous user properly', async () => {
            mockGet.mockResolvedValue(mockAnonymousResponse);

            await userAuthInfoService.getAuthInfo(mockDeviceId);

            expect(userAuthInfoService.getSessionId()).toBe('session-789');
            expect(userAuthInfoService.getUserId()).toBeNull();
            expect(userAuthInfoService.isUserAuthenticated()).toBe(false);
        });

        it('should call without device ID header when not provided', async () => {
            mockGet.mockResolvedValue(mockSuccessResponse);

            // Explicitly pass undefined to satisfy stricter TS check if implicit undefined is not allowed
            await userAuthInfoService.getAuthInfo(undefined);

            expect(mockGet).toHaveBeenCalledWith('/user/v1/auth/info', {});
        });

        it('should throw error when api returns unsuccessful status', async () => {
            const mockErrorResponse = {
                data: {
                    params: {
                        status: 'failed',
                        errmsg: 'Something went wrong'
                    }
                },
                status: 200,
                headers: {}
            };
            mockGet.mockResolvedValue(mockErrorResponse);

            await expect(userAuthInfoService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Something went wrong');

            // State should not change
            expect(userAuthInfoService.getSessionId()).toBeNull();
        });

        it('should use default error message when api returns failed status without errmsg', async () => {
            const mockErrorResponse = {
                data: {
                    params: {
                        status: 'failed',
                        errmsg: null
                    }
                },
                status: 200,
                headers: {}
            };
            mockGet.mockResolvedValue(mockErrorResponse);

            await expect(userAuthInfoService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Failed to fetch auth status');
        });

        it('should throw error when HTTP client fails', async () => {
            const networkError = new Error('Network Error');
            mockGet.mockRejectedValue(networkError);

            await expect(userAuthInfoService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Network Error');
        });

        it('should log detailed error info if error has response', async () => {
            const httpError = {
                response: {
                    status: 400,
                    data: { message: 'Bad Request' }
                }
            };
            mockGet.mockRejectedValue(httpError);

            // Spy on console.error to verify logging
            const consoleSpy = vi.spyOn(console, 'error');

            try {
                await userAuthInfoService.getAuthInfo(mockDeviceId);
            } catch (e) {
                // Expected error
            }

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching auth status:', httpError);
            expect(consoleSpy).toHaveBeenCalledWith('Status:', 400);
            // Verify that sensitive data is redacted - only safe fields are logged
            expect(consoleSpy).toHaveBeenCalledWith('Response:', {
                responseCode: undefined,
                status: undefined,
                errmsg: undefined
            });
        });
    });

    describe('State Management', () => {
        it('should return null for initial getters', () => {
            expect(userAuthInfoService.getSessionId()).toBeNull();
            expect(userAuthInfoService.getUserId()).toBeNull();
            expect(userAuthInfoService.isUserAuthenticated()).toBe(false);
        });

        it('should clear auth data correctly', async () => {
            // Setup state
            const mockResponse = {
                data: {
                    params: { status: 'successful' },
                    result: { sid: 's1', uid: 'u1', isAuthenticated: true }
                },
                status: 200,
                headers: {}
            };
            mockGet.mockResolvedValue(mockResponse);
            await userAuthInfoService.getAuthInfo('d1');

            expect(userAuthInfoService.isUserAuthenticated()).toBe(true);

            // Clear
            userAuthInfoService.clearAuth();

            // Verify reset
            expect(userAuthInfoService.getSessionId()).toBeNull();
            expect(userAuthInfoService.getUserId()).toBeNull();
            expect(userAuthInfoService.isUserAuthenticated()).toBe(false);
        });
    });
});

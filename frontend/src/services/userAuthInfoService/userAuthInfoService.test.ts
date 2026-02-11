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
        // Note: The AxiosAdapter unwraps the response, so we mock the unwrapped data structure (just the result)
        const mockSuccessResponse = {
            data: {
                sid: 'session-123',
                uid: 'user-456',
                isAuthenticated: true
            },
            status: 200,
            headers: {}
        };

        const mockAnonymousResponse = {
            data: {
                sid: 'session-789',
                uid: null,
                isAuthenticated: false
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
            expect(result).toEqual(mockSuccessResponse.data);

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

            await userAuthInfoService.getAuthInfo();

            expect(mockGet).toHaveBeenCalledWith('/user/v1/auth/info', {});
        });

        it('should throw error when api returns invalid structure', async () => {
            const mockErrorResponse = {
                data: {}, // Missing sid
                status: 200,
                headers: {}
            };
            mockGet.mockResolvedValue(mockErrorResponse);

            await expect(userAuthInfoService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Invalid response structure from auth API');

            // State should not change
            expect(userAuthInfoService.getSessionId()).toBeNull();
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
                    sid: 's1', uid: 'u1', isAuthenticated: true
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

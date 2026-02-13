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

        const mockApiErrorResponse = {
            data: {
                sid: null,
                uid: null,
                isAuthenticated: false
            },
            status: 401,
            headers: {}
        };

        it('should successfully fetch auth status and update state', async () => {
            mockGet.mockResolvedValue(mockSuccessResponse);

            const result = await userAuthInfoService.getAuthInfo();

            // Check HTTP client call
            expect(mockGet).toHaveBeenCalledWith('/user/v1/auth/info');

            // Check result
            expect(result).toEqual(mockSuccessResponse.data);

            // Check internal state update
            expect(userAuthInfoService.getSessionId()).toBe('session-123');
            expect(userAuthInfoService.getUserId()).toBe('user-456');
            expect(userAuthInfoService.isUserAuthenticated()).toBe(true);
        });

        it('should handle anonymous user properly', async () => {
            mockGet.mockResolvedValue(mockAnonymousResponse);

            await userAuthInfoService.getAuthInfo();

            expect(userAuthInfoService.getSessionId()).toBe('session-789');
            expect(userAuthInfoService.getUserId()).toBeNull();
            expect(userAuthInfoService.isUserAuthenticated()).toBe(false);
        });

        it('should handle API error response (non-2xx status)', async () => {
            // AxiosAdapter converts non-2xx responses to resolved ApiResponse
            mockGet.mockResolvedValue(mockApiErrorResponse);

            // Service doesn't validate status codes, so it will process the response
            const result = await userAuthInfoService.getAuthInfo();

            expect(result).toEqual(mockApiErrorResponse.data);
            // State gets updated even with error status
            expect(userAuthInfoService.getSessionId()).toBeNull();
            expect(userAuthInfoService.getUserId()).toBeNull();
            expect(userAuthInfoService.isUserAuthenticated()).toBe(false);
        });

        it('should throw error when HTTP client fails (network error)', async () => {
            const networkError = new Error('Network Error');
            mockGet.mockRejectedValue(networkError);

            await expect(userAuthInfoService.getAuthInfo())
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
                await userAuthInfoService.getAuthInfo();
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
                data: { sid: 's1', uid: 'u1', isAuthenticated: true },
                status: 200,
                headers: {}
            };
            mockGet.mockResolvedValue(mockResponse);
            await userAuthInfoService.getAuthInfo();

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

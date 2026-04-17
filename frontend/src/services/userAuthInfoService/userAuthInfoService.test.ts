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
        (httpClient.getClient as import('vitest').Mock).mockReturnValue({
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
            } catch {
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

        it('should cache the promise and prevent duplicate HTTP calls', async () => {
            const mockResponse = {
                data: {
                    sid: 'session-123',
                    uid: 'user-456',
                    isAuthenticated: true
                },
                status: 200,
                headers: {}
            };
            mockGet.mockResolvedValue(mockResponse);

            // Call getAuthInfo multiple times simultaneously
            const promise1 = userAuthInfoService.getAuthInfo();
            const promise2 = userAuthInfoService.getAuthInfo();
            const promise3 = userAuthInfoService.getAuthInfo();

            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

            // HTTP client should only be called once
            expect(mockGet).toHaveBeenCalledTimes(1);
            
            // All results should be the same
            expect(result1).toEqual(mockResponse.data);
            expect(result2).toEqual(mockResponse.data);
            expect(result3).toEqual(mockResponse.data);
        });

        it('should clear cached promise on error to allow retry', async () => {
            const networkError = new Error('Network Error');
            mockGet.mockRejectedValueOnce(networkError);

            // First call fails
            await expect(userAuthInfoService.getAuthInfo()).rejects.toThrow('Network Error');
            expect(mockGet).toHaveBeenCalledTimes(1);

            // Second call should retry (not use cached error)
            const mockResponse = {
                data: { sid: 's1', uid: 'u1', isAuthenticated: true },
                status: 200,
                headers: {}
            };
            mockGet.mockResolvedValueOnce(mockResponse);
            
            const result = await userAuthInfoService.getAuthInfo();
            expect(mockGet).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('request generation staleness (line 48 false branch)', () => {
        it('does not update state when a newer request has been started (stale generation)', async () => {
            // Simulate: first request starts, then clearAuth increments generation,
            // then first request resolves — its generation check fails → state not updated
            let resolveFirst!: (v: any) => void;
            const firstPromise = new Promise(r => { resolveFirst = r; });
            mockGet.mockReturnValueOnce(firstPromise);

            const p = userAuthInfoService.getAuthInfo();
            // Invalidate by clearing auth, which bumps requestGeneration
            userAuthInfoService.clearAuth();
            // Now resolve the first request with valid data
            resolveFirst({
                data: { sid: 'stale-sid', uid: 'stale-uid', isAuthenticated: true },
                status: 200,
                headers: {}
            });

            await p.catch(() => {});
            // State should NOT have been updated (stale generation)
            expect(userAuthInfoService.getSessionId()).toBeNull();
        });
    });

    describe('error logging — httpError.response?.data falsy (line 61 false branch)', () => {
        it('logs undefined when error.response has no data', async () => {
            const httpError = { response: { status: 500 } }; // no data property
            mockGet.mockRejectedValue(httpError);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            try {
                await userAuthInfoService.getAuthInfo();
            } catch {
                // expected
            }

            expect(consoleSpy).toHaveBeenCalledWith('Response:', undefined);
            consoleSpy.mockRestore();
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

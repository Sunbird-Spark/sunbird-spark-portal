import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import authService, { AuthService } from './AuthService';
import axios from 'axios';

vi.mock('axios');

describe('AuthService', () => {
    // Reset singleton state before each test
    beforeEach(() => {
        vi.clearAllMocks();
        authService.clearAuth();
    });

    it('should maintain singleton instance', () => {
        const instance1 = AuthService.getInstance();
        const instance2 = AuthService.getInstance();
        expect(instance1).toBe(instance2);
        expect(instance1).toBe(authService);
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
            }
        };

        const mockAnonymousResponse = {
            data: {
                params: { status: 'successful' },
                result: {
                    sid: 'session-789',
                    uid: null,
                    isAuthenticated: false
                }
            }
        };

        it('should successfully fetch auth status and update state', async () => {
            (axios.get as any).mockResolvedValue(mockSuccessResponse);

            const result = await authService.getAuthInfo(mockDeviceId);

            // Check axios call
            expect(axios.get).toHaveBeenCalledWith('/portal/user/v1/auth/info', {
                headers: { 'x-device-id': mockDeviceId },
                withCredentials: true
            });

            // Check result
            expect(result).toEqual(mockSuccessResponse.data.result);

            // Check internal state update
            expect(authService.getSessionId()).toBe('session-123');
            expect(authService.getUserId()).toBe('user-456');
            expect(authService.isUserAuthenticated()).toBe(true);
        });

        it('should handle anonymous user properly', async () => {
            (axios.get as any).mockResolvedValue(mockAnonymousResponse);

            await authService.getAuthInfo(mockDeviceId);

            expect(authService.getSessionId()).toBe('session-789');
            expect(authService.getUserId()).toBeNull();
            expect(authService.isUserAuthenticated()).toBe(false);
        });

        it('should throw error when api returns unsuccessful status', async () => {
            const mockErrorResponse = {
                data: {
                    params: {
                        status: 'failed',
                        errmsg: 'Something went wrong'
                    }
                }
            };
            (axios.get as any).mockResolvedValue(mockErrorResponse);

            await expect(authService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Something went wrong');

            // State should not change
            expect(authService.getSessionId()).toBeNull();
        });

        it('should use default error message when api returns failed status without errmsg', async () => {
            const mockErrorResponse = {
                data: {
                    params: {
                        status: 'failed',
                        errmsg: null
                    }
                }
            };
            (axios.get as any).mockResolvedValue(mockErrorResponse);

            await expect(authService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Failed to fetch auth status');
        });

        it('should throw error when axios fails', async () => {
            const networkError = new Error('Network Error');
            (axios.get as any).mockRejectedValue(networkError);

            await expect(authService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Network Error');
        });

        it('should log detailed error info if axios error has response', async () => {
            const axiosError = {
                isAxiosError: true,
                response: {
                    status: 400,
                    data: { message: 'Bad Request' }
                }
            };
            (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);
            (axios.get as any).mockRejectedValue(axiosError);

            // Spy on console.error to verify logging
            const consoleSpy = vi.spyOn(console, 'error');

            try {
                await authService.getAuthInfo(mockDeviceId);
            } catch (e) {
                // Expected error
            }

            expect(consoleSpy).toHaveBeenCalledWith('❌ Error fetching auth status:', axiosError);
            expect(consoleSpy).toHaveBeenCalledWith('   Status:', 400);
        });
    });

    describe('State Management', () => {
        it('should return null for initial getters', () => {
            expect(authService.getSessionId()).toBeNull();
            expect(authService.getUserId()).toBeNull();
            expect(authService.isUserAuthenticated()).toBe(false);
        });

        it('should clear auth data correctly', async () => {
            // Setup state
            const mockResponse = {
                data: {
                    params: { status: 'successful' },
                    result: { sid: 's1', uid: 'u1', isAuthenticated: true }
                }
            };
            (axios.get as any).mockResolvedValue(mockResponse);
            await authService.getAuthInfo('d1');

            expect(authService.isUserAuthenticated()).toBe(true);

            // Clear
            authService.clearAuth();

            // Verify reset
            expect(authService.getSessionId()).toBeNull();
            expect(authService.getUserId()).toBeNull();
            expect(authService.isUserAuthenticated()).toBe(false);
        });
    });
});

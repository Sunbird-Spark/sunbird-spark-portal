import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userAuthInfoService, { userAuthInfoService as UserAuthInfoServiceClass } from './userAuthInfoService';
import axios from 'axios';

vi.mock('axios');

describe('userAuthInfoService', () => {
    // Reset singleton state before each test
    beforeEach(() => {
        vi.clearAllMocks();
        userAuthInfoService.clearAuth();
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

            const result = await userAuthInfoService.getAuthInfo(mockDeviceId);

            // Check axios call
            expect(axios.get).toHaveBeenCalledWith('/portal/user/v1/auth/info', {
                headers: { 'x-device-id': mockDeviceId },
                withCredentials: true
            });

            // Check result
            expect(result).toEqual(mockSuccessResponse.data.result);

            // Check internal state update
            expect(userAuthInfoService.getSessionId()).toBe('session-123');
            expect(userAuthInfoService.getUserId()).toBe('user-456');
            expect(userAuthInfoService.isUserAuthenticated()).toBe(true);
        });

        it('should handle anonymous user properly', async () => {
            (axios.get as any).mockResolvedValue(mockAnonymousResponse);

            await userAuthInfoService.getAuthInfo(mockDeviceId);

            expect(userAuthInfoService.getSessionId()).toBe('session-789');
            expect(userAuthInfoService.getUserId()).toBeNull();
            expect(userAuthInfoService.isUserAuthenticated()).toBe(false);
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
                }
            };
            (axios.get as any).mockResolvedValue(mockErrorResponse);

            await expect(userAuthInfoService.getAuthInfo(mockDeviceId))
                .rejects.toThrow('Failed to fetch auth status');
        });

        it('should throw error when axios fails', async () => {
            const networkError = new Error('Network Error');
            (axios.get as any).mockRejectedValue(networkError);

            await expect(userAuthInfoService.getAuthInfo(mockDeviceId))
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
                await userAuthInfoService.getAuthInfo(mockDeviceId);
            } catch (e) {
                // Expected error
            }

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching auth status:', axiosError);
            expect(consoleSpy).toHaveBeenCalledWith('   Status:', 400);
            expect(consoleSpy).toHaveBeenCalledWith('   Data:', axiosError.response.data);
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
                }
            };
            (axios.get as any).mockResolvedValue(mockResponse);
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

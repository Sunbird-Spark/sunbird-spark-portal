import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { Request } from 'express';
import { refreshSessionTTL, generateKongToken, generateLoggedInKongToken } from './kongAuthService.js';
import logger from '../utils/logger.js';

vi.mock('axios');
const mockedAxiosPost = vi.mocked(axios.post);

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        KONG_ANONYMOUS_DEVICE_REGISTER_API: 'http://localhost:8000/auth/v1/anonymous/register',
        KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'test-anonymous-bearer-token',
        SUNBIRD_ANONYMOUS_SESSION_TTL: 60000,
        KONG_LOGGEDIN_DEVICE_REGISTER_API: 'http://localhost:8000/auth/v1/loggedin/register',
        KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN: 'test-loggedin-bearer-token',
        SUNBIRD_LOGGEDIN_SESSION_TTL: 120000,
        KONG_LOGGEDIN_FALLBACK_TOKEN: 'fallback-loggedin-token'
    }
}));

describe('Kong Auth Service', () => {
    let mockRequest: Partial<Request>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRequest = {
            sessionID: 'test-session-id',
            session: {
                userId: undefined,
                kongToken: undefined,
                cookie: {
                    maxAge: undefined,
                    expires: undefined
                },
                save: vi.fn((callback) => callback()),
                regenerate: vi.fn(),
                destroy: vi.fn(),
                reload: vi.fn(),
                id: 'test-session-id',
                touch: vi.fn()
            } as any,
            protocol: 'http',
            get: vi.fn().mockImplementation((header: string) => {
                if (header === 'host') return 'localhost:3000';
                return undefined;
            }) as any
        };
    });

    describe('refreshSessionTTL', () => {
        it('should set logged-in session TTL when userId exists', () => {
            mockRequest.session!.userId = 'test-user-id';

            refreshSessionTTL(mockRequest as Request);

            expect(mockRequest.session!.cookie.maxAge).toBe(120000);
            expect(mockRequest.session!.cookie.expires).toBeInstanceOf(Date);
        });

        it('should set anonymous session TTL when userId does not exist', () => {
            mockRequest.session!.userId = undefined;

            refreshSessionTTL(mockRequest as Request);

            expect(mockRequest.session!.cookie.maxAge).toBe(60000);
            expect(mockRequest.session!.cookie.expires).toBeInstanceOf(Date);
        });
    });

    describe('generateKongToken', () => {
        it('should successfully generate Kong token for anonymous user', async () => {
            const successResponse = {
                data: {
                    params: { status: 'successful' },
                    result: { token: 'new-anonymous-token' }
                }
            };
            mockedAxiosPost.mockResolvedValue(successResponse);

            const token = await generateKongToken(mockRequest as Request);

            expect(token).toBe('new-anonymous-token');
            expect(mockedAxiosPost).toHaveBeenCalledWith(
                'http://localhost:8000/auth/v1/anonymous/register',
                { request: { key: 'test-session-id' } },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-anonymous-bearer-token'
                    }
                }
            );
        });

        it('should throw error when device registration configuration is missing', async () => {
            vi.resetModules();
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_ANONYMOUS_DEVICE_REGISTER_API: undefined,
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: undefined
                }
            }));

            // Re-import the function with the new mock
            const { generateKongToken } = await import('./kongAuthService.js');

            await expect(generateKongToken(mockRequest as Request))
                .rejects.toThrow('Device registration configuration missing');
        });

        it('should throw error when session ID is missing', async () => {
            mockRequest.sessionID = undefined;

            await expect(generateKongToken(mockRequest as Request))
                .rejects.toThrow('Session ID is missing');
        });

        it('should throw error when API response status is not successful', async () => {
            const failureResponse = {
                data: {
                    params: { status: 'failed' },
                    result: {}
                }
            };
            mockedAxiosPost.mockResolvedValue(failureResponse);

            await expect(generateKongToken(mockRequest as Request))
                .rejects.toThrow('ANONYMOUS_KONG_TOKEN :: Anonymous Kong token generation failed with an unsuccessful response status');
        });

        it('should throw error when token is not found in successful response', async () => {
            const responseWithoutToken = {
                data: {
                    params: { status: 'successful' },
                    result: {}
                }
            };
            mockedAxiosPost.mockResolvedValue(responseWithoutToken);

            await expect(generateKongToken(mockRequest as Request))
                .rejects.toThrow('ANONYMOUS_KONG_TOKEN :: Token not found in response');
        });
    });

    describe('generateLoggedInKongToken', () => {
        it('should refresh session TTL and return early when kong token already exists', async () => {
            mockRequest.session!.kongToken = 'existing-token';
            const saveSpy = vi.spyOn(mockRequest.session!, 'save');

            await generateLoggedInKongToken(mockRequest as Request);

            expect(saveSpy).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('LOGGEDIN_KONG_TOKEN :: session saved successfully with ID: test-session-id');
            expect(mockedAxiosPost).not.toHaveBeenCalled();
        });

        it('should successfully generate logged-in Kong token', async () => {
            const successResponse = {
                data: {
                    params: { status: 'successful' },
                    result: { token: 'new-loggedin-token' }
                }
            };
            mockedAxiosPost.mockResolvedValue(successResponse);
            const saveSpy = vi.spyOn(mockRequest.session!, 'save');

            await generateLoggedInKongToken(mockRequest as Request);

            expect(logger.info).toHaveBeenCalledWith('LOGGEDIN_KONG_TOKEN :: requesting logged-in token from Kong');
            expect(mockRequest.session!.kongToken).toBe('new-loggedin-token');
            expect(mockRequest.session!['auth_redirect_uri']).toBe('http://localhost:3000/resources?auth_callback=1');
            expect(saveSpy).toHaveBeenCalled();
            expect(mockedAxiosPost).toHaveBeenCalledWith(
                'http://localhost:8000/auth/v1/loggedin/register',
                { request: { key: 'test-session-id' } },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-loggedin-bearer-token'
                    }
                }
            );
        });

        it('should use fallback token when API configuration is missing', async () => {
            // Reset modules and re-mock the config
            vi.resetModules();
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_LOGGEDIN_DEVICE_REGISTER_API: undefined,
                    KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN: undefined,
                    KONG_LOGGEDIN_FALLBACK_TOKEN: 'fallback-token'
                }
            }));

            const { generateLoggedInKongToken } = await import('./kongAuthService.js');
            const saveSpy = vi.spyOn(mockRequest.session!, 'save');

            await generateLoggedInKongToken(mockRequest as Request);

            expect(mockRequest.session!.kongToken).toBe('fallback-token');
            expect(saveSpy).toHaveBeenCalled();
            expect(mockedAxiosPost).not.toHaveBeenCalled();
        });

        it('should use fallback token when session ID is missing', async () => {
            mockRequest.sessionID = undefined;
            const saveSpy = vi.spyOn(mockRequest.session!, 'save');

            await generateLoggedInKongToken(mockRequest as Request);

            expect(mockRequest.session!.kongToken).toBe('fallback-loggedin-token');
            expect(logger.error).toHaveBeenCalledWith(
                'LOGGEDIN_KONG_TOKEN :: token generation failed for session undefined',
                expect.any(Error)
            );
            expect(saveSpy).toHaveBeenCalled();
        });

        it('should use fallback token when API call fails', async () => {
            mockedAxiosPost.mockRejectedValue(new Error('Network error'));
            const saveSpy = vi.spyOn(mockRequest.session!, 'save');

            await generateLoggedInKongToken(mockRequest as Request);

            expect(mockRequest.session!.kongToken).toBe('fallback-loggedin-token');
            expect(logger.error).toHaveBeenCalledWith(
                'LOGGEDIN_KONG_TOKEN :: token generation failed for session test-session-id',
                expect.any(Error)
            );
            expect(saveSpy).toHaveBeenCalled();
        });

        it('should use fallback token when API response status is not successful', async () => {
            const failureResponse = {
                data: {
                    params: { status: 'failed' },
                    result: {}
                }
            };
            mockedAxiosPost.mockResolvedValue(failureResponse);
            const saveSpy = vi.spyOn(mockRequest.session!, 'save');

            await generateLoggedInKongToken(mockRequest as Request);

            expect(mockRequest.session!.kongToken).toBe('fallback-loggedin-token');
            expect(saveSpy).toHaveBeenCalled();
        });

        it('should handle session save error', async () => {
            const saveError = new Error('Session save failed');
            mockRequest.session!.save = vi.fn((callback) => callback(saveError));

            await expect(generateLoggedInKongToken(mockRequest as Request))
                .rejects.toThrow('Session save failed');

            expect(logger.error).toHaveBeenCalledWith(
                'LOGGEDIN_KONG_TOKEN :: failed to save session',
                saveError
            );
        });
    });
});
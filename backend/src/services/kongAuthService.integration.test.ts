import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { Request } from 'express';
import { refreshSessionTTL, generateKongToken, generateLoggedInKongToken } from './kongAuthService.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';

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
        KONG_URL: 'http://localhost:8000',
        KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'test-anonymous-bearer-token',
        SUNBIRD_ANONYMOUS_SESSION_TTL: 60000,
        KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN: 'test-loggedin-bearer-token',
        KONG_LOGGEDIN_FALLBACK_TOKEN: 'fallback-loggedin-token',
        KEYCLOAK_BASE_SERVER_URL: 'http://localhost:8080'
    }
}));

vi.mock('../utils/sessionTTLUtil.js', () => ({
    setSessionTTLFromToken: vi.fn().mockImplementation((req: any) => {
        req.session.cookie.maxAge = 120000;
        req.session.cookie.expires = new Date(Date.now() + 120000);
    })
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
                cookie: { maxAge: undefined, expires: undefined },
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
        it('should call setSessionTTLFromToken for logged-in users', () => {
            mockRequest.session!.userId = 'test-user-id';
            refreshSessionTTL(mockRequest as Request);

            expect(setSessionTTLFromToken).toHaveBeenCalledWith(mockRequest);
            expect(mockRequest.session!.cookie.maxAge).toBe(120000);
        });

        it('should set anonymous session TTL for non-logged-in users', () => {
            mockRequest.session!.userId = undefined;
            refreshSessionTTL(mockRequest as Request);

            expect(setSessionTTLFromToken).not.toHaveBeenCalled();
            expect(mockRequest.session!.cookie.maxAge).toBe(60000);
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
                'http://localhost:8000/api-manager/v2/consumer/portal_anonymous/credential/register',
                { request: { key: 'test-session-id' } },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-anonymous-bearer-token'
                    }
                }
            );
        });

        it('should throw error when configuration is missing', async () => {
            vi.resetModules();
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_URL: undefined,
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: undefined
                }
            }));

            const { generateKongToken } = await import('./kongAuthService.js');
            await expect(generateKongToken(mockRequest as Request))
                .rejects.toThrow('Device registration configuration missing');
        });

        it('should throw error when API response fails', async () => {
            const failureResponse = {
                data: { params: { status: 'failed' }, result: {} }
            };
            mockedAxiosPost.mockResolvedValue(failureResponse);

            await expect(generateKongToken(mockRequest as Request))
                .rejects.toThrow('ANONYMOUS_KONG_TOKEN :: Anonymous Kong token generation failed with an unsuccessful response status');
        });
    });

    describe('generateLoggedInKongToken', () => {
        it('should return early when kong token already exists', async () => {
            mockRequest.session!.kongToken = 'existing-token';
            await generateLoggedInKongToken(mockRequest as Request);
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

            await generateLoggedInKongToken(mockRequest as Request);

            expect(mockRequest.session!.kongToken).toBe('new-loggedin-token');
            expect(mockedAxiosPost).toHaveBeenCalledWith(
                'http://localhost:8000/api-manager/v2/consumer/portal_loggedin/credential/register',
                { request: { key: 'test-session-id' } },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-loggedin-bearer-token'
                    }
                }
            );
        });

        it('should use fallback token when API fails', async () => {
            mockedAxiosPost.mockRejectedValue(new Error('Network error'));
            await generateLoggedInKongToken(mockRequest as Request);
            expect(mockRequest.session!.kongToken).toBe('fallback-loggedin-token');
        });

        it('should handle session save error', async () => {
            const saveError = new Error('Session save failed');
            vi.resetModules();
            vi.doMock('../utils/sessionUtils.js', () => ({
                saveSession: vi.fn().mockRejectedValue(saveError)
            }));
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_URL: 'http://localhost:8000',
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'test-anonymous-bearer-token',
                    SUNBIRD_ANONYMOUS_SESSION_TTL: 60000,
                    KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN: 'test-loggedin-bearer-token',
                    KONG_LOGGEDIN_FALLBACK_TOKEN: 'fallback-loggedin-token'
                }
            }));

            const { generateLoggedInKongToken } = await import('./kongAuthService.js');
            await expect(generateLoggedInKongToken(mockRequest as Request))
                .rejects.toThrow('Session save failed');
        });
    });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { Request } from 'express';
import { refreshSessionTTL, generateKongToken, generateLoggedInKongToken, saveKongTokenToSession } from './kongAuthService.js';
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
        KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-anonymous-token',
        DOMAIN_URL: 'http://localhost:8080'
    }
}));

vi.mock('../utils/sessionTTLUtil.js', () => ({
    setSessionTTLFromToken: vi.fn().mockImplementation((req: any) => {
        req.session.cookie.maxAge = 120000;
        req.session.cookie.expires = new Date(Date.now() + 120000);
    })
}));

vi.mock('../utils/sessionUtils.js', () => ({
    saveSession: vi.fn().mockResolvedValue(undefined)
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
            mockRequest.kauth = { grant: { access_token: { content: { exp: 1234567890 } } } } as any;
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
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: undefined,
                    KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-anonymous-token'
                }
            }));

            const { generateKongToken } = await import('./kongAuthService.js');
            await expect(generateKongToken(mockRequest as Request)).rejects.toThrow('Device registration configuration missing');
        });

        it('should throw error when API response fails', async () => {
            const failureResponse = {
                data: { params: { status: 'failed' }, result: {} }
            };
            mockedAxiosPost.mockResolvedValue(failureResponse);

            await expect(generateKongToken(mockRequest as Request)).rejects.toThrow('ANONYMOUS_KONG_TOKEN :: Anonymous Kong token generation failed with an unsuccessful response status');
        });
    });

    describe('generateLoggedInKongToken', () => {
        it('should successfully generate logged-in Kong token without saving to session', async () => {
            const successResponse = {
                data: {
                    params: { status: 'successful' },
                    result: { token: 'new-loggedin-token' }
                }
            };
            mockedAxiosPost.mockResolvedValue(successResponse);

            const token = await generateLoggedInKongToken(mockRequest as Request);

            expect(token).toBe('new-loggedin-token');
            expect(mockRequest.session!.kongToken).toBeUndefined();
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

        it('should return fallback token when API fails', async () => {
            mockedAxiosPost.mockRejectedValue(new Error('Network error'));
            const token = await generateLoggedInKongToken(mockRequest as Request);
            expect(token).toBe('fallback-loggedin-token');
        });
    });

    describe('saveKongTokenToSession', () => {
        it('should save token to session and refresh TTL', async () => {
            mockRequest.session!.userId = 'test-user-id'; // Add userId to trigger setSessionTTLFromToken
            mockRequest.kauth = { grant: { access_token: { content: { exp: 1234567890 } } } } as any;
            const token = 'test-token';
            await saveKongTokenToSession(mockRequest as Request, token);

            expect(mockRequest.session!.kongToken).toBe(token);
            expect(setSessionTTLFromToken).toHaveBeenCalledWith(mockRequest);
        });
    });
});
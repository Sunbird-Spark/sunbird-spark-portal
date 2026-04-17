import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request } from 'express';
import * as http from 'http';

vi.mock('./logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('proxyUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    const importProxyUtils = async (overrideEnv?: {
        KONG_ANONYMOUS_FALLBACK_TOKEN?: string;
        APPID?: string;
    }) => {
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                KONG_ANONYMOUS_FALLBACK_TOKEN: overrideEnv?.KONG_ANONYMOUS_FALLBACK_TOKEN || 'fallback-token',
                APPID: overrideEnv?.APPID || 'test-app-id'
            }
        }));
        return await import('./proxyUtils.js');
    };

    describe('getUserToken', () => {
        it('should return Kong-issued userAccessToken when available', async () => {
            const { getUserToken } = await importProxyUtils();
            const mockReq = {
                session: { userAccessToken: 'kong-access-token' },
                oidc: { isAuthenticated: true, accessToken: 'oidc-token' }
            } as any;

            const result = getUserToken(mockReq as Request);
            expect(result).toBe('kong-access-token');
        });

        it('should fall back to OIDC access token when userAccessToken is not set', async () => {
            const { getUserToken } = await importProxyUtils();
            const mockReq = {
                session: {},
                oidc: {
                    isAuthenticated: true,
                    accessToken: 'oidc-token'
                }
            } as any;

            const result = getUserToken(mockReq as Request);
            expect(result).toBe('oidc-token');
        });

        it('should return undefined when access token is missing', async () => {
            const { getUserToken } = await importProxyUtils();
            const mockReq = {
                session: {}
            } as Partial<Request>;

            const result = getUserToken(mockReq as Request);
            expect(result).toBeUndefined();
        });

        it('should return undefined when request has no auth context', async () => {
            const { getUserToken } = await importProxyUtils();
            const mockReq = {} as Partial<Request>;

            const result = getUserToken(mockReq as Request);
            expect(result).toBeUndefined();
        });

        it('should not use env fallback token for getUserToken', async () => {
            const { getUserToken } = await importProxyUtils({
                KONG_ANONYMOUS_FALLBACK_TOKEN: 'custom-fallback'
            });
            const mockReq = {} as Partial<Request>;

            const result = getUserToken(mockReq as Request);
            expect(result).toBeUndefined();
        });
    });

    describe('getBearerToken', () => {
        it('should return session kongToken when available', async () => {
            const { getBearerToken } = await importProxyUtils();
            const mockReq = {
                session: { kongToken: 'bearer-token' }
            } as Partial<Request>;

            const result = getBearerToken(mockReq as Request);
            expect(result).toBe('bearer-token');
        });

        it('should return anonymous fallback token when session token is missing and user is not authenticated', async () => {
            const { getBearerToken } = await importProxyUtils();
            const mockReq = {
                session: {}
            } as Partial<Request>;

            const result = getBearerToken(mockReq as Request);
            expect(result).toBe('fallback-token');
        });

        it('should return logged-in fallback token when session token is missing but user is authenticated', async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_ANONYMOUS_FALLBACK_TOKEN: 'anon-fallback',
                    KONG_LOGGEDIN_FALLBACK_TOKEN: 'loggedin-fallback',
                    APPID: 'test-app-id'
                }
            }));
            const { getBearerToken } = await import('./proxyUtils.js');
            const mockReq = {
                session: { userId: 'user-123' }
            } as Partial<Request>;

            const result = getBearerToken(mockReq as Request);
            expect(result).toBe('loggedin-fallback');
        });
    });

    describe('decorateRequestHeaders', () => {
        it('should set all required headers when session data exists', async () => {
            const { decorateRequestHeaders } = await importProxyUtils();
            const mockProxyReq = {
                setHeader: vi.fn()
            } as unknown as http.ClientRequest;

            const mockReq = {
                session: {
                    kongToken: 'test-token',
                    userId: 12345,
                    rootOrghashTagId: 'org-channel',
                    managedToken: 'managed-token'
                },
                sessionID: 'session-123',
                get: vi.fn().mockReturnValue(undefined)
            } as unknown as Request;

            decorateRequestHeaders(mockProxyReq, mockReq);

            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Session-Id', 'session-123');
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Channel-Id', 'org-channel');
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Authenticated-Userid', 12345);
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-App-Id', 'test-app-id');
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('x-authenticated-for', 'managed-token');
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
        });

        it('should not set X-Session-Id when both sessionID and header are missing', async () => {
            const { decorateRequestHeaders } = await importProxyUtils();
            const mockProxyReq = { setHeader: vi.fn() } as unknown as http.ClientRequest;
            const mockReq = { session: {}, sessionID: undefined, get: vi.fn().mockReturnValue(undefined) } as unknown as Request;
            decorateRequestHeaders(mockProxyReq, mockReq);
            expect(mockProxyReq.setHeader).not.toHaveBeenCalledWith('X-Session-Id', expect.anything());
        });

        it('should not set X-Channel-Id when both session and header are missing', async () => {
            const { decorateRequestHeaders } = await importProxyUtils();
            const mockProxyReq = { setHeader: vi.fn() } as unknown as http.ClientRequest;
            const mockReq = { session: {}, sessionID: 'session-123', get: vi.fn().mockReturnValue(undefined) } as unknown as Request;
            decorateRequestHeaders(mockProxyReq, mockReq);
            expect(mockProxyReq.setHeader).not.toHaveBeenCalledWith('X-Channel-Id', expect.anything());
        });

        it('should always set Connection keep-alive', async () => {
            const { decorateRequestHeaders } = await importProxyUtils();
            const mockProxyReq = { setHeader: vi.fn() } as unknown as http.ClientRequest;
            const mockReq = { session: {}, sessionID: 'session-123', get: vi.fn().mockReturnValue(undefined) } as unknown as Request;
            decorateRequestHeaders(mockProxyReq, mockReq);
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
        });

        it('should set authenticated user tokens when OIDC token is present', async () => {
            const { decorateRequestHeaders } = await importProxyUtils();
            const mockProxyReq = { setHeader: vi.fn() } as unknown as http.ClientRequest;
            const mockReq = {
                session: {},
                oidc: { isAuthenticated: true, accessToken: 'oidc-token' },
                sessionID: 'session-123',
                get: vi.fn().mockReturnValue(undefined)
            } as unknown as any;
            decorateRequestHeaders(mockProxyReq, mockReq);
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('x-authenticated-user-token', 'oidc-token');
            expect(mockProxyReq.setHeader).toHaveBeenCalledWith('x-auth-token', 'oidc-token');
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { oidcSession, requireAuth } from './oidcMiddleware.js';

vi.mock('./oidcProvider.js', () => ({
    getPortalOIDCConfig: vi.fn(),
    decodeJwtPayload: vi.fn((token: string) => {
        if (token === 'valid-access-token') {
            return { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 };
        }
        if (token === 'expired-access-token') {
            return { sub: 'user123', exp: Math.floor(Date.now() / 1000) - 100 };
        }
        if (token === 'valid-refresh-token') {
            return { exp: Math.floor(Date.now() / 1000) + 7200 };
        }
        return null;
    })
}));

vi.mock('openid-client', () => ({
    refreshTokenGrant: vi.fn()
}));

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

describe('oidcMiddleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            session: {} as any,
            headers: {}
        };
        mockRes = {
            redirect: vi.fn(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
    });

    describe('oidcSession', () => {
        it('should set isAuthenticated to false when no tokens in session', async () => {
            const middleware = oidcSession();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.oidc).toEqual({ isAuthenticated: false });
            expect(mockNext).toHaveBeenCalled();
        });

        it('should set isAuthenticated to true with valid access token', async () => {
            mockReq.session = {
                'oidc-tokens': {
                    access_token: 'valid-access-token',
                    refresh_token: 'valid-refresh-token',
                }
            } as any;

            const middleware = oidcSession();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.oidc?.isAuthenticated).toBe(true);
            expect(mockReq.oidc?.accessToken).toBe('valid-access-token');
            expect(mockReq.oidc?.tokenClaims?.sub).toBe('user123');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should refresh expired access token when refresh token is available', async () => {
            const { refreshTokenGrant } = await import('openid-client');
            (refreshTokenGrant as any).mockResolvedValue({
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                id_token: 'new-id-token',
            });

            mockReq.session = {
                'oidc-tokens': {
                    access_token: 'expired-access-token',
                    refresh_token: 'valid-refresh-token',
                },
                save: vi.fn((cb: any) => cb && cb(null)),
            } as any;

            const middleware = oidcSession();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(refreshTokenGrant).toHaveBeenCalled();
            expect(mockReq.oidc?.isAuthenticated).toBe(true);
            expect(mockReq.oidc?.accessToken).toBe('new-access-token');
            expect((mockReq.session as any)['oidc-tokens'].access_token).toBe('new-access-token');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should clear auth state when token refresh fails', async () => {
            const { refreshTokenGrant } = await import('openid-client');
            (refreshTokenGrant as any).mockRejectedValue(new Error('refresh failed'));

            mockReq.session = {
                'oidc-tokens': {
                    access_token: 'expired-access-token',
                    refresh_token: 'valid-refresh-token',
                },
                save: vi.fn((cb: any) => cb && cb(null)),
            } as any;

            const middleware = oidcSession();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.oidc?.isAuthenticated).toBe(false);
            expect((mockReq.session as any)['oidc-tokens']).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not refresh when access token is still valid', async () => {
            const { refreshTokenGrant } = await import('openid-client');

            mockReq.session = {
                'oidc-tokens': {
                    access_token: 'valid-access-token',
                    refresh_token: 'valid-refresh-token',
                },
                save: vi.fn((cb: any) => cb && cb(null)),
            } as any;

            const middleware = oidcSession();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(refreshTokenGrant).not.toHaveBeenCalled();
            expect(mockReq.oidc?.isAuthenticated).toBe(true);
            expect(mockReq.oidc?.accessToken).toBe('valid-access-token');
        });

        it('should handle missing session gracefully', async () => {
            mockReq.session = undefined as any;

            const middleware = oidcSession();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.oidc).toEqual({ isAuthenticated: false });
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('requireAuth', () => {
        it('should call next when user is authenticated', () => {
            mockReq.oidc = { isAuthenticated: true, accessToken: 'token' };

            const middleware = requireAuth();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });

        it('should redirect to login when user is not authenticated (browser request)', () => {
            mockReq.oidc = { isAuthenticated: false };
            mockReq.headers = { accept: 'text/html' };

            const middleware = requireAuth();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.redirect).toHaveBeenCalledWith('/portal/login?prompt=none');
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should redirect to login when oidc is not set (browser request)', () => {
            mockReq.headers = { accept: 'text/html' };

            const middleware = requireAuth();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.redirect).toHaveBeenCalledWith('/portal/login?prompt=none');
        });

        it('should return 401 JSON when unauthenticated XHR request (X-Requested-With header)', () => {
            mockReq.oidc = { isAuthenticated: false };
            mockReq.headers = { 'x-requested-with': 'XMLHttpRequest' };

            const middleware = requireAuth();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
            expect(mockRes.redirect).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 JSON when unauthenticated API request (Accept: application/json)', () => {
            mockReq.oidc = { isAuthenticated: false };
            mockReq.headers = { accept: 'application/json, text/plain, */*' };

            const middleware = requireAuth();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
            expect(mockRes.redirect).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});

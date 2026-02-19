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
            session: {} as any
        };
        mockRes = {
            redirect: vi.fn()
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

        it('should redirect to login when user is not authenticated', () => {
            mockReq.oidc = { isAuthenticated: false };

            const middleware = requireAuth();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.redirect).toHaveBeenCalledWith('/portal/login');
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should redirect to login when oidc is not set', () => {
            const middleware = requireAuth();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.redirect).toHaveBeenCalledWith('/portal/login');
        });
    });
});

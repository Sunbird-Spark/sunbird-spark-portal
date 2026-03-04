import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

vi.mock('openid-client', () => ({
    randomPKCECodeVerifier: vi.fn(() => 'mock-code-verifier'),
    calculatePKCECodeChallenge: vi.fn(() => Promise.resolve('mock-code-challenge')),
    buildAuthorizationUrl: vi.fn(() => new URL('https://oidc-provider.example.com/auth?client_id=portal')),
    authorizationCodeGrant: vi.fn(() => Promise.resolve({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        id_token: 'mock-id-token',
    })),
    buildEndSessionUrl: vi.fn(() => new URL('https://oidc-provider.example.com/logout?post_logout_redirect_uri=http://localhost:3000/')),
}));

vi.mock('../auth/oidcProvider.js', () => ({
    getPortalOIDCConfig: vi.fn(() => Promise.resolve({})),
    decodeJwtPayload: vi.fn((token: string) => {
        if (token === 'mock-access-token') {
            return { sub: 'f:keycloak:user123', exp: Math.floor(Date.now() / 1000) + 3600 };
        }
        return null;
    }),
}));

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../utils/sessionUtils.js', () => ({
    regenerateSession: vi.fn(),
    regenerateAnonymousSession: vi.fn(),
    saveSession: vi.fn()
}));

vi.mock('../utils/sessionTTLUtil.js', () => ({
    setSessionTTLFromToken: vi.fn()
}));

vi.mock('../services/userService.js', () => ({
    fetchUserById: vi.fn(),
    setUserSession: vi.fn()
}));

vi.mock('../middlewares/conditionalSession.js', () => ({
    sessionMiddleware: (req: Request, res: Response, next: NextFunction) => {
        if (!req.session) {
            // @ts-ignore
            req.session = {};
        }
        next();
    }
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        DEVELOPMENT_REACT_APP_URL: 'http://localhost:3000',
        DOMAIN_URL: 'http://domain.com',
        PORTAL_REALM: 'realm',
        SERVER_URL: 'http://server.com'
    }
}));

describe('PortalAuthRoutes Integration', () => {
    const setupApp = async (customMiddleware?: express.RequestHandler) => {
        vi.resetModules();
        const portalAuthRoutes = (await import('./portalAuthRoutes.js')).default;

        const app = express();

        if (customMiddleware) {
            app.use(customMiddleware);
        } else {
            app.use((req, res, next) => {
                // @ts-ignore
                req.session = {
                    oidcCodeVerifier: 'mock-code-verifier',
                    oidcState: 'test-state',
                };
                next();
            });
        }

        app.use('/portal', portalAuthRoutes);
        return app;
    };

    describe('GET /portal/login', () => {
        it('should redirect to home if user is already authenticated', async () => {
            const app = await setupApp((req: Request, res, next) => {
                // @ts-ignore
                req.session = { 'oidc-tokens': { access_token: 'some-token' } };
                next();
            });

            const res = await request(app).get('/portal/login');
            expect(res.status).toBe(302);
            expect(res.header.location).toBe('http://localhost:3000/home');
        });

        it('should redirect to OIDC provider if not authenticated', async () => {
            const app = await setupApp();

            const res = await request(app).get('/portal/login');
            expect(res.status).toBe(302);
            expect(res.header.location).toContain('oidc-provider.example.com');
        });
    });

    describe('GET /portal/auth/callback', () => {
        it('should restart login flow if no code is present', async () => {
            const app = await setupApp();
            const res = await request(app).get('/portal/auth/callback');
            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/portal/login?prompt=none');
        });

        it('should exchange code and redirect to home on success', async () => {
            const app = await setupApp();

            const sessionUtils = await import('../utils/sessionUtils.js');
            vi.mocked(sessionUtils.regenerateSession).mockResolvedValue(undefined);
            vi.mocked(sessionUtils.saveSession).mockResolvedValue(undefined);

            const res = await request(app).get('/portal/auth/callback?code=123&state=test-state');

            expect(res.status).toBe(302);
            expect(res.header.location).toBe('http://localhost:3000/home');
            expect(sessionUtils.regenerateSession).toHaveBeenCalled();
        });

        it('should fetch user session if token has subject', async () => {
            const app = await setupApp();

            const sessionUtils = await import('../utils/sessionUtils.js');
            const userService = await import('../services/userService.js');

            vi.mocked(sessionUtils.regenerateSession).mockResolvedValue(undefined);
            vi.mocked(sessionUtils.saveSession).mockResolvedValue(undefined);
            vi.mocked(userService.fetchUserById).mockResolvedValue({} as any);
            vi.mocked(userService.setUserSession).mockResolvedValue(undefined);

            await request(app).get('/portal/auth/callback?code=123&state=test-state');

            expect(userService.fetchUserById).toHaveBeenCalledWith('user123', expect.anything());
            expect(userService.setUserSession).toHaveBeenCalled();
        });

        it('should redirect to root on error', async () => {
            const app = await setupApp();
            const sessionUtils = await import('../utils/sessionUtils.js');
            vi.mocked(sessionUtils.regenerateSession).mockRejectedValue(new Error('Session error'));
            vi.mocked(sessionUtils.saveSession).mockResolvedValue(undefined);

            const res = await request(app).get('/portal/auth/callback?code=123&state=test-state');

            expect(res.status).toBe(302);
            expect(res.header.location).toBe('http://localhost:3000');
        });

        it('should redirect to root if no session exists', async () => {
            const app = await setupApp((req: Request, res, next) => {
                // @ts-ignore
                req.session = null;
                next();
            });

            const { authorizationCodeGrant } = await import('openid-client');
            vi.mocked(authorizationCodeGrant).mockRejectedValueOnce(new Error('No session'));

            const res = await request(app).get('/portal/auth/callback?code=123');
            expect(res.status).toBe(302);
        });
    });

    describe('ALL /portal/logout', () => {
        it('should regenerate anonymous session and redirect to OIDC logout', async () => {
            const app = await setupApp();
            const sessionUtils = await import('../utils/sessionUtils.js');
            vi.mocked(sessionUtils.regenerateAnonymousSession).mockResolvedValue(undefined);

            const res = await request(app).get('/portal/logout');

            expect(sessionUtils.regenerateAnonymousSession).toHaveBeenCalled();
            expect(res.status).toBe(302);
            expect(res.header.location).toContain('oidc-provider.example.com/logout');
        });

        it('should redirect to root on error', async () => {
            const app = await setupApp();
            const sessionUtils = await import('../utils/sessionUtils.js');
            const { buildEndSessionUrl } = await import('openid-client');

            vi.mocked(sessionUtils.regenerateAnonymousSession).mockRejectedValue(new Error('Logout error'));
            vi.mocked(buildEndSessionUrl).mockImplementation(() => {
                throw new Error('Discovery failed');
            });

            const res = await request(app).get('/portal/logout');

            expect(res.status).toBe(302);
            // When buildEndSessionUrl fails, fallback URL is used with domain.com in it
            expect(res.header.location).toContain('domain.com');
        });
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import type { Server } from 'http';

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

describe('kongProxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    const importKongProxy = async (overrideEnv?: { KONG_URL?: string }) => {
        vi.doMock('http-proxy-middleware', () => ({
            createProxyMiddleware: vi.fn(() => (req: any, res: any, next: any) => next()),
            responseInterceptor: vi.fn((handler) => handler),
            fixRequestBody: vi.fn()
        }));
        vi.doMock('../utils/proxyUtils.js', () => ({
            decorateRequestHeaders: vi.fn()
        }));
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                KONG_URL: overrideEnv?.KONG_URL || 'http://localhost:8000',
                KONG_ANONYMOUS_FALLBACK_TOKEN: 'test-token'
            }
        }));
        const module = await import('./kongProxy.js');
        return module.kongProxy;
    };

    it('should create proxy middleware with correct configuration', async () => {
        await importKongProxy();
        const hpm = await import('http-proxy-middleware');

        expect(hpm.createProxyMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false
            })
        );
    });

    it('should use custom KONG_URL when provided', async () => {
        await importKongProxy({ KONG_URL: 'https://custom-kong.example.com' });
        const hpm = await import('http-proxy-middleware');

        expect(hpm.createProxyMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'https://custom-kong.example.com'
            })
        );
    });
});

describe('Kong Proxy Integration', () => {
    let app: express.Application;
    let mockKongServer: express.Application;
    let serverInstance: Server | null = null;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.doUnmock('http-proxy-middleware');
        vi.doUnmock('../utils/proxyUtils.js');
        vi.doUnmock('../utils/logger.js');

        mockKongServer = express();
        mockKongServer.use(express.json());

        mockKongServer.get('/unauthorized', (req: Request, res: Response) => {
            res.status(401).json({ success: false });
        });
        mockKongServer.get('/forbidden', (req: Request, res: Response) => {
            res.status(403).json({ success: false });
        });

        // Catch-all route for other requests
        mockKongServer.use((req: Request, res: Response) => {
            res.status(200).json({
                success: true,
                method: req.method,
                path: req.path,
                headers: {
                    'x-session-id': req.get('X-Session-Id'),
                    'x-channel-id': req.get('X-Channel-Id'),
                    'x-authenticated-userid': req.get('X-Authenticated-Userid'),
                    'x-app-id': req.get('X-App-Id'),
                    'authorization': req.get('Authorization')
                }
            });
        });

        serverInstance = mockKongServer.listen(8888);

        vi.doMock('../config/env.js', () => ({
            envConfig: {
                KONG_URL: 'http://localhost:8888',
                KONG_ANONYMOUS_FALLBACK_TOKEN: 'test-fallback-token',
                APPID: 'test-app',
                SUNBIRD_SESSION_SECRET: 'test-secret',
                ENVIRONMENT: 'test',
                SUNBIRD_ANONYMOUS_SESSION_TTL: 86400000
            }
        }));

        const { kongProxy } = await import('./kongProxy.js');

        app = express();
        app.use(express.json());
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: { httpOnly: true }
        }));

        app.use((req: Request, res: Response, next: NextFunction) => {
            if (req.get('X-Test-Auth')) {
                req.session.kongToken = 'user-session-token';
                req.session.userId = 12345;
                req.session.rootOrghashTagId = 'test-channel';
            }
            next();
        });

        app.all('/portal/*rest', kongProxy);
        app.all('/action/*rest', kongProxy);
    });

    afterEach(() => {
        if (serverInstance) {
            serverInstance.close();
        }
        vi.resetModules();
    });

    it('should proxy request and rewrite /portal to /', async () => {
        const response = await request(app)
            .get('/portal/user/v1/read/user123')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.path).toBe('/user/v1/read/user123');
    });

    it('should forward session token in headers when authenticated', async () => {
        const response = await request(app)
            .post('/portal/data/v1/location/search')
            .set('X-Test-Auth', 'true')
            .send({ query: 'test' })
            .expect(200);

        expect(response.body.headers.authorization).toBe('Bearer user-session-token');
    });

    it('should use fallback token when session token is missing', async () => {
        const response = await request(app)
            .get('/portal/user/v1/read/user123')
            .expect(200);

        expect(response.body.headers.authorization).toBe('Bearer test-fallback-token');
    });

    it('should forward X-Session-Id header', async () => {
        const response = await request(app)
            .get('/portal/user/v1/read/user123')
            .expect(200);

        expect(response.body.headers['x-session-id']).toBeDefined();
    });

    it('should forward X-Channel-Id from session', async () => {
        const response = await request(app)
            .get('/portal/user/v1/read/user123')
            .set('X-Test-Auth', 'true')
            .expect(200);

        expect(response.body.headers['x-channel-id']).toBe('test-channel');
    });

    it('should forward X-Authenticated-Userid when user is authenticated', async () => {
        const response = await request(app)
            .get('/portal/user/v1/read/user123')
            .set('X-Test-Auth', 'true')
            .expect(200);

        expect(response.body.headers['x-authenticated-userid']).toBe('12345');
    });

    it('should set X-App-Id header', async () => {
        const response = await request(app)
            .get('/portal/user/v1/read/user123')
            .expect(200);

        expect(response.body.headers['x-app-id']).toBe('test-app');
    });

    it('should handle POST requests with body', async () => {
        const response = await request(app)
            .post('/portal/data/v1/create')
            .send({ name: 'test', value: 123 })
            .expect(200);

        expect(response.body.method).toBe('POST');
        expect(response.body.success).toBe(true);
    });

    it('should handle query parameters in URL', async () => {
        const response = await request(app)
            .get('/portal/user/v1/exists/email/test@example.com?captchaResponse=xyz')
            .expect(200);

        expect(response.body.success).toBe(true);
    });

    it('should log error on status code greater than 400', async () => {
        const logger = (await import('../utils/logger.js')).default;
        const errorSpy = vi.spyOn(logger, 'error');

        await request(app)
            .get('/portal/unauthorized')
            .expect(401);

        expect(errorSpy).toHaveBeenCalled();
        const call = errorSpy.mock.calls[0];
        expect(call).toBeDefined();
        const messageArg = call ? call[0] : '';
        expect(String(messageArg)).toContain('Error proxying request');
        expect(String(messageArg)).toContain('Status: 401');

        errorSpy.mockRestore();
    });

    it('should log error on 403 Forbidden from upstream', async () => {
        const logger = (await import('../utils/logger.js')).default;
        const errorSpy = vi.spyOn(logger, 'error');

        await request(app)
            .get('/portal/forbidden')
            .expect(403);

        expect(errorSpy).toHaveBeenCalled();
        const call = errorSpy.mock.calls[0];
        expect(call).toBeDefined();
        const messageArg = call ? call[0] : '';
        expect(String(messageArg)).toContain('Error proxying request');
        expect(String(messageArg)).toContain('Status: 403');

        errorSpy.mockRestore();
    });

    it('should proxy /action request and rewrite to /', async () => {
        const response = await request(app)
            .get('/action/data/v1/page/assemble')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.path).toBe('/data/v1/page/assemble');
    });

    it('should handle POST to /action with authenticated user', async () => {
        const response = await request(app)
            .post('/action/content/v1/search')
            .set('X-Test-Auth', 'true')
            .send({ request: { query: 'test' } })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.method).toBe('POST');
        expect(response.body.headers.authorization).toBe('Bearer user-session-token');
    });

    it('should forward session headers for /action routes', async () => {
        const response = await request(app)
            .get('/action/course/v1/hierarchy/do_123')
            .set('X-Test-Auth', 'true')
            .expect(200);

        expect(response.body.headers['x-session-id']).toBeDefined();
        expect(response.body.headers['x-channel-id']).toBe('test-channel');
        expect(response.body.headers['x-authenticated-userid']).toBe('12345');
        expect(response.body.headers['x-app-id']).toBe('test-app');
    });

    it('should use fallback token for unauthenticated /action requests', async () => {
        const response = await request(app)
            .get('/action/data/v1/page/assemble')
            .expect(200);

        expect(response.body.headers.authorization).toBe('Bearer test-fallback-token');
    });

    it('should handle /action routes with query parameters', async () => {
        const response = await request(app)
            .get('/action/content/v1/read/do_123?mode=edit&fields=name,status')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.path).toBe('/content/v1/read/do_123');
    });

    it('should handle telemetry POST to /action', async () => {
        const response = await request(app)
            .post('/action/data/v1/telemetry')
            .send({ events: [{ eid: 'INTERACT' }] })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.method).toBe('POST');
    });
});
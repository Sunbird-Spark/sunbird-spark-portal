import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import type { Server } from 'http';
import { createProxyMiddleware, responseInterceptor, fixRequestBody } from 'http-proxy-middleware';

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

describe('viewerProxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    const importViewerProxy = async (overrideEnv?: { LEARN_BASE_URL?: string }) => {
        vi.doMock('http-proxy-middleware', () => ({
            createProxyMiddleware: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
            responseInterceptor: vi.fn()
        }));
        vi.doMock('../utils/proxyUtils.js', () => ({
            decorateRequestHeaders: vi.fn()
        }));
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                LEARN_BASE_URL: overrideEnv?.LEARN_BASE_URL ?? 'http://userorg-service:9000',
                KONG_ANONYMOUS_FALLBACK_TOKEN: 'test-token'
            }
        }));
        const module = await import('./viewerProxy.js');
        return module.viewerProxy;
    };

    it('targets LEARN_BASE_URL - the Viewer Service is hosted alongside the learner/user-org APIs', async () => {
        await importViewerProxy();
        const hpm = await import('http-proxy-middleware');

        expect(hpm.createProxyMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'http://userorg-service:9000',
                changeOrigin: true,
                secure: false
            })
        );
    });

    it('uses a custom LEARN_BASE_URL when provided', async () => {
        await importViewerProxy({ LEARN_BASE_URL: 'https://learn-service.example.com' });
        const hpm = await import('http-proxy-middleware');

        expect(hpm.createProxyMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'https://learn-service.example.com'
            })
        );
    });
});

describe('Viewer Proxy Integration', () => {
    let app: express.Application;
    let mockViewerServer: express.Application;
    let serverInstance: Server | null = null;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.doMock('http-proxy-middleware', () => ({
            createProxyMiddleware,
            responseInterceptor,
            fixRequestBody
        }));
        vi.doUnmock('../utils/proxyUtils.js');
        vi.doUnmock('../utils/logger.js');

        mockViewerServer = express();
        mockViewerServer.use(express.json());

        mockViewerServer.get('/unauthorized', (req: Request, res: Response) => {
            res.status(401).json({ success: false });
        });

        // Catch-all route for other requests
        mockViewerServer.use((req: Request, res: Response) => {
            res.status(200).json({
                success: true,
                method: req.method,
                path: req.path,
                body: req.body,
                headers: {
                    'x-authenticated-userid': req.get('X-Authenticated-Userid'),
                    'authorization': req.get('Authorization')
                }
            });
        });

        serverInstance = mockViewerServer.listen(8889);

        vi.doMock('../config/env.js', () => ({
            envConfig: {
                LEARN_BASE_URL: 'http://localhost:8889',
                KONG_ANONYMOUS_FALLBACK_TOKEN: 'test-fallback-token',
                APPID: 'test-app',
                SUNBIRD_SESSION_SECRET: 'test-secret',
                ENVIRONMENT: 'test',
                SUNBIRD_ANONYMOUS_SESSION_TTL: 86400000
            }
        }));

        const { viewerProxy } = await import('./viewerProxy.js');

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
            }
            next();
        });

        app.all('/portal/*rest', viewerProxy);
    });

    afterEach(() => {
        if (serverInstance) {
            serverInstance.close();
        }
        vi.resetModules();
    });

    it('proxies GET /v1/summary/list/:userId and rewrites /portal to /', async () => {
        const response = await request(app)
            .get('/portal/v1/summary/list/user123')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.path).toBe('/v1/summary/list/user123');
    });

    it('proxies POST /v1/view/start with body', async () => {
        const response = await request(app)
            .post('/portal/v1/view/start')
            .send({ request: { userId: 'user123', contentId: 'do_123' } })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.path).toBe('/v1/view/start');
        expect(response.body.body).toEqual({ request: { userId: 'user123', contentId: 'do_123' } });
    });

    it('forwards authenticated session token in headers', async () => {
        const response = await request(app)
            .post('/portal/v1/view/end')
            .set('X-Test-Auth', 'true')
            .send({ request: { userId: 'user123', contentId: 'do_123' } })
            .expect(200);

        expect(response.body.headers.authorization).toBe('Bearer user-session-token');
    });

    it('logs error on status code >= 400', async () => {
        const logger = (await import('../utils/logger.js')).default;
        const errorSpy = vi.spyOn(logger, 'error');

        await request(app)
            .get('/portal/unauthorized')
            .expect(401);

        expect(errorSpy).toHaveBeenCalled();
        const call = errorSpy.mock.calls[0];
        expect(call).toBeDefined();
        const messageArg = call ? call[0] : '';
        expect(String(messageArg)).toContain('[ViewerProxy] Error proxying request');
        expect(String(messageArg)).toContain('Status: 401');

        errorSpy.mockRestore();
    });
});

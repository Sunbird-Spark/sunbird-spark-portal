import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { createProxyMiddleware, responseInterceptor, fixRequestBody } from 'http-proxy-middleware';

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

describe('knowlgMwProxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    const importKnowlgMwProxy = async (overrideEnv?: { KNOWLG_MW_BASE_URL?: string }) => {
        vi.doMock('http-proxy-middleware', () => ({
            createProxyMiddleware: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
            fixRequestBody: vi.fn(),
            responseInterceptor: vi.fn()
        }));
        vi.doMock('../utils/proxyUtils.js', () => ({
            decorateRequestHeaders: vi.fn()
        }));
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                KNOWLG_MW_BASE_URL: overrideEnv?.KNOWLG_MW_BASE_URL || 'http://localhost:5000'
            }
        }));
        const module = await import('./knowlgMwProxy.js');
        return module.contentActionProxy;
    };

    it('should create proxy middleware with correct configuration', async () => {
        await importKnowlgMwProxy();
        const hpm = await import('http-proxy-middleware');
        expect(hpm.createProxyMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
                selfHandleResponse: true
            })
        );
    });

    it('should use custom KNOWLG_MW_BASE_URL when provided', async () => {
        await importKnowlgMwProxy({ KNOWLG_MW_BASE_URL: 'https://custom-knowlg.example.com' });
        const hpm = await import('http-proxy-middleware');
        expect(hpm.createProxyMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'https://custom-knowlg.example.com'
            })
        );
    });
});

describe('knowlgMwProxy Integration', () => {
    let app: express.Application;
    let mockServer: express.Application;
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

        mockServer = express();
        mockServer.use(express.json());

        mockServer.get('/action/error-route', (_req: Request, res: Response) => {
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        });
        mockServer.get('/action/not-found', (_req: Request, res: Response) => {
            res.status(404).json({ success: false, error: 'Not Found' });
        });
        mockServer.use((req: Request, res: Response) => {
            res.status(200).json({
                success: true,
                method: req.method,
                path: req.path,
                body: req.body,
                headers: {
                    'x-session-id': req.get('X-Session-Id'),
                    'x-channel-id': req.get('X-Channel-Id'),
                    'x-authenticated-userid': req.get('X-Authenticated-Userid'),
                    'x-app-id': req.get('X-App-Id'),
                    'authorization': req.get('Authorization')
                }
            });
        });

        serverInstance = mockServer.listen(0);
        const port = (serverInstance.address() as AddressInfo).port;

        vi.doMock('../config/env.js', () => ({
            envConfig: {
                KNOWLG_MW_BASE_URL: `http://localhost:${port}`,
                KONG_ANONYMOUS_FALLBACK_TOKEN: 'test-fallback-token',
                APPID: 'test-app',
                SUNBIRD_SESSION_SECRET: 'test-secret',
                ENVIRONMENT: 'test',
                SUNBIRD_ANONYMOUS_SESSION_TTL: 86400000
            }
        }));

        const { contentActionProxy } = await import('./knowlgMwProxy.js');

        app = express();
        app.use(express.json());
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: { httpOnly: true }
        }));
        app.use((req: Request, _res: Response, next: NextFunction) => {
            if (req.get('X-Test-Auth')) {
                req.session.kongToken = 'user-session-token';
                req.session.userId = 12345;
                req.session.rootOrghashTagId = 'test-channel';
            }
            next();
        });
        app.all('/action/*rest', contentActionProxy);
    });

    afterEach(() => {
        if (serverInstance) {
            serverInstance.close();
        }
        vi.resetModules();
    });

    it('should proxy GET requests to /action/* paths', async () => {
        const response = await request(app)
            .get('/action/content/v3/read/do_123')
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.method).toBe('GET');
    });

    it('should proxy POST requests with body', async () => {
        const response = await request(app)
            .post('/action/content/v3/create')
            .send({ request: { content: { name: 'Test Content' } } })
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.method).toBe('POST');
    });

    it('should forward headers via decorateRequestHeaders', async () => {
        const response = await request(app)
            .get('/action/some/path')
            .set('X-Test-Auth', 'true')
            .expect(200);
        expect(response.body.headers['x-channel-id']).toBe('test-channel');
        expect(response.body.headers['x-authenticated-userid']).toBe('12345');
        expect(response.body.headers['x-app-id']).toBe('test-app');
        expect(response.body.headers['x-session-id']).toBeDefined();
    });

    it('should log errors when upstream returns >= 400', async () => {
        const logger = (await import('../utils/logger.js')).default;
        const errorSpy = vi.spyOn(logger, 'error');

        await request(app)
            .get('/action/error-route')
            .expect(500);

        expect(errorSpy).toHaveBeenCalled();
        const call = errorSpy.mock.calls[0];
        expect(call).toBeDefined();
        const messageArg = call ? call[0] : '';
        expect(String(messageArg)).toContain('Error proxying request');
        expect(String(messageArg)).toContain('Status: 500');
        errorSpy.mockRestore();
    });

    it('should log errors on 404 from upstream', async () => {
        const logger = (await import('../utils/logger.js')).default;
        const errorSpy = vi.spyOn(logger, 'error');

        await request(app)
            .get('/action/not-found')
            .expect(404);

        expect(errorSpy).toHaveBeenCalled();
        const call = errorSpy.mock.calls[0];
        expect(call).toBeDefined();
        const messageArg = call ? call[0] : '';
        expect(String(messageArg)).toContain('Error proxying request');
        expect(String(messageArg)).toContain('Status: 404');
        errorSpy.mockRestore();
    });

    it('should handle POST with JSON body', async () => {
        const payload = { request: { query: 'mathematics', filters: { status: ['Live'] } } };
        const response = await request(app)
            .post('/action/content/v3/create')
            .set('Content-Type', 'application/json')
            .send(payload)
            .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.body).toEqual(payload);
    });
});

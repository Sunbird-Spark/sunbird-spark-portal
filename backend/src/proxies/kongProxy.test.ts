import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProxyMiddleware } from 'http-proxy-middleware';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import type { Server } from 'http';

vi.mock('http-proxy-middleware');
vi.mock('../utils/proxyUtils.js');
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

        expect(createProxyMiddleware).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false
            })
        );
    });

    it('should use custom KONG_URL when provided', async () => {
        await importKongProxy({ KONG_URL: 'https://custom-kong.example.com' });

        expect(createProxyMiddleware).toHaveBeenCalledWith(
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

        mockKongServer = express();
        mockKongServer.use(express.json());
        
        mockKongServer.all('/api/*rest', (req: Request, res: Response) => {
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
                SUNBIRD_ANONYMOUS_SESSION_SECRET: 'test-secret',
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

        app.use('/portal/*rest', kongProxy);
    });

    afterEach(() => {
        if (serverInstance) {
            serverInstance.close();
        }
        vi.resetModules();
    });

    it('should proxy request and rewrite /portal to /api', async () => {
        const response = await request(app)
            .get('/portal/user/v1/read/user123')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.path).toMatch(/^\/api/);
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
});

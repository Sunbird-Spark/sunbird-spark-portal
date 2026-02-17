import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import type { Server } from 'http';
import * as http from 'http';

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../utils/proxyUtils.js', () => ({
    decorateRequestHeaders: vi.fn()
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        LEARN_BASE_URL: 'http://localhost:9000'
    }
}));

describe('userProxy', () => {
    let app: express.Application;
    let mockUserServer: express.Application;
    let serverInstance: Server | null = null;
    let proxyUtilsMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();

        proxyUtilsMock = await import('../utils/proxyUtils.js');

        // Setup mock upstream server
        mockUserServer = express();
        mockUserServer.use(express.json());

        // Catch-all to echo request details
        mockUserServer.use((req: Request, res: Response) => {
            const status = req.header('x-return-status');
            if (status) {
                res.status(parseInt(status)).json({ error: 'forced error' });
                return;
            }

            res.status(200).json({
                method: req.method,
                path: req.path, // This will be the rewritten path
                body: req.body,
                headers: req.headers
            });
        });

        serverInstance = mockUserServer.listen(9000);

        // Import the proxy middleware (it reads envConfig on import)
        const { userProxy } = await import('./userProxy.js');

        app = express();
        app.use(express.json()); // Body parser needed to test fixRequestBody? 
        // Actually fixRequestBody is needed because body-parser consumes the stream.
        // So we MUST use body-parser in the main app to simulate the real scenario.

        app.use('/portal', userProxy);
    });

    afterEach(() => {
        if (serverInstance) {
            serverInstance.close();
        }
    });

    it('should proxy requests and rewrite path correctly (default)', async () => {
        const res = await request(app).get('/portal/some/path');

        expect(res.status).toBe(200);
        expect(res.body.path).toBe('/some/path');
        expect(proxyUtilsMock.decorateRequestHeaders).toHaveBeenCalled();
    });

    it('should rewrite /user/v1/fuzzy/search to /private/user/v1/search', async () => {
        const res = await request(app).post('/portal/user/v1/fuzzy/search');

        expect(res.status).toBe(200);
        expect(res.body.path).toBe('/private/user/v1/search');
    });

    it('should rewrite /user/v1/password/reset to /private/user/v1/password/reset', async () => {
        const res = await request(app).post('/portal/user/v1/password/reset');

        expect(res.status).toBe(200);
        expect(res.body.path).toBe('/private/user/v1/password/reset');
    });

    it('should fix request body for POST requests', async () => {
        // fixRequestBody is internal to http-proxy-middleware or we are mocking it?
        // In userProxy.ts: import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
        // We are using the real http-proxy-middleware.
        // If we use express.json() in the app, the body is parsed.
        // fixRequestBody allows the proxy to re-stream the parsed body.

        const res = await request(app)
            .post('/portal/some/path')
            .send({ key: 'value' });

        expect(res.status).toBe(200);
        expect(res.body.body).toEqual({ key: 'value' });
    });

    it('should log error when upstream returns >= 400', async () => {
        const logger = (await import('../utils/logger.js')).default;

        await request(app)
            .get('/portal/error')
            .set('x-return-status', '404')
            .expect(404);

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Error proxying request'),
            expect.objectContaining({
                proxyStatusCode: 404
            })
        );
    });
});

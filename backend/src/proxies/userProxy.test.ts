import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../utils/proxyUtils.js', () => ({
    decorateRequestHeaders: vi.fn()
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

        // Use port 0 to let the OS assign an available port
        serverInstance = mockUserServer.listen(0);
        const port = (serverInstance.address() as AddressInfo).port;

        // Mock env config with the dynamically assigned port
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                LEARN_BASE_URL: `http://localhost:${port}`
            }
        }));

        // Import the proxy middleware (it reads envConfig on import)
        const { userProxy } = await import('./userProxy.js');

        app = express();
        app.use(express.json());
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

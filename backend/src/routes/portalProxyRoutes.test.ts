import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// ─── Mocks ─────────────────────────────────────────────────────────────────
// Route precedence: /v1/summary/list/:userId and /v1/view/* must resolve to
// viewerProxy, not fall through to the kongProxy catch-all.

vi.mock('../proxies/kongProxy.js', () => ({
    kongProxy: vi.fn((_req: Request, res: Response) => {
        res.status(200).json({ proxiedBy: 'kong' });
    }),
}));

vi.mock('../proxies/viewerProxy.js', () => ({
    viewerProxy: vi.fn((_req: Request, res: Response) => {
        res.status(200).json({ proxiedBy: 'viewer' });
    }),
}));

vi.mock('../proxies/userProxy.js', () => ({
    userProxy: vi.fn((_req: Request, res: Response) => {
        res.status(200).json({ proxiedBy: 'user' });
    }),
}));

vi.mock('../middlewares/googleAuth.js', () => ({
    validateRecaptcha: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../middlewares/passwordHandler.js', () => ({
    handlePassword: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../auth/oidcMiddleware.js', () => ({
    requireAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

import portalProxyRoutes from './portalProxyRoutes.js';

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/portal', portalProxyRoutes);
    return app;
};

describe('portalProxyRoutes - Viewer Service precedence', () => {
    it('routes GET /v1/summary/list/:userId to viewerProxy, not the kongProxy catch-all', async () => {
        const app = buildApp();

        const response = await request(app)
            .get('/portal/v1/summary/list/user123')
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('routes POST /v1/view/start to viewerProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .post('/portal/v1/view/start')
            .send({ request: { userId: 'user123', contentId: 'do_123' } })
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('routes POST /v1/assessment/submit to viewerProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .post('/portal/v1/assessment/submit')
            .send({ request: { userId: 'user123', contentId: 'do_123', assessments: [] } })
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('routes POST /v1/summary/read to viewerProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .post('/portal/v1/summary/read')
            .send({ request: { userId: 'user123', collectionId: 'do_123' } })
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('routes DELETE /v1/summary/delete/:userId to viewerProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .delete('/portal/v1/summary/delete/user123')
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('routes GET /v1/summary/download/:userId to viewerProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .get('/portal/v1/summary/download/user123?format=csv')
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('still routes unrelated requests to the kongProxy catch-all', async () => {
        const app = buildApp();

        const response = await request(app)
            .get('/portal/course/v1/hierarchy/do_123')
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });
});

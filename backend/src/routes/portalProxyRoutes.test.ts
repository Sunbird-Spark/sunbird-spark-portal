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

const buildApp = (sessionUserId?: string | number) => {
    const app = express();
    app.use(express.json());
    // Stand-in for the real session middleware: attaches `req.session.userId`
    // the way `requireOwnUserId` expects to find it.
    app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as unknown as { session: { userId?: string | number } }).session = { userId: sessionUserId };
        next();
    });
    app.use('/portal', portalProxyRoutes);
    return app;
};

describe('portalProxyRoutes - Viewer Service precedence', () => {
    it('routes GET /v1/summary/list/:userId to viewerProxy, not the kongProxy catch-all', async () => {
        const app = buildApp('user123');

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
        const app = buildApp('user123');

        const response = await request(app)
            .delete('/portal/v1/summary/delete/user123')
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('routes GET /v1/summary/download/:userId to viewerProxy', async () => {
        const app = buildApp('user123');

        const response = await request(app)
            .get('/portal/v1/summary/download/user123?format=csv')
            .expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });

    it('still routes unrelated requests to the kongProxy catch-all', async () => {
        const app = buildApp('user123');

        const response = await request(app)
            .get('/portal/course/v1/hierarchy/do_123')
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });
});

describe('portalProxyRoutes - requireOwnUserId (IDOR guard)', () => {
    // Regression: any authenticated learner could read/delete another
    // learner's summary data by substituting a different :userId in the URL,
    // since requireAuth() only checks that *someone* is logged in.
    it('403s GET /v1/summary/list/:userId when the path userId does not match the session', async () => {
        const app = buildApp('user123');

        const response = await request(app)
            .get('/portal/v1/summary/list/someone-else')
            .expect(403);

        expect(response.body.message).toBe('Forbidden');
    });

    it('403s DELETE /v1/summary/delete/:userId when the path userId does not match the session', async () => {
        const app = buildApp('user123');

        await request(app).delete('/portal/v1/summary/delete/someone-else').expect(403);
    });

    it('403s GET /v1/summary/download/:userId when the path userId does not match the session', async () => {
        const app = buildApp('user123');

        await request(app).get('/portal/v1/summary/download/someone-else?format=csv').expect(403);
    });

    it('403s when there is no session userId at all', async () => {
        const app = buildApp(undefined);

        await request(app).get('/portal/v1/summary/list/user123').expect(403);
    });

    it('allows the request through when the path userId matches the session (numeric session id)', async () => {
        const app = buildApp(12345);

        const response = await request(app).get('/portal/v1/summary/list/12345').expect(200);

        expect(response.body.proxiedBy).toBe('viewer');
    });
});

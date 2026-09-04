import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// ─── Mocks ─────────────────────────────────────────────────────────────────
// All Viewer Service routes now resolve to kongProxy (see plan: Kong
// migration) - the same proxy the `/*rest` catch-all uses. So the assertions
// below check reachability and auth guards, not "which proxy" - the only
// route-precedence question left is whether the `:userId` routes'
// requireOwnUserId guard still applies (it does not on the catch-all).

vi.mock('../proxies/kongProxy.js', () => ({
    kongProxy: vi.fn((_req: Request, res: Response) => {
        res.status(200).json({ proxiedBy: 'kong' });
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

describe('portalProxyRoutes - Viewer Service routes (Kong-fronted)', () => {
    it('routes GET /summary/v1/list/:userId to kongProxy', async () => {
        const app = buildApp('user123');

        const response = await request(app)
            .get('/portal/summary/v1/list/user123')
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });

    it('routes POST /view/v1/start to kongProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .post('/portal/view/v1/start')
            .send({ request: { userId: 'user123', contentId: 'do_123' } })
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });

    it('routes POST /assessment/v1/submit to kongProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .post('/portal/assessment/v1/submit')
            .send({ request: { userId: 'user123', contentId: 'do_123', assessments: [] } })
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });

    it('routes POST /summary/v1/read to kongProxy', async () => {
        const app = buildApp();

        const response = await request(app)
            .post('/portal/summary/v1/read')
            .send({ request: { userId: 'user123', collectionId: 'do_123' } })
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });

    it('routes DELETE /summary/v1/delete/:userId to kongProxy', async () => {
        const app = buildApp('user123');

        const response = await request(app)
            .delete('/portal/summary/v1/delete/user123')
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });

    it('routes GET /summary/v1/download/:userId to kongProxy', async () => {
        const app = buildApp('user123');

        const response = await request(app)
            .get('/portal/summary/v1/download/user123?format=csv')
            .expect(200);

        expect(response.body.proxiedBy).toBe('kong');
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
    // since requireAuth() only checks that *someone* is logged in. This guard
    // only applies because the three :userId routes are registered explicitly
    // above the `/*rest` catch-all - the catch-all itself has no such check.
    it('403s GET /summary/v1/list/:userId when the path userId does not match the session', async () => {
        const app = buildApp('user123');

        const response = await request(app)
            .get('/portal/summary/v1/list/someone-else')
            .expect(403);

        expect(response.body.message).toBe('Forbidden');
    });

    it('403s DELETE /summary/v1/delete/:userId when the path userId does not match the session', async () => {
        const app = buildApp('user123');

        await request(app).delete('/portal/summary/v1/delete/someone-else').expect(403);
    });

    it('403s GET /summary/v1/download/:userId when the path userId does not match the session', async () => {
        const app = buildApp('user123');

        await request(app).get('/portal/summary/v1/download/someone-else?format=csv').expect(403);
    });

    it('403s when there is no session userId at all', async () => {
        const app = buildApp(undefined);

        await request(app).get('/portal/summary/v1/list/user123').expect(403);
    });

    it('allows the request through when the path userId matches the session (numeric session id)', async () => {
        const app = buildApp(12345);

        const response = await request(app).get('/portal/summary/v1/list/12345').expect(200);

        expect(response.body.proxiedBy).toBe('kong');
    });
});

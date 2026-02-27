import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mocks
const mockKongProxy = vi.fn((req: Request, res: Response) => res.status(200).send('OK'));
const mockRead = vi.fn((req: Request, res: Response) => res.status(200).send('OK'));
const mockValidateReadAPI = vi.fn((req: Request, res: Response, next: NextFunction) => next());

vi.mock('../proxies/kongProxy.js', () => ({
    kongProxy: mockKongProxy
}));

vi.mock('../controllers/formsController.js', () => ({
    read: mockRead
}));

vi.mock('../middlewares/formsValidator.js', () => ({
    validateReadAPI: mockValidateReadAPI
}));

const mockKeycloakMiddleware = vi.fn(() => (req: Request, res: Response, next: NextFunction) => next());

vi.mock('../auth/keycloakProvider.js', () => ({
    keycloak: {
        middleware: mockKeycloakMiddleware
    }
}));

describe('PortalAnonymousProxyRoutes', () => {
    let app: express.Application;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();

        const portalAnonymousProxyRoutes = (await import('./portalAnonymousProxyRoutes.js')).default;

        app = express();
        app.use(express.json());
        app.use('/portal', portalAnonymousProxyRoutes);
    });

    describe('POST /portal/user/v1/tnc/accept', () => {
        it('should call keycloak middleware and kongProxy', async () => {
            const res = await request(app)
                .post('/portal/user/v1/tnc/accept')
                .send({ request: { version: 'v1' } });

            expect(res.status).toBe(200);
            expect(mockKeycloakMiddleware).toHaveBeenCalled();
            expect(mockKongProxy).toHaveBeenCalled();
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Use vi.hoisted to ensure mocks are available in vi.mock factories
const mocks = vi.hoisted(() => {
    return {
        mockAuthMiddleware: vi.fn((req, res, next) => next()),
        mockAnonMiddleware: vi.fn((req, res, next) => next()),
        mockKongMiddleware: vi.fn((req, res, next) => next()),
        mockOrgMiddleware: vi.fn((req, res, next) => next())
    };
});

vi.mock('express-session', () => ({
    default: vi.fn((config: any) => {
        if (config.name === 'auth_cookie') return mocks.mockAuthMiddleware;
        if (config.name === 'anonymous_cookie') return mocks.mockAnonMiddleware;
        return vi.fn((req, res, next) => next());
    })
}));

vi.mock('../config/sessionConfig', () => ({
    authSessionConfig: { name: 'auth_cookie' },
    anonymousSessionConfig: { name: 'anonymous_cookie' }
}));

vi.mock('../utils/cookieConstants', () => ({
    CookieNames: { AUTH: 'auth_cookie', ANONYMOUS: 'anonymous_cookie' }
}));

vi.mock('./kongAuth', () => ({
    registerDeviceWithKong: vi.fn(() => mocks.mockKongMiddleware)
}));

vi.mock('./anonymousOrg', () => ({
    setAnonymousOrg: vi.fn(() => mocks.mockOrgMiddleware)
}));

// Import the module under test AFTER mocks
import { conditionalSessionMiddleware } from './conditionalSession.js';

describe('conditionalSessionMiddleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {};
        next = vi.fn();
        vi.clearAllMocks();
    });

    it('should execute auth session middleware when auth cookie is present', () => {
        req.headers = { cookie: 'auth_cookie=somevalue; other=val' };

        conditionalSessionMiddleware(req as Request, res as Response, next);

        expect(mocks.mockAuthMiddleware).toHaveBeenCalled();
        expect(mocks.mockAnonMiddleware).not.toHaveBeenCalled();
        expect(mocks.mockKongMiddleware).not.toHaveBeenCalled();
        expect(mocks.mockOrgMiddleware).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('should execute anonymous session middleware chain when auth cookie is missing', () => {
        req.headers = { cookie: 'other=val' };

        conditionalSessionMiddleware(req as Request, res as Response, next);

        expect(mocks.mockAuthMiddleware).not.toHaveBeenCalled();
        expect(mocks.mockAnonMiddleware).toHaveBeenCalled();
        expect(mocks.mockKongMiddleware).toHaveBeenCalled();
        expect(mocks.mockOrgMiddleware).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('should execute anonymous session middleware chain when no cookies are present', () => {
        req.headers = {};

        conditionalSessionMiddleware(req as Request, res as Response, next);

        expect(mocks.mockAuthMiddleware).not.toHaveBeenCalled();
        expect(mocks.mockAnonMiddleware).toHaveBeenCalled();
        expect(mocks.mockKongMiddleware).toHaveBeenCalled();
        expect(mocks.mockOrgMiddleware).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('should propagate errors from the middleware chain', () => {
        req.headers = {};
        const error = new Error('Middleware Error');
        mocks.mockAnonMiddleware.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => next(error));

        conditionalSessionMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(mocks.mockKongMiddleware).not.toHaveBeenCalled();
    });
});

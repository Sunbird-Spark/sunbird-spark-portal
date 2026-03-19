import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { mockKeycloakNativeLogin } = vi.hoisted(() => ({
    mockKeycloakNativeLogin: vi.fn(),
}));

vi.mock('../services/mobileAuthService.js', () => ({
    keycloakNativeLogin: mockKeycloakNativeLogin,
}));

vi.mock('../utils/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn() },
}));

import { handleMobileKeycloakLogin } from './mobileKeycloakController.js';

const makeRes = (): Partial<Response> => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});

describe('handleMobileKeycloakLogin', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        req = { body: { emailId: 'user@example.com', password: 'secret' } };
        res = makeRes();
    });

    it('returns tokens on successful login', async () => {
        mockKeycloakNativeLogin.mockResolvedValue({
            access_token: 'acc',
            refresh_token: 'ref',
        });

        await handleMobileKeycloakLogin(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith({ access_token: 'acc', refresh_token: 'ref' });
    });

    it('returns 400 when emailId is missing', async () => {
        req.body = { password: 'secret' };

        await handleMobileKeycloakLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'MISSING_REQUIRED_FIELDS' })
        );
    });

    it('returns 400 when password is missing', async () => {
        req.body = { emailId: 'user@example.com' };

        await handleMobileKeycloakLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when body is empty', async () => {
        req.body = {};

        await handleMobileKeycloakLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 with INVALID_CREDENTIALS on wrong password', async () => {
        mockKeycloakNativeLogin.mockRejectedValue({
            statusCode: 401,
            error: 'INVALID_CREDENTIALS',
            error_msg: 'Invalid user credentials',
        });

        await handleMobileKeycloakLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'INVALID_CREDENTIALS' })
        );
    });

    it('returns 401 with USER_ACCOUNT_BLOCKED for disabled accounts', async () => {
        mockKeycloakNativeLogin.mockRejectedValue({
            statusCode: 401,
            error: 'USER_ACCOUNT_BLOCKED',
            error_msg: 'User account is blocked. Please contact admin',
        });

        await handleMobileKeycloakLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'USER_ACCOUNT_BLOCKED' })
        );
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const {
    mockGetMobileClients,
    mockVerifyEchoAuthToken,
    mockRefreshMobileToken,
    mockDecodeJwtPayload,
} = vi.hoisted(() => ({
    mockGetMobileClients: vi.fn(),
    mockVerifyEchoAuthToken: vi.fn(),
    mockRefreshMobileToken: vi.fn(),
    mockDecodeJwtPayload: vi.fn(),
}));

vi.mock('../services/mobileAuthService.js', () => ({
    getMobileClients: mockGetMobileClients,
    verifyEchoAuthToken: mockVerifyEchoAuthToken,
    refreshMobileToken: mockRefreshMobileToken,
}));

vi.mock('../auth/oidcProvider.js', () => ({
    decodeJwtPayload: mockDecodeJwtPayload,
}));

vi.mock('../utils/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn() },
}));

import { handleMobileTokenRefresh } from './mobileTokenRefreshController.js';

const makeRes = (): Partial<Response> => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});

const makeReq = (overrides: Partial<Request> = {}): Partial<Request> => ({
    body: { refresh_token: 'test-refresh-token' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: vi.fn((header: string) => {
        if (header === 'authorization') return 'Bearer current-token';
        return undefined;
    }) as any,
    ...overrides,
});

const defaultClients = {
    'android-client': { client_id: 'android-client' },
    'google-android-client': { client_id: 'google-android-client', client_secret: 'secret' },
};

describe('handleMobileTokenRefresh', () => {
    let res: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        res = makeRes();
        mockGetMobileClients.mockReturnValue(defaultClients);
        mockDecodeJwtPayload.mockReturnValue({ aud: 'android-client' });
        mockVerifyEchoAuthToken.mockResolvedValue(undefined);
        mockRefreshMobileToken.mockResolvedValue({
            access_token: 'new-acc',
            refresh_token: 'new-ref',
        });
    });

    it('returns new tokens on successful refresh', async () => {
        await handleMobileTokenRefresh(makeReq() as Request, res as Response);

        expect(mockVerifyEchoAuthToken).toHaveBeenCalledWith('Bearer current-token');
        expect(mockRefreshMobileToken).toHaveBeenCalledWith(
            defaultClients['android-client'],
            'test-refresh-token'
        );

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'api.refresh.token',
                responseCode: 'OK',
                params: expect.objectContaining({ status: 'successful' }),
                result: { access_token: 'new-acc', refresh_token: 'new-ref' },
            })
        );
    });

    it('returns 400 when refresh_token is missing', async () => {
        const req = makeReq({ body: {} });

        await handleMobileTokenRefresh(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ params: expect.objectContaining({ status: 'failed', err: 'REFRESH_TOKEN_REQUIRED' }) })
        );
        expect(mockVerifyEchoAuthToken).not.toHaveBeenCalled();
    });

    it('returns 400 when JWT payload cannot be decoded', async () => {
        mockDecodeJwtPayload.mockReturnValue(null);

        await handleMobileTokenRefresh(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ params: expect.objectContaining({ status: 'failed', err: 'INVALID_REFRESH_TOKEN' }) })
        );
    });

    it('returns 400 when client is not in the whitelist', async () => {
        mockDecodeJwtPayload.mockReturnValue({ aud: 'unknown-client' });

        await handleMobileTokenRefresh(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ params: expect.objectContaining({ status: 'failed', err: 'INVALID_CLIENT' }) })
        );
        expect(mockVerifyEchoAuthToken).not.toHaveBeenCalled();
    });

    it('handles aud as an array and uses the first entry', async () => {
        mockDecodeJwtPayload.mockReturnValue({ aud: ['android-client', 'account'] });

        await handleMobileTokenRefresh(makeReq() as Request, res as Response);

        expect(mockRefreshMobileToken).toHaveBeenCalledWith(
            defaultClients['android-client'],
            'test-refresh-token'
        );
    });

    it('returns 500 when echo API verification fails', async () => {
        mockVerifyEchoAuthToken.mockRejectedValue({ statusCode: 401, error: 'UNAUTHORIZED' });

        await handleMobileTokenRefresh(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockRefreshMobileToken).not.toHaveBeenCalled();
    });

    it('returns error when Keycloak refresh fails', async () => {
        mockRefreshMobileToken.mockRejectedValue({
            statusCode: 400,
            error: 'invalid_token',
            error_msg: 'Token expired',
        });

        await handleMobileTokenRefresh(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({ status: 'failed' }),
            })
        );
    });
});

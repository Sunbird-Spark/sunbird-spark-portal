import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const {
    mockVerifyGoogleIdToken,
    mockFindOrCreateGoogleUser,
    mockCreateKeycloakGoogleAndroidSession,
} = vi.hoisted(() => ({
    mockVerifyGoogleIdToken: vi.fn(),
    mockFindOrCreateGoogleUser: vi.fn(),
    mockCreateKeycloakGoogleAndroidSession: vi.fn(),
}));

vi.mock('../services/mobileAuthService.js', () => ({
    verifyGoogleIdToken: mockVerifyGoogleIdToken,
    findOrCreateGoogleUser: mockFindOrCreateGoogleUser,
    createKeycloakGoogleAndroidSession: mockCreateKeycloakGoogleAndroidSession,
}));

vi.mock('../utils/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        GOOGLE_OAUTH_CLIENT_ID: 'google-android-client',
        GOOGLE_OAUTH_CLIENT_ID_IOS: 'google-ios-client',
    },
}));

import { handleMobileGoogleLogin } from './mobileGoogleController.js';

const makeRes = (): Partial<Response> => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});

const makeReq = (overrides: Partial<Request> = {}): Partial<Request> => ({
    body: { emailId: 'user@example.com', platform: 'android' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: vi.fn((header: string) => {
        if (header === 'X-GOOGLE-ID-TOKEN') return 'google-id-token';
        return undefined;
    }) as any,
    session: {} as any,
    ...overrides,
});

const defaultPayload = { email: 'user@example.com', name: 'Test User', sub: 'sub-123' };
const defaultTokens = { access_token: 'acc', refresh_token: 'ref' };

describe('handleMobileGoogleLogin', () => {
    let res: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        res = makeRes();
        mockVerifyGoogleIdToken.mockResolvedValue(defaultPayload);
        mockFindOrCreateGoogleUser.mockResolvedValue(undefined);
        mockCreateKeycloakGoogleAndroidSession.mockResolvedValue(defaultTokens);
    });

    it('returns tokens on successful Android login', async () => {
        await handleMobileGoogleLogin(makeReq() as Request, res as Response);

        expect(mockVerifyGoogleIdToken).toHaveBeenCalledWith('google-id-token', 'google-android-client');
        expect(mockCreateKeycloakGoogleAndroidSession).toHaveBeenCalledWith('user@example.com');
        expect(res.json).toHaveBeenCalledWith(defaultTokens);
    });

    it('uses iOS Google client ID when platform is ios', async () => {
        const req = makeReq({ body: { emailId: 'user@example.com', platform: 'ios' } });

        await handleMobileGoogleLogin(req as Request, res as Response);

        expect(mockVerifyGoogleIdToken).toHaveBeenCalledWith('google-id-token', 'google-ios-client');
    });

    it('returns 400 when X-GOOGLE-ID-TOKEN header is missing', async () => {
        const req = makeReq({ get: vi.fn().mockReturnValue(undefined) });

        await handleMobileGoogleLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockVerifyGoogleIdToken).not.toHaveBeenCalled();
    });

    it('returns 400 when emailId is missing from body', async () => {
        const req = makeReq({ body: {} });

        await handleMobileGoogleLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when emailId does not match token payload', async () => {
        const req = makeReq({ body: { emailId: 'other@example.com', platform: 'android' } });

        await handleMobileGoogleLogin(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: 'emailId do not match' }));
    });

    it('accepts emailId that differs only in case or whitespace', async () => {
        const req = makeReq({ body: { emailId: '  User@Example.COM  ', platform: 'android' } });

        await handleMobileGoogleLogin(req as Request, res as Response);

        expect(res.status).not.toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(defaultTokens);
    });

    it('returns 400 when Google token verification fails', async () => {
        mockVerifyGoogleIdToken.mockRejectedValue(new Error('Invalid token'));

        await handleMobileGoogleLogin(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'Invalid Google ID token' })
        );
    });

    it('returns 400 with USER_NAME_NOT_PRESENT message when name is missing', async () => {
        mockFindOrCreateGoogleUser.mockRejectedValue(new Error('USER_NAME_NOT_PRESENT'));

        await handleMobileGoogleLogin(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'USER_NAME_NOT_PRESENT' })
        );
    });

    it('returns 401 when user account is blocked during session creation', async () => {
        mockCreateKeycloakGoogleAndroidSession.mockRejectedValue({
            error: 'USER_ACCOUNT_BLOCKED',
            error_msg: 'User account is blocked. Please contact admin',
        });

        await handleMobileGoogleLogin(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'USER_ACCOUNT_BLOCKED' })
        );
    });

    it('returns 400 on Keycloak session failure', async () => {
        mockCreateKeycloakGoogleAndroidSession.mockRejectedValue(new Error('KEYCLOAK_ERROR'));

        await handleMobileGoogleLogin(makeReq() as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'unable to create session' })
        );
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.envExample') });

const {
    mockBuildGoogleAuthUrl,
    mockExchangeGoogleCode,
    mockHandleUserAuthentication,
    mockCreateKeycloakGoogleSession,
} = vi.hoisted(() => ({
    mockBuildGoogleAuthUrl: vi.fn(),
    mockExchangeGoogleCode: vi.fn(),
    mockHandleUserAuthentication: vi.fn(),
    mockCreateKeycloakGoogleSession: vi.fn(),
}));

vi.mock('../services/googleAuthService.js', () => ({
    buildGoogleAuthUrl: mockBuildGoogleAuthUrl,
    exchangeGoogleCode: mockExchangeGoogleCode,
    handleUserAuthentication: mockHandleUserAuthentication,
    createKeycloakGoogleSession: mockCreateKeycloakGoogleSession,
    validateOAuthSession: vi.fn(),
    validateOAuthCallback: vi.fn(),
    markSessionAsUsed: vi.fn(),
    validateRedirectUrl: vi.fn((url: string) => url || '/'),
}));

vi.mock('../utils/sessionUtils.js', () => ({
    regenerateSession: vi.fn().mockResolvedValue(undefined),
    saveSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/sessionTTLUtil.js', () => ({
    setSessionTTLFromToken: vi.fn(),
}));

vi.mock('../services/userService.js', () => ({
    fetchUserById: vi.fn().mockResolvedValue({}),
    setUserSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        DOMAIN_URL: 'https://example.com',
        DEVELOPMENT_REACT_APP_URL: 'https://example.com',
    },
}));

vi.mock('openid-client', () => ({
    randomPKCECodeVerifier: vi.fn().mockReturnValue('test-verifier'),
    calculatePKCECodeChallenge: vi.fn().mockResolvedValue('test-challenge'),
}));

describe('GoogleController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let initiateGoogleAuth: any;
    let handleGoogleAuthCallback: any;
    let mockValidateOAuthSession: any;
    let mockValidateOAuthCallback: any;
    let mockMarkSessionAsUsed: any;
    let mockValidateRedirectUrl: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        process.env.DOMAIN_URL = 'https://example.com';

        const googleAuthService = await import('../services/googleAuthService.js');
        mockValidateOAuthSession = googleAuthService.validateOAuthSession as any;
        mockValidateOAuthCallback = googleAuthService.validateOAuthCallback as any;
        mockMarkSessionAsUsed = googleAuthService.markSessionAsUsed as any;
        mockValidateRedirectUrl = googleAuthService.validateRedirectUrl as any;
        mockValidateRedirectUrl.mockImplementation((url: string) => url || '/');

        const controller = await import('../controllers/googleController.js');
        initiateGoogleAuth = controller.initiateGoogleAuth;
        handleGoogleAuthCallback = controller.handleGoogleAuthCallback;

        mockReq = {
            query: {},
            session: {} as any,
            sessionID: 'test-session-id',
            protocol: 'https',
            originalUrl: '/google/auth/callback?code=abc&state=xyz',
            get: vi.fn(),
        };

        mockRes = {
            redirect: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
    });

    describe('GET /google/auth', () => {
        it('redirects to home when any required query param is missing', async () => {
            const cases = [
                {},
                { redirect_uri: 'https://example.com/callback', error_callback: 'https://example.com/error' },
                { client_id: 'test-client', error_callback: 'https://example.com/error' },
                { client_id: 'test-client', redirect_uri: 'https://example.com/callback' },
            ];

            for (const q of cases) {
                mockReq.query = q;
                await initiateGoogleAuth(mockReq, mockRes);
                expect(mockRes.redirect).toHaveBeenCalledWith('/');
                (mockRes.redirect as any).mockClear();
            }
        });

        it('returns 400 for invalid redirect_uri hostname', async () => {
            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://malicious.com/callback',
                error_callback: 'https://example.com/error',
            };

            mockValidateRedirectUrl.mockReturnValue('/');

            await initiateGoogleAuth(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('INVALID_REDIRECT_URI_OR_ERROR_CALLBACK');
        });

        it('stores PKCE codeVerifier in session and redirects to Google auth URL', async () => {
            const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?mock=1';
            mockBuildGoogleAuthUrl.mockReturnValue(mockAuthUrl);

            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            await initiateGoogleAuth(mockReq, mockRes);

            expect(mockReq.session?.googleOAuth).toBeDefined();
            expect(mockReq.session?.googleOAuth?.client_id).toBe('test-client');
            expect(mockReq.session?.googleOAuth?.redirect_uri).toBe('https://example.com/callback');
            expect(mockReq.session?.googleOAuth?.error_callback).toBe('https://example.com/error');
            expect(mockReq.session?.googleOAuth?.codeVerifier).toBeDefined();
            expect(mockReq.session?.googleOAuth?.state).toBeDefined();
            expect(mockRes.redirect).toHaveBeenCalledWith(mockAuthUrl);
        });

        it('redirects to error_callback on exception', async () => {
            mockBuildGoogleAuthUrl.mockImplementation(() => { throw new Error('Google auth init failed'); });

            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            await initiateGoogleAuth(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_AUTH_INIT_FAILED');
        });
    });

    describe('GET /google/auth/callback', () => {
        const defaultSession = {
            state: 'test-state',
            codeVerifier: 'test-verifier',
            client_id: 'test-client',
            redirect_uri: 'https://example.com/callback',
            error_callback: 'https://example.com/error',
            timestamp: Date.now(),
            sessionUsed: false,
        };

        const defaultTokens = {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            id_token: 'test-id-token',
            tokenClaims: { sub: 'f:google:user-id', email: 'test@example.com' },
        };

        it('should redirect with error if OAuth session is missing', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {} as any;
            mockValidateOAuthSession.mockImplementation(() => { throw new Error('OAUTH_SESSION_MISSING'); });

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if state does not match', async () => {
            mockReq.session = { googleOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'correct-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockImplementation(() => { throw new Error('INVALID_OAUTH_STATE'); });

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if Keycloak session creation fails', async () => {
            mockReq.session = { googleOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakGoogleSession.mockRejectedValue(new Error('KEYCLOAK_SESSION_CREATE_FAILED'));

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect to redirect_uri on successful authentication', async () => {
            mockReq.session = { googleOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakGoogleSession.mockResolvedValue(defaultTokens);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockExchangeGoogleCode).toHaveBeenCalledWith('test-code', 'test-verifier');
            expect(mockCreateKeycloakGoogleSession).toHaveBeenCalledWith('test@example.com');
            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/callback');
        });

        it('should fall back to /home when redirect_uri is missing', async () => {
            const sessionWithoutRedirect = { ...defaultSession, redirect_uri: undefined };
            mockReq.session = { googleOAuth: sessionWithoutRedirect } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakGoogleSession.mockResolvedValue(defaultTokens);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/home');
        });

        it('should store oidc-tokens in session from Keycloak response', async () => {
            mockReq.session = { googleOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakGoogleSession.mockResolvedValue(defaultTokens);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockReq.session?.['oidc-tokens']).toEqual({
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                id_token: 'test-id-token',
            });
        });

        it('should clear googleOAuth session data after callback', async () => {
            mockReq.session = { googleOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakGoogleSession.mockResolvedValue(defaultTokens);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockReq.session?.googleOAuth).toBeUndefined();
        });
    });
});

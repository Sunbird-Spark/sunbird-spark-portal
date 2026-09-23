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
    mockCreateKeycloakSsoSession,
    mockValidateSsoConfig,
} = vi.hoisted(() => ({
    mockBuildGoogleAuthUrl: vi.fn(),
    mockExchangeGoogleCode: vi.fn(),
    mockHandleUserAuthentication: vi.fn(),
    mockCreateKeycloakSsoSession: vi.fn(),
    mockValidateSsoConfig: vi.fn(() => ['google']),
}));

vi.mock('../services/ssoProviders.js', () => ({
    ssoProviders: {
        google: {
            buildAuthUrl: mockBuildGoogleAuthUrl,
            exchangeCode: mockExchangeGoogleCode,
            keycloakClientId: 'test-keycloak-client-id',
            keycloakClientSecret: 'test-keycloak-secret',
        },
    },
}));

vi.mock('../services/oauthSessionUtils.js', () => ({
    handleUserAuthentication: mockHandleUserAuthentication,
    validateOAuthSession: vi.fn(),
    validateOAuthCallback: vi.fn(),
    markSessionAsUsed: vi.fn(),
    validateRedirectUrl: vi.fn((url: string) => url || '/'),
}));

vi.mock('../services/keycloakSsoBridgeService.js', () => ({
    createKeycloakSsoSession: mockCreateKeycloakSsoSession,
}));

vi.mock('../bootstrap/validateSsoConfig.js', () => ({
    validateSsoConfig: mockValidateSsoConfig,
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

describe('SsoController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: ReturnType<typeof vi.fn>;
    let initiateSsoAuth: any;
    let handleSsoAuthCallback: any;
    let mockValidateOAuthSession: any;
    let mockValidateOAuthCallback: any;
    let mockMarkSessionAsUsed: any;
    let mockValidateRedirectUrl: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        process.env.DOMAIN_URL = 'https://example.com';
        mockValidateSsoConfig.mockReturnValue(['google']);

        const oauthSessionUtils = await import('../services/oauthSessionUtils.js');
        mockValidateOAuthSession = oauthSessionUtils.validateOAuthSession as any;
        mockValidateOAuthCallback = oauthSessionUtils.validateOAuthCallback as any;
        mockMarkSessionAsUsed = oauthSessionUtils.markSessionAsUsed as any;
        mockValidateRedirectUrl = oauthSessionUtils.validateRedirectUrl as any;
        mockValidateRedirectUrl.mockImplementation((url: string) => url || '/');

        const controller = await import('./ssoController.js');
        initiateSsoAuth = controller.initiateSsoAuth;
        handleSsoAuthCallback = controller.handleSsoAuthCallback;

        mockReq = {
            params: { provider: 'google' },
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

        mockNext = vi.fn();
    });

    describe('GET /:provider/auth', () => {
        it('calls next() for an unregistered provider, without touching the response', async () => {
            mockReq.params = { provider: 'microsoft' };
            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            await initiateSsoAuth(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.send).not.toHaveBeenCalled();
        });

        it('returns 404 for a registered provider that is not in the validated enabled list', async () => {
            mockValidateSsoConfig.mockReturnValue([]);
            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            await initiateSsoAuth(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('SSO_PROVIDER_NOT_FOUND');
        });

        it('redirects to home when any required query param is missing', async () => {
            const cases = [
                {},
                { redirect_uri: 'https://example.com/callback', error_callback: 'https://example.com/error' },
                { client_id: 'test-client', error_callback: 'https://example.com/error' },
                { client_id: 'test-client', redirect_uri: 'https://example.com/callback' },
            ];

            for (const q of cases) {
                mockReq.query = q;
                await initiateSsoAuth(mockReq, mockRes);
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

            await initiateSsoAuth(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('INVALID_REDIRECT_URI_OR_ERROR_CALLBACK');
        });

        it('stores PKCE codeVerifier + provider in session and redirects to the provider auth URL', async () => {
            const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?mock=1';
            mockBuildGoogleAuthUrl.mockReturnValue(mockAuthUrl);

            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            await initiateSsoAuth(mockReq, mockRes);

            expect(mockReq.session?.ssoOAuth).toBeDefined();
            expect(mockReq.session?.ssoOAuth?.provider).toBe('google');
            expect(mockReq.session?.ssoOAuth?.client_id).toBe('test-client');
            expect(mockReq.session?.ssoOAuth?.redirect_uri).toBe('https://example.com/callback');
            expect(mockReq.session?.ssoOAuth?.error_callback).toBe('https://example.com/error');
            expect(mockReq.session?.ssoOAuth?.codeVerifier).toBeDefined();
            expect(mockReq.session?.ssoOAuth?.state).toBeDefined();
            expect(mockRes.redirect).toHaveBeenCalledWith(mockAuthUrl);
        });

        it('redirects to error_callback on exception', async () => {
            mockBuildGoogleAuthUrl.mockImplementation(() => { throw new Error('SSO auth init failed'); });

            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            await initiateSsoAuth(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=SSO_AUTH_INIT_FAILED');
        });
    });

    describe('GET /:provider/auth/callback', () => {
        const defaultSession = {
            provider: 'google',
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

        it('calls next() for an unregistered provider, without touching the response', async () => {
            mockReq.params = { provider: 'microsoft' };
            mockReq.query = { code: 'test-code', state: 'test-state' };

            await handleSsoAuthCallback(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.send).not.toHaveBeenCalled();
        });

        it('rejects a callback whose provider does not match the session-stored provider', async () => {
            mockReq.params = { provider: 'google' };
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                ssoOAuth: {
                    provider: 'not-google',
                    state: 'test-state',
                    codeVerifier: 'test-verifier',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false,
                },
            } as any;
            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                codeVerifier: 'test-verifier',
                client_id: 'test-client',
            });

            await handleSsoAuthCallback(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('SSO_PROVIDER_MISMATCH');
        });

        it('should redirect with error if OAuth session is missing', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {} as any;
            mockValidateOAuthSession.mockImplementation(() => { throw new Error('OAUTH_SESSION_MISSING'); });

            await handleSsoAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/?error=SSO_SIGN_IN_FAILED');
        });

        it('should redirect with error if state does not match', async () => {
            mockReq.session = { ssoOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'correct-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockImplementation(() => { throw new Error('INVALID_OAUTH_STATE'); });

            await handleSsoAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=SSO_SIGN_IN_FAILED');
        });

        it('should redirect with error if Keycloak session creation fails', async () => {
            mockReq.session = { ssoOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakSsoSession.mockRejectedValue(new Error('KEYCLOAK_SESSION_CREATE_FAILED'));

            await handleSsoAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=SSO_SIGN_IN_FAILED');
        });

        it('should redirect to redirect_uri on successful authentication', async () => {
            mockReq.session = { ssoOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakSsoSession.mockResolvedValue(defaultTokens);

            await handleSsoAuthCallback(mockReq, mockRes);

            expect(mockExchangeGoogleCode).toHaveBeenCalledWith('test-code', 'test-verifier');
            expect(mockCreateKeycloakSsoSession).toHaveBeenCalledWith(
                'google',
                'test@example.com',
                'test-keycloak-client-id',
                'test-keycloak-secret'
            );
            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/callback');
        });

        it('should fall back to /home when redirect_uri is missing', async () => {
            const sessionWithoutRedirect = { ...defaultSession, redirect_uri: undefined };
            mockReq.session = { ssoOAuth: sessionWithoutRedirect } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakSsoSession.mockResolvedValue(defaultTokens);

            await handleSsoAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/home');
        });

        it('should store oidc-tokens in session from Keycloak response', async () => {
            mockReq.session = { ssoOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakSsoSession.mockResolvedValue(defaultTokens);

            await handleSsoAuthCallback(mockReq, mockRes);

            expect(mockReq.session?.['oidc-tokens']).toEqual({
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                id_token: 'test-id-token',
            });
        });

        it('should clear ssoOAuth session data after callback', async () => {
            mockReq.session = { ssoOAuth: defaultSession } as any;
            mockValidateOAuthSession.mockReturnValue({ state: 'test-state', codeVerifier: 'test-verifier', client_id: 'test-client' });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeGoogleCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);
            mockCreateKeycloakSsoSession.mockResolvedValue(defaultTokens);

            await handleSsoAuthCallback(mockReq, mockRes);

            expect(mockReq.session?.ssoOAuth).toBeUndefined();
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.envExample') });

const {
    mockBuildKeycloakGoogleAuthUrl,
    mockExchangeKeycloakCode,
    mockHandleUserAuthentication,
} = vi.hoisted(() => ({
    mockBuildKeycloakGoogleAuthUrl: vi.fn(),
    mockExchangeKeycloakCode: vi.fn(),
    mockHandleUserAuthentication: vi.fn(),
}));

vi.mock('../services/googleAuthService.js', () => ({
    buildKeycloakGoogleAuthUrl: mockBuildKeycloakGoogleAuthUrl,
    exchangeKeycloakCode: mockExchangeKeycloakCode,
    handleUserAuthentication: mockHandleUserAuthentication,
    validateOAuthSession: vi.fn(),
    validateOAuthCallback: vi.fn(),
    markSessionAsUsed: vi.fn(),
    validateRedirectUrl: vi.fn((url: string) => url || '/'),
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

        it('stores PKCE codeVerifier in session and redirects to Keycloak auth URL', async () => {
            const mockAuthUrl = 'https://keycloak.example.com/auth?kc_idp_hint=google';
            mockBuildKeycloakGoogleAuthUrl.mockResolvedValue(mockAuthUrl);

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
            mockBuildKeycloakGoogleAuthUrl.mockRejectedValue(new Error('Keycloak discovery failed'));

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
        it('should redirect with error if OAuth session is missing', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {} as any;

            mockValidateOAuthSession.mockImplementation(() => {
                throw new Error('OAUTH_SESSION_MISSING');
            });

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if state does not match', async () => {
            mockReq.query = { code: 'test-code', state: 'wrong-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'correct-state',
                    codeVerifier: 'test-verifier',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false,
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'correct-state',
                codeVerifier: 'test-verifier',
                client_id: 'test-client',
            });
            mockValidateOAuthCallback.mockImplementation(() => {
                throw new Error('INVALID_OAUTH_STATE');
            });

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if user authentication fails', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'test-state',
                    codeVerifier: 'test-verifier',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false,
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                codeVerifier: 'test-verifier',
                client_id: 'test-client',
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeKeycloakCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockRejectedValue(new Error('AUTHENTICATION_FAILED'));

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect to /portal/login for existing user on successful authentication', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'test-state',
                    codeVerifier: 'test-verifier',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false,
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                codeVerifier: 'test-verifier',
                client_id: 'test-client',
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeKeycloakCode.mockResolvedValue({ emailId: 'existing@example.com', name: 'Existing User' });
            mockHandleUserAuthentication.mockResolvedValue(true);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/portal/login');
            expect(mockExchangeKeycloakCode).toHaveBeenCalledWith(mockReq, 'test-verifier', 'test-state');
            expect(mockHandleUserAuthentication).toHaveBeenCalledWith(
                { emailId: 'existing@example.com', name: 'Existing User' },
                'test-client',
                mockReq
            );
        });

        it('should redirect to /portal/login for new user on successful authentication', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'test-state',
                    codeVerifier: 'test-verifier',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false,
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                codeVerifier: 'test-verifier',
                client_id: 'test-client',
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeKeycloakCode.mockResolvedValue({ emailId: 'newuser@example.com', name: 'New User' });
            mockHandleUserAuthentication.mockResolvedValue(false);

            await handleGoogleAuthCallback(mockReq, mockRes);

            // Both new and existing users go to /portal/login to complete OIDC flow
            expect(mockRes.redirect).toHaveBeenCalledWith('/portal/login');
        });

        it('should clear googleOAuth session data after callback', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'test-state',
                    codeVerifier: 'test-verifier',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false,
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                codeVerifier: 'test-verifier',
                client_id: 'test-client',
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });
            mockExchangeKeycloakCode.mockResolvedValue({ emailId: 'test@example.com', name: 'Test User' });
            mockHandleUserAuthentication.mockResolvedValue(true);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockReq.session?.googleOAuth).toBeUndefined();
        });
    });
});

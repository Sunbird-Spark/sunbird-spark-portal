import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.envExample') });

// Use vi.hoisted to define mocks that can be used in vi.mock
const { mockGoogleAuthService, mockUserService, mockCreateSession, mockHandleUserAuthentication } = vi.hoisted(() => {
    return {
        mockGoogleAuthService: {
            generateAuthUrl: vi.fn(),
            verifyAndGetProfile: vi.fn()
        },
        mockUserService: {
            getUserByEmail: vi.fn(),
            createUserWithEmail: vi.fn()
        },
        mockCreateSession: vi.fn(),
        mockHandleUserAuthentication: vi.fn()
    };
});

// Mock all dependencies before importing controller
vi.mock('../services/googleAuthService.js', () => ({
    default: mockGoogleAuthService,
    createSession: mockCreateSession,
    validateOAuthSession: vi.fn(),
    validateOAuthCallback: vi.fn(),
    markSessionAsUsed: vi.fn(),
    handleUserAuthentication: mockHandleUserAuthentication,
    validateRedirectUrl: vi.fn((url) => url || '/')
}));

vi.mock('@/services/googleAuthService.js', () => ({
    default: mockGoogleAuthService,
    createSession: mockCreateSession,
    validateOAuthSession: vi.fn(),
    validateOAuthCallback: vi.fn(),
    markSessionAsUsed: vi.fn(),
    handleUserAuthentication: mockHandleUserAuthentication,
    validateRedirectUrl: vi.fn((url) => url || '/')
}));

vi.mock('../services/userService.js', () => mockUserService);

vi.mock('../services/kongAuthService.js', () => ({
    generateKongToken: vi.fn().mockResolvedValue('mock-kong-token')
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

        // Set up mock request and response
        mockReq = {
            query: {},
            session: {} as any,
            sessionID: 'test-session-id',
            get: vi.fn()
        };

        mockRes = {
            redirect: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
    });

    describe('GET /google/auth', () => {
        it('redirects to home when any required query param is missing', () => {
            const cases = [
                {},
                { redirect_uri: 'https://example.com/callback', error_callback: 'https://example.com/error' },
                { client_id: 'test-client', error_callback: 'https://example.com/error' },
                { client_id: 'test-client', redirect_uri: 'https://example.com/callback' },
            ];

            for (const q of cases) {
                mockReq.query = q;
                initiateGoogleAuth(mockReq, mockRes);
                expect(mockRes.redirect).toHaveBeenCalledWith('/');
                (mockRes.redirect as any).mockClear();
            }
        });

        it('returns 400 for invalid redirect_uri hostname', () => {
            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://malicious.com/callback',
                error_callback: 'https://example.com/error',
            };

            mockValidateRedirectUrl.mockReturnValue('/');

            initiateGoogleAuth(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('INVALID_REDIRECT_URI_OR_ERROR_CALLBACK');
        });

        it('stores OAuth data in session and redirects to Google auth URL', () => {
            const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test';
            mockGoogleAuthService.generateAuthUrl.mockReturnValue(mockAuthUrl);

            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            initiateGoogleAuth(mockReq, mockRes);

            expect(mockReq.session?.googleOAuth).toBeDefined();
            expect(mockReq.session?.googleOAuth?.client_id).toBe('test-client');
            expect(mockReq.session?.googleOAuth?.redirect_uri).toBe('https://example.com/callback');
            expect(mockReq.session?.googleOAuth?.error_callback).toBe('https://example.com/error');
            expect(mockReq.session?.googleOAuth?.nonce).toBeDefined();
            expect(mockReq.session?.googleOAuth?.state).toBeDefined();
            expect(mockRes.redirect).toHaveBeenCalledWith(mockAuthUrl);
        });

        it('redirects to error_callback on exception', () => {
            mockGoogleAuthService.generateAuthUrl.mockImplementation(() => {
                throw new Error('Auth URL generation failed');
            });

            mockReq.query = {
                client_id: 'test-client',
                redirect_uri: 'https://example.com/callback',
                error_callback: 'https://example.com/error',
            };

            initiateGoogleAuth(mockReq, mockRes);

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
                    nonce: 'test-nonce',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'correct-state',
                nonce: 'test-nonce',
                client_id: 'test-client'
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
                    nonce: 'test-nonce',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                nonce: 'test-nonce',
                client_id: 'test-client'
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });

            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'test@example.com',
                name: 'Test User'
            });

            mockHandleUserAuthentication.mockRejectedValue(new Error('AUTHENTICATION_FAILED'));

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect to /home for existing user on successful authentication', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'test-state',
                    nonce: 'test-nonce',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                nonce: 'test-nonce',
                client_id: 'test-client'
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });

            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'existing@example.com',
                name: 'Existing User'
            });

            mockHandleUserAuthentication.mockResolvedValue(true);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/home');
            expect(mockHandleUserAuthentication).toHaveBeenCalledWith(
                { emailId: 'existing@example.com', name: 'Existing User' },
                'test-client',
                mockReq
            );
        });

        it('should redirect to /onboarding for new user on successful authentication', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'test-state',
                    nonce: 'test-nonce',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                nonce: 'test-nonce',
                client_id: 'test-client'
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });

            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'newuser@example.com',
                name: 'New User'
            });

            mockHandleUserAuthentication.mockResolvedValue(false);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/onboarding');
            expect(mockHandleUserAuthentication).toHaveBeenCalledWith(
                { emailId: 'newuser@example.com', name: 'New User' },
                'test-client',
                mockReq
            );
        });

        it('should clear googleOAuth session data after callback', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {
                googleOAuth: {
                    state: 'test-state',
                    nonce: 'test-nonce',
                    client_id: 'test-client',
                    redirect_uri: 'https://example.com/callback',
                    error_callback: 'https://example.com/error',
                    timestamp: Date.now(),
                    sessionUsed: false
                }
            } as any;

            mockValidateOAuthSession.mockReturnValue({
                state: 'test-state',
                nonce: 'test-nonce',
                client_id: 'test-client'
            });
            mockValidateOAuthCallback.mockReturnValue('test-code');
            mockMarkSessionAsUsed.mockImplementation(() => { });

            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'test@example.com',
                name: 'Test User'
            });

            mockHandleUserAuthentication.mockResolvedValue(true);

            await handleGoogleAuthCallback(mockReq, mockRes);

            expect(mockReq.session?.googleOAuth).toBeUndefined();
        });
    });
});

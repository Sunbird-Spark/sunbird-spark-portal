import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.envExample') });

// Use vi.hoisted to define mocks that can be used in vi.mock
const { mockGoogleAuthService, mockUserService, mockCreateSession } = vi.hoisted(() => {
    return {
        mockGoogleAuthService: {
            generateAuthUrl: vi.fn(),
            verifyAndGetProfile: vi.fn()
        },
        mockUserService: {
            fetchUserByEmailId: vi.fn(),
            createUserWithMailId: vi.fn()
        },
        mockCreateSession: vi.fn()
    };
});

// Mock all dependencies before importing controller
vi.mock('../services/googleAuthService.js', () => ({
    default: mockGoogleAuthService,
    createSession: mockCreateSession
}));

vi.mock('@/services/googleAuthService.js', () => ({
    default: mockGoogleAuthService,
    createSession: mockCreateSession
}));

vi.mock('../services/userService.js', () => mockUserService);

vi.mock('../services/kongAuthService.js', () => ({
    generateKongToken: vi.fn().mockResolvedValue('mock-kong-token')
}));

describe('GoogleController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let handleGoogleAuthCallback: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        process.env.DOMAIN_URL = 'https://example.com';
        
        const controller = await import('../controllers/googleController.js');
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

    // GET /google/auth tests moved to googleController.auth.test.ts

    describe('GET /google/auth/callback', () => {
        it('should redirect with error if OAuth session is missing', async () => {
            mockReq.query = { code: 'test-code', state: 'test-state' };
            mockReq.session = {} as any;
            
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
            
            await handleGoogleAuthCallback(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if Google email is not found', async () => {
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
            
            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: null,
                name: 'Test User'
            });
            
            await handleGoogleAuthCallback(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if fetching user fails', async () => {
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
            
            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'test@example.com',
                name: 'Test User'
            });
            
            mockUserService.fetchUserByEmailId.mockRejectedValue(new Error('Fetch failed'));
            
            await handleGoogleAuthCallback(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if creating user fails', async () => {
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
            
            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'newuser@example.com',
                name: 'New User'
            });
            
            mockUserService.fetchUserByEmailId.mockResolvedValue(null);
            mockUserService.createUserWithMailId.mockRejectedValue(new Error('Create failed'));
            
            await handleGoogleAuthCallback(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_SIGN_IN_FAILED');
        });

        it('should redirect with error if session creation fails', async () => {
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
            
            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'test@example.com',
                name: 'Test User'
            });
            
            mockUserService.fetchUserByEmailId.mockResolvedValue(true);
            mockCreateSession.mockRejectedValue(new Error('Session creation failed'));
            
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
            
            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'existing@example.com',
                name: 'Existing User'
            });
            
            mockUserService.fetchUserByEmailId.mockResolvedValue(true);
            mockCreateSession.mockResolvedValue({
                access_token: 'mock-token',
                expires_in: 3600
            });
            
            await handleGoogleAuthCallback(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalledWith('/home');
            expect(mockUserService.createUserWithMailId).not.toHaveBeenCalled();
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
            
            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'newuser@example.com',
                name: 'New User'
            });
            
            mockUserService.fetchUserByEmailId.mockResolvedValue(null);
            mockUserService.createUserWithMailId.mockResolvedValue({
                responseCode: 'OK',
                result: { userId: 'new-user-id' }
            });
            mockCreateSession.mockResolvedValue({
                access_token: 'mock-token',
                expires_in: 3600
            });
            
            await handleGoogleAuthCallback(mockReq, mockRes);
            
            expect(mockRes.redirect).toHaveBeenCalledWith('/onboarding');
            expect(mockUserService.createUserWithMailId).toHaveBeenCalledWith(
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
            
            mockGoogleAuthService.verifyAndGetProfile.mockResolvedValue({
                emailId: 'test@example.com',
                name: 'Test User'
            });
            
            mockUserService.fetchUserByEmailId.mockResolvedValue(true);
            mockCreateSession.mockResolvedValue({
                access_token: 'mock-token',
                expires_in: 3600
            });
            
            await handleGoogleAuthCallback(mockReq, mockRes);
            
            expect(mockReq.session?.googleOAuth).toBeUndefined();
        });
    });
});

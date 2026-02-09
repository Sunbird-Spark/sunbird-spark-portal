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
    handleUserAuthentication: mockHandleUserAuthentication
}));

vi.mock('@/services/googleAuthService.js', () => ({
    default: mockGoogleAuthService,
    createSession: mockCreateSession,
    validateOAuthSession: vi.fn(),
    validateOAuthCallback: vi.fn(),
    markSessionAsUsed: vi.fn(),
    handleUserAuthentication: mockHandleUserAuthentication
}));

vi.mock('../services/userService.js', () => mockUserService);

vi.mock('../services/kongAuthService.js', () => ({
    generateKongToken: vi.fn().mockResolvedValue('mock-kong-token')
}));

describe('GoogleController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let handleGoogleAuthCallback: any;
    let mockValidateOAuthSession: any;
    let mockValidateOAuthCallback: any;
    let mockMarkSessionAsUsed: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        process.env.DOMAIN_URL = 'https://example.com';
        
        const googleAuthService = await import('../services/googleAuthService.js');
        mockValidateOAuthSession = googleAuthService.validateOAuthSession as any;
        mockValidateOAuthCallback = googleAuthService.validateOAuthCallback as any;
        mockMarkSessionAsUsed = googleAuthService.markSessionAsUsed as any;
        
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
            mockMarkSessionAsUsed.mockImplementation(() => {});
            
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
                mockReq,
                mockRes
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
            mockMarkSessionAsUsed.mockImplementation(() => {});
            
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
                mockReq,
                mockRes
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
            mockMarkSessionAsUsed.mockImplementation(() => {});
            
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

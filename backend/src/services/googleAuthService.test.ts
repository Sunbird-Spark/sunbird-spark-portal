import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Request, Response } from 'express';

// Use vi.hoisted to create mocks that can be used in vi.mock factories
const { 
    mockGenerateAuthUrl,
    mockGetToken,
    mockVerifyIdToken,
    mockObtainDirectly,
    mockStoreGrant,
    mockAuthenticated,
    mockOAuth2Constructor,
    mockOAuth2ClientConstructor
} = vi.hoisted(() => {
    const mockGenerateAuthUrl = vi.fn();
    const mockGetToken = vi.fn();
    const mockVerifyIdToken = vi.fn();
    const mockObtainDirectly = vi.fn();
    const mockStoreGrant = vi.fn();
    const mockAuthenticated = vi.fn();
    const mockOAuth2Constructor = vi.fn(function() {
        return {
            generateAuthUrl: mockGenerateAuthUrl,
            getToken: mockGetToken
        };
    });
    const mockOAuth2ClientConstructor = vi.fn(function() {
        return {
            verifyIdToken: mockVerifyIdToken
        };
    });
    
    return {
        mockGenerateAuthUrl,
        mockGetToken,
        mockVerifyIdToken,
        mockObtainDirectly,
        mockStoreGrant,
        mockAuthenticated,
        mockOAuth2Constructor,
        mockOAuth2ClientConstructor
    };
});

// Mock modules before importing
vi.mock('googleapis', () => ({
    google: {
        auth: {
            OAuth2: mockOAuth2Constructor
        }
    }
}));

vi.mock('google-auth-library', () => ({
    OAuth2Client: mockOAuth2ClientConstructor
}));

vi.mock('../auth/keycloakManager.js', () => ({
    getKeycloakClient: vi.fn(() => ({
        grantManager: {
            obtainDirectly: mockObtainDirectly
        },
        storeGrant: mockStoreGrant,
        authenticated: mockAuthenticated
    }))
}));

vi.mock('../utils/sessionStore.js', () => ({
    sessionStore: {}
}));

vi.mock('../utils/logger.js', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn()
    }
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        PORTAL_REALM: 'test-realm',
        DOMAIN_URL: 'https://example.com',
        KEYCLOAK_GOOGLE_CLIENT_ID: 'test-keycloak-client-id',
        KEYCLOAK_GOOGLE_CLIENT_SECRET: 'test-keycloak-secret',
        GOOGLE_OAUTH_CLIENT_ID: 'test-google-client-id',
        GOOGLE_OAUTH_CLIENT_SECRET: 'test-google-secret'
    }
}));

import googleOauth, { 
    createSession, 
    validateOAuthSession, 
    validateOAuthCallback, 
    markSessionAsUsed,
    handleUserAuthentication 
} from './googleAuthService.js';
import logger from '../utils/logger.js';

describe('GoogleAuthService', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset mock implementations
        mockGenerateAuthUrl.mockReset();
        mockGetToken.mockReset();
        mockVerifyIdToken.mockReset();
        mockObtainDirectly.mockReset();
        mockStoreGrant.mockReset();
        mockAuthenticated.mockReset();

        mockRequest = {
            get: vi.fn((header: string) => {
                if (header === 'host') return 'example.com';
                return undefined;
            }) as any,
            session: {} as any,
            kauth: undefined
        };

        mockResponse = {
            cookie: vi.fn(),
            clearCookie: vi.fn()
        };
    });

    describe('createClient', () => {
        it('should create OAuth2 client with correct parameters', () => {
            const client = googleOauth.createClient(mockRequest as Request);
            expect(client).toBeDefined();
        });

        it('should throw error when host header is missing', () => {
            (mockRequest.get as Mock).mockReturnValue(undefined);
            expect(() => googleOauth.createClient(mockRequest as Request)).toThrow('HOST_HEADER_MISSING');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('generateAuthUrl', () => {
        it('should generate auth URL with correct parameters', () => {
            const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test';
            mockGenerateAuthUrl.mockReturnValue(mockAuthUrl);

            const result = googleOauth.generateAuthUrl({
                nonce: 'test-nonce',
                state: 'test-state',
                req: mockRequest as Request
            });

            expect(result).toBe(mockAuthUrl);
            expect(mockGenerateAuthUrl).toHaveBeenCalledWith({
                access_type: 'offline',
                response_type: 'code',
                scope: ['openid', 'email', 'profile'],
                state: 'test-state',
                nonce: 'test-nonce',
                prompt: 'consent'
            });
        });

        it('should throw error when client creation fails', () => {
            (mockRequest.get as Mock).mockReturnValue(undefined);
            expect(() => googleOauth.generateAuthUrl({
                nonce: 'test-nonce',
                state: 'test-state',
                req: mockRequest as Request
            })).toThrow('HOST_HEADER_MISSING');
        });
    });

    describe('verifyAndGetProfile', () => {
        const mockTokens = { id_token: 'test-id-token', access_token: 'test-access-token' };
        const mockPayload = {
            email: 'test@example.com',
            name: 'Test User',
            email_verified: true,
            nonce: 'test-nonce'
        };

        it('should verify token and return user profile', async () => {
            mockGetToken.mockResolvedValue({ tokens: mockTokens });
            mockVerifyIdToken.mockResolvedValue({ getPayload: () => mockPayload });

            const result = await googleOauth.verifyAndGetProfile({
                code: 'test-code',
                nonce: 'test-nonce',
                req: mockRequest as Request
            });

            expect(result).toEqual({ emailId: 'test@example.com', name: 'Test User' });
            expect(mockGetToken).toHaveBeenCalledWith('test-code');
        });

        it('should throw error when token fetch fails', async () => {
            mockGetToken.mockRejectedValue(new Error('Token fetch failed'));
            await expect(googleOauth.verifyAndGetProfile({
                code: 'test-code',
                nonce: 'test-nonce',
                req: mockRequest as Request
            })).rejects.toThrow();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw error for invalid tokens or payload', async () => {
            mockGetToken.mockResolvedValue({ tokens: { access_token: 'test' } });
            await expect(googleOauth.verifyAndGetProfile({
                code: 'test-code',
                nonce: 'test-nonce',
                req: mockRequest as Request
            })).rejects.toThrow('FAILED_TO_FETCH_ID_TOKEN');
        });

        it('should throw error for unverified email or invalid nonce', async () => {
            mockGetToken.mockResolvedValue({ tokens: mockTokens });
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({ ...mockPayload, email_verified: false })
            });
            await expect(googleOauth.verifyAndGetProfile({
                code: 'test-code',
                nonce: 'test-nonce',
                req: mockRequest as Request
            })).rejects.toThrow('EMAIL_NOT_VERIFIED');
        });
    });

    describe('createSession', () => {
        const mockGrant = {
            access_token: { token: 'test-access-token', content: { exp: 1234567890 } }
        };

        beforeEach(() => {
            mockObtainDirectly.mockResolvedValue(mockGrant);
            mockAuthenticated.mockResolvedValue(undefined);
        });

        it('should create session successfully', async () => {
            const result = await createSession('test@example.com', mockRequest as Request, mockResponse as Response);

            expect(result).toEqual({ access_token: 'test-access-token', expires_in: 1234567890 });
            expect(mockObtainDirectly).toHaveBeenCalledWith('test@example.com', '');
            expect(mockStoreGrant).toHaveBeenCalledWith(mockGrant, mockRequest, mockResponse);
            expect(mockRequest.kauth).toEqual({ grant: mockGrant });
        });

        it('should throw error when session creation fails', async () => {
            mockObtainDirectly.mockRejectedValue(new Error('Grant failed'));
            await expect(createSession('test@example.com', mockRequest as Request, mockResponse as Response))
                .rejects.toThrow('Grant failed');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw error when grant token is invalid', async () => {
            mockObtainDirectly.mockResolvedValue({ access_token: null });
            await expect(createSession('test@example.com', mockRequest as Request, mockResponse as Response))
                .rejects.toThrow('INVALID_GRANT_TOKEN');
        });
    });

    describe('validateOAuthSession', () => {
        it('should validate OAuth session successfully', () => {
            mockRequest.session = {
                googleOAuth: {
                    state: 'test-state',
                    nonce: 'test-nonce',
                    client_id: 'test-client-id',
                    timestamp: Date.now(),
                    sessionUsed: false
                }
            } as any;

            const result = validateOAuthSession(mockRequest as Request);
            expect(result).toEqual({
                state: 'test-state',
                nonce: 'test-nonce',
                client_id: 'test-client-id'
            });
        });

        it('should throw error when OAuth session is missing', () => {
            mockRequest.session = {} as any;
            expect(() => validateOAuthSession(mockRequest as Request)).toThrow('OAUTH_SESSION_MISSING');
        });

        it('should throw error when OAuth session is already used', () => {
            mockRequest.session = {
                googleOAuth: {
                    state: 'test-state',
                    nonce: 'test-nonce',
                    client_id: 'test-client-id',
                    timestamp: Date.now(),
                    sessionUsed: true
                }
            } as any;

            expect(() => validateOAuthSession(mockRequest as Request)).toThrow('OAUTH_SESSION_ALREADY_USED');
            expect(logger.error).toHaveBeenCalledWith('Oauth session already used');
        });

        it('should throw error when OAuth session is expired', () => {
            mockRequest.session = {
                googleOAuth: {
                    state: 'test-state',
                    nonce: 'test-nonce',
                    client_id: 'test-client-id',
                    timestamp: Date.now() - (6 * 60 * 1000), // 6 minutes ago
                    sessionUsed: false
                }
            } as any;

            expect(() => validateOAuthSession(mockRequest as Request)).toThrow('OAUTH_SESSION_EXPIRED');
            expect(logger.error).toHaveBeenCalledWith('Oauth session expired');
        });
    });

    describe('validateOAuthCallback', () => {
        it('should validate OAuth callback successfully', () => {
            mockRequest.query = {
                state: 'test-state',
                code: 'test-code'
            };

            const result = validateOAuthCallback(mockRequest as Request, 'test-state');
            expect(result).toBe('test-code');
        });

        it('should throw error when state does not match', () => {
            mockRequest.query = {
                state: 'wrong-state',
                code: 'test-code'
            };

            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('INVALID_OAUTH_STATE');
        });

        it('should throw error when OAuth error is present', () => {
            mockRequest.query = {
                state: 'test-state',
                error: 'access_denied'
            };

            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('GOOGLE_OAUTH_ERROR: access_denied');
            expect(logger.error).toHaveBeenCalledWith('Google OAuth error:', 'access_denied');
        });

        it('should throw error when code is missing', () => {
            mockRequest.query = {
                state: 'test-state'
            };

            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('OAUTH_CODE_INVALID');
        });

        it('should throw error when code is not a string', () => {
            mockRequest.query = {
                state: 'test-state',
                code: 123 as any
            };

            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('OAUTH_CODE_INVALID');
        });

        it('should throw error when code is an array', () => {
            mockRequest.query = {
                state: 'test-state',
                code: ['test-code-1', 'test-code-2'] as any
            };

            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('OAUTH_CODE_INVALID');
        });
    });

    describe('markSessionAsUsed', () => {
        it('should mark session as used', () => {
            mockRequest.session = {
                googleOAuth: {
                    state: 'test-state',
                    nonce: 'test-nonce',
                    client_id: 'test-client-id',
                    timestamp: Date.now(),
                    sessionUsed: false
                }
            } as any;

            markSessionAsUsed(mockRequest as Request);
            expect(mockRequest.session.googleOAuth?.sessionUsed).toBe(true);
        });

        it('should handle missing googleOAuth session gracefully', () => {
            mockRequest.session = {} as any;
            expect(() => markSessionAsUsed(mockRequest as Request)).not.toThrow();
        });
    });

    describe('handleUserAuthentication', () => {
        const mockGetUserByEmail = vi.fn();
        const mockCreateUserWithEmail = vi.fn();

        beforeEach(() => {
            vi.clearAllMocks();
            mockGetUserByEmail.mockReset();
            mockCreateUserWithEmail.mockReset();
            
            const mockGrant = {
                access_token: { token: 'test-access-token', content: { exp: 1234567890 } }
            };
            mockObtainDirectly.mockResolvedValue(mockGrant);
            mockAuthenticated.mockResolvedValue(undefined);

            vi.doMock('./userService.js', () => ({
                getUserByEmail: mockGetUserByEmail,
                createUserWithEmail: mockCreateUserWithEmail
            }));
        });

        it('should authenticate existing user successfully', async () => {
            mockGetUserByEmail.mockResolvedValue({ email: 'test@example.com' });

            const result = await handleUserAuthentication(
                { emailId: 'test@example.com', name: 'Test User' },
                'test-client-id',
                mockRequest as Request,
                mockResponse as Response
            );

            expect(result).toBe(true);
            expect(mockCreateUserWithEmail).not.toHaveBeenCalled();
        });

        it('should create and authenticate new user successfully', async () => {
            mockGetUserByEmail.mockResolvedValue(null);
            mockCreateUserWithEmail.mockResolvedValue({ email: 'test@example.com' });

            const result = await handleUserAuthentication(
                { emailId: 'test@example.com', name: 'Test User' },
                'test-client-id',
                mockRequest as Request,
                mockResponse as Response
            );

            expect(result).toBe(false);
            expect(mockCreateUserWithEmail).toHaveBeenCalledWith(
                { emailId: 'test@example.com', name: 'Test User' },
                'test-client-id',
                mockRequest
            );
        });

        it('should throw error when emailId is missing', async () => {
            await expect(handleUserAuthentication(
                { name: 'Test User' },
                'test-client-id',
                mockRequest as Request,
                mockResponse as Response
            )).rejects.toThrow('GOOGLE_EMAIL_NOT_FOUND');
        });

        it('should throw error when fetching user fails', async () => {
            mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

            await expect(handleUserAuthentication(
                { emailId: 'test@example.com', name: 'Test User' },
                'test-client-id',
                mockRequest as Request,
                mockResponse as Response
            )).rejects.toThrow('FETCH_USER_FAILED');
            expect(logger.error).toHaveBeenCalledWith('Error fetching user by email:', expect.any(Error));
        });

        it('should throw error when creating user fails', async () => {
            mockGetUserByEmail.mockResolvedValue(null);
            mockCreateUserWithEmail.mockRejectedValue(new Error('Create user error'));

            await expect(handleUserAuthentication(
                { emailId: 'test@example.com', name: 'Test User' },
                'test-client-id',
                mockRequest as Request,
                mockResponse as Response
            )).rejects.toThrow('CREATE_USER_FAILED');
            expect(logger.error).toHaveBeenCalledWith('Error creating user:', expect.any(Error));
        });

        it('should throw error when session creation fails', async () => {
            mockGetUserByEmail.mockResolvedValue({ email: 'test@example.com' });
            mockObtainDirectly.mockRejectedValue(new Error('Session error'));

            await expect(handleUserAuthentication(
                { emailId: 'test@example.com', name: 'Test User' },
                'test-client-id',
                mockRequest as Request,
                mockResponse as Response
            )).rejects.toThrow('SESSION_CREATION_FAILED');
            expect(logger.error).toHaveBeenCalledWith('Error creating session:', expect.any(Error));
        });
    });
});

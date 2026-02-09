import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Use vi.hoisted to create mocks that can be used in vi.mock factories
const { 
    mockObtainDirectly,
    mockStoreGrant,
    mockAuthenticated
} = vi.hoisted(() => {
    const mockObtainDirectly = vi.fn();
    const mockStoreGrant = vi.fn();
    const mockAuthenticated = vi.fn();
    
    return {
        mockObtainDirectly,
        mockStoreGrant,
        mockAuthenticated
    };
});

vi.mock('googleapis', () => ({
    google: {
        auth: {
            OAuth2: vi.fn()
        }
    }
}));

vi.mock('google-auth-library', () => ({
    OAuth2Client: vi.fn()
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

import { 
    validateOAuthSession, 
    validateOAuthCallback, 
    markSessionAsUsed,
    handleUserAuthentication 
} from './googleAuthService.js';

describe('GoogleAuthService - Validation & Helpers', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
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

    describe('validateOAuthSession', () => {
        it('should validate valid session and reject invalid ones', () => {
            // Valid session
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
            expect(result).toEqual({ state: 'test-state', nonce: 'test-nonce', client_id: 'test-client-id' });

            // Missing session
            mockRequest.session = {} as any;
            expect(() => validateOAuthSession(mockRequest as Request)).toThrow('OAUTH_SESSION_MISSING');

            // Already used
            mockRequest.session = { googleOAuth: { state: 'test-state', nonce: 'test-nonce', client_id: 'test-client-id', sessionUsed: true, timestamp: Date.now() } } as any;
            expect(() => validateOAuthSession(mockRequest as Request)).toThrow('OAUTH_SESSION_ALREADY_USED');

            // Expired session
            mockRequest.session = { googleOAuth: { state: 'test-state', nonce: 'test-nonce', client_id: 'test-client-id', timestamp: Date.now() - (6 * 60 * 1000), sessionUsed: false } } as any;
            expect(() => validateOAuthSession(mockRequest as Request)).toThrow('OAUTH_SESSION_EXPIRED');
        });
    });

    describe('validateOAuthCallback', () => {
        it('should validate callback and handle errors', () => {
            // Valid callback
            mockRequest.query = { state: 'test-state', code: 'test-code' };
            expect(validateOAuthCallback(mockRequest as Request, 'test-state')).toBe('test-code');

            // Invalid state
            mockRequest.query = { state: 'wrong-state', code: 'test-code' };
            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('INVALID_OAUTH_STATE');

            // OAuth error
            mockRequest.query = { state: 'test-state', error: 'access_denied' };
            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('GOOGLE_OAUTH_ERROR: access_denied');

            // Invalid codes
            mockRequest.query = { state: 'test-state' };
            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('OAUTH_CODE_INVALID');
            mockRequest.query = { state: 'test-state', code: 123 as any };
            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('OAUTH_CODE_INVALID');
            mockRequest.query = { state: 'test-state', code: ['code-1', 'code-2'] as any };
            expect(() => validateOAuthCallback(mockRequest as Request, 'test-state')).toThrow('OAUTH_CODE_INVALID');
        });
    });

    describe('markSessionAsUsed', () => {
        it('should mark session as used or handle missing session', () => {
            // Mark existing session
            mockRequest.session = { googleOAuth: { state: 'test-state', nonce: 'test-nonce', client_id: 'test-client-id', timestamp: Date.now(), sessionUsed: false } } as any;
            markSessionAsUsed(mockRequest as Request);
            expect(mockRequest.session?.googleOAuth?.sessionUsed).toBe(true);

            // Handle missing session
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
            mockObtainDirectly.mockResolvedValue({ access_token: { token: 'test-access-token', content: { exp: 1234567890 } } });
            mockAuthenticated.mockResolvedValue(undefined);
            vi.doMock('./userService.js', () => ({ getUserByEmail: mockGetUserByEmail, createUserWithEmail: mockCreateUserWithEmail }));
        });

        it('should handle existing and new user authentication', async () => {
            // Existing user
            mockGetUserByEmail.mockResolvedValue({ email: 'test@example.com' });
            let result = await handleUserAuthentication({ emailId: 'test@example.com', name: 'Test User' }, 'test-client-id', mockRequest as Request, mockResponse as Response);
            expect(result).toBe(true);
            expect(mockCreateUserWithEmail).not.toHaveBeenCalled();

            // New user
            mockGetUserByEmail.mockResolvedValue(null);
            mockCreateUserWithEmail.mockResolvedValue({ email: 'test@example.com' });
            result = await handleUserAuthentication({ emailId: 'test@example.com', name: 'Test User' }, 'test-client-id', mockRequest as Request, mockResponse as Response);
            expect(result).toBe(false);
            expect(mockCreateUserWithEmail).toHaveBeenCalled();
        });

        it('should handle authentication errors', async () => {
            // Missing email
            await expect(handleUserAuthentication({ name: 'Test User' }, 'test-client-id', mockRequest as Request, mockResponse as Response)).rejects.toThrow('GOOGLE_EMAIL_NOT_FOUND');

            // Fetch user error
            mockGetUserByEmail.mockRejectedValue(new Error('Database error'));
            await expect(handleUserAuthentication({ emailId: 'test@example.com', name: 'Test User' }, 'test-client-id', mockRequest as Request, mockResponse as Response)).rejects.toThrow('FETCH_USER_FAILED');

            // Create user error
            mockGetUserByEmail.mockResolvedValue(null);
            mockCreateUserWithEmail.mockRejectedValue(new Error('Create user error'));
            await expect(handleUserAuthentication({ emailId: 'test@example.com', name: 'Test User' }, 'test-client-id', mockRequest as Request, mockResponse as Response)).rejects.toThrow('CREATE_USER_FAILED');

            // Session creation error
            mockGetUserByEmail.mockResolvedValue({ email: 'test@example.com' });
            mockObtainDirectly.mockRejectedValue(new Error('Session error'));
            await expect(handleUserAuthentication({ emailId: 'test@example.com', name: 'Test User' }, 'test-client-id', mockRequest as Request, mockResponse as Response)).rejects.toThrow('SESSION_CREATION_FAILED');
        });
    });
});

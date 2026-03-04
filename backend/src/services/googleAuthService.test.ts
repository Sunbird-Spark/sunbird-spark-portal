import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Request } from 'express';

// Use vi.hoisted to create mocks that can be used in vi.mock factories
const {
    mockGenerateAuthUrl,
    mockGetToken,
    mockVerifyIdToken,
    mockClientCredentialsGrant,
    mockGetGoogleOIDCConfig,
    mockDecodeJwtPayload,
    mockSaveSession,
    mockOAuth2Constructor,
    mockOAuth2ClientConstructor
} = vi.hoisted(() => {
    const mockGenerateAuthUrl = vi.fn();
    const mockGetToken = vi.fn();
    const mockVerifyIdToken = vi.fn();
    const mockClientCredentialsGrant = vi.fn();
    const mockGetGoogleOIDCConfig = vi.fn().mockResolvedValue({});
    const mockDecodeJwtPayload = vi.fn().mockReturnValue({ exp: 1234567890 });
    const mockSaveSession = vi.fn().mockResolvedValue(undefined);
    const mockOAuth2Constructor = vi.fn(function () {
        return {
            generateAuthUrl: mockGenerateAuthUrl,
            getToken: mockGetToken
        };
    });
    const mockOAuth2ClientConstructor = vi.fn(function () {
        return {
            verifyIdToken: mockVerifyIdToken
        };
    });

    return {
        mockGenerateAuthUrl,
        mockGetToken,
        mockVerifyIdToken,
        mockClientCredentialsGrant,
        mockGetGoogleOIDCConfig,
        mockDecodeJwtPayload,
        mockSaveSession,
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

vi.mock('../auth/oidcProvider.js', () => ({
    getGoogleOIDCConfig: mockGetGoogleOIDCConfig,
    decodeJwtPayload: mockDecodeJwtPayload
}));

vi.mock('openid-client', () => ({
    clientCredentialsGrant: mockClientCredentialsGrant
}));

vi.mock('../utils/sessionUtils.js', () => ({
    saveSession: mockSaveSession
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

import googleOauth, { createSession } from './googleAuthService.js';
import logger from '../utils/logger.js';

describe('GoogleAuthService - Core OAuth', () => {
    let mockRequest: Partial<Request>;


    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock implementations
        mockGenerateAuthUrl.mockReset();
        mockGetToken.mockReset();
        mockVerifyIdToken.mockReset();
        mockClientCredentialsGrant.mockReset();
        mockGetGoogleOIDCConfig.mockResolvedValue({});
        mockDecodeJwtPayload.mockReturnValue({ exp: 1234567890 });
        mockSaveSession.mockResolvedValue(undefined);

        mockRequest = {
            get: vi.fn((header: string) => {
                if (header === 'host') return 'example.com';
                return undefined;
            }) as any,
            session: {} as any,
            oidc: undefined
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
        const mockTokens = {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            id_token: 'test-id-token'
        };

        beforeEach(() => {
            mockClientCredentialsGrant.mockResolvedValue(mockTokens);
        });

        it('should create session successfully', async () => {
            const result = await createSession('test@example.com', mockRequest as Request);

            expect(result).toEqual({ access_token: 'test-access-token', expires_at: 1234567890 });
            expect(mockClientCredentialsGrant).toHaveBeenCalled();
            expect(mockRequest.oidc?.isAuthenticated).toBe(true);
            expect((mockRequest.session as any)['oidc-tokens']).toEqual({
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                id_token: 'test-id-token'
            });
        });

        it('should throw error when session creation fails', async () => {
            mockClientCredentialsGrant.mockRejectedValue(new Error('Grant failed'));
            await expect(createSession('test@example.com', mockRequest as Request))
                .rejects.toThrow('Grant failed');
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw error when grant token is invalid', async () => {
            mockClientCredentialsGrant.mockResolvedValue({ access_token: null });
            mockDecodeJwtPayload.mockReturnValue(null);
            await expect(createSession('test@example.com', mockRequest as Request))
                .rejects.toThrow('INVALID_GRANT_TOKEN');
        });
    });
});

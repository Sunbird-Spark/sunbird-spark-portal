import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateAuthUrl, mockGetToken, mockVerifyIdToken } = vi.hoisted(() => ({
    mockGenerateAuthUrl: vi.fn(),
    mockGetToken: vi.fn(),
    mockVerifyIdToken: vi.fn(),
}));

vi.mock('google-auth-library', () => {
    class MockOAuth2Client {
        generateAuthUrl(opts: unknown) { return mockGenerateAuthUrl(opts); }
        getToken(opts: unknown) { return mockGetToken(opts); }
        verifyIdToken(opts: unknown) { return mockVerifyIdToken(opts); }
    }
    return { OAuth2Client: MockOAuth2Client };
});

vi.mock('../utils/logger.js', () => ({
    default: { error: vi.fn(), info: vi.fn() },
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        PORTAL_REALM: 'test-realm',
        DOMAIN_URL: 'https://example.com',
        GOOGLE_OAUTH_CLIENT_ID: 'test-google-client-id',
        GOOGLE_OAUTH_CLIENT_SECRET: 'test-google-secret',
    },
}));

import { buildGoogleAuthUrl, exchangeGoogleCode } from './googleAuthService.js';

const DEFAULT_PAYLOAD = {
    sub: 'google-user-id',
    email: 'test@example.com',
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
};

describe('GoogleAuthService - direct Google OAuth flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGenerateAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?mock=1');
        mockGetToken.mockResolvedValue({ tokens: { id_token: 'mock-id-token' } });
        mockVerifyIdToken.mockResolvedValue({ getPayload: () => DEFAULT_PAYLOAD });
    });

    describe('buildGoogleAuthUrl', () => {
        it('should return a Google authorization URL', () => {
            const url = buildGoogleAuthUrl('test-state', 'test-challenge');

            expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
                expect.objectContaining({
                    scope: ['openid', 'email', 'profile'],
                    state: 'test-state',
                    code_challenge: 'test-challenge',
                    code_challenge_method: 'S256',
                    access_type: 'online',
                })
            );
            expect(url).toContain('accounts.google.com');
        });
    });

    describe('exchangeGoogleCode', () => {
        it('should exchange code and return email + name from ID token', async () => {
            const result = await exchangeGoogleCode('test-code', 'test-verifier');

            expect(mockGetToken).toHaveBeenCalledWith({ code: 'test-code', codeVerifier: 'test-verifier' });
            expect(mockVerifyIdToken).toHaveBeenCalledWith({
                idToken: 'mock-id-token',
                audience: 'test-google-client-id',
            });
            expect(result).toEqual({ emailId: 'test@example.com', name: 'Test User' });
        });

        it('should fall back to given_name + family_name if name claim is absent', async () => {
            mockVerifyIdToken.mockResolvedValueOnce({
                getPayload: () => ({
                    sub: 'google-user-id',
                    email: 'user@example.com',
                    given_name: 'Jane',
                    family_name: 'Doe',
                }),
            });

            const result = await exchangeGoogleCode('test-code', 'test-verifier');

            expect(result).toEqual({ emailId: 'user@example.com', name: 'Jane Doe' });
        });

        it('should throw GOOGLE_ID_TOKEN_MISSING when no id_token is returned', async () => {
            mockGetToken.mockResolvedValueOnce({ tokens: {} });

            await expect(
                exchangeGoogleCode('test-code', 'test-verifier')
            ).rejects.toThrow('GOOGLE_ID_TOKEN_MISSING');
        });

        it('should throw GOOGLE_TOKEN_PAYLOAD_MISSING when verifyIdToken returns null payload', async () => {
            mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => null });

            await expect(
                exchangeGoogleCode('test-code', 'test-verifier')
            ).rejects.toThrow('GOOGLE_TOKEN_PAYLOAD_MISSING');
        });

        it('should throw GOOGLE_EMAIL_INVALID_OR_MASKED when payload has no email', async () => {
            mockVerifyIdToken.mockResolvedValueOnce({
                getPayload: () => ({ sub: 'google-user-id' }),
            });

            await expect(
                exchangeGoogleCode('test-code', 'test-verifier')
            ).rejects.toThrow('GOOGLE_EMAIL_INVALID_OR_MASKED');
        });

        it('should throw GOOGLE_EMAIL_INVALID_OR_MASKED when payload has a masked email', async () => {
            mockVerifyIdToken.mockResolvedValueOnce({
                getPayload: () => ({ sub: 'google-user-id', email: 'ha****@sanketika.in' }),
            });

            await expect(
                exchangeGoogleCode('test-code', 'test-verifier')
            ).rejects.toThrow('GOOGLE_EMAIL_INVALID_OR_MASKED');
        });

        it('should throw if getToken fails', async () => {
            mockGetToken.mockRejectedValueOnce(new Error('Token exchange failed'));

            await expect(
                exchangeGoogleCode('test-code', 'test-verifier')
            ).rejects.toThrow('Token exchange failed');
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request } from 'express';

const {
    mockAuthorizationCodeGrant,
    mockBuildAuthorizationUrl,
    mockRandomPKCECodeVerifier,
    mockCalculatePKCECodeChallenge,
    mockGetGoogleOIDCConfig,
    mockDecodeJwtPayload,
} = vi.hoisted(() => {
    const mockAuthorizationCodeGrant = vi.fn();
    const mockBuildAuthorizationUrl = vi.fn();
    const mockRandomPKCECodeVerifier = vi.fn().mockReturnValue('test-verifier');
    const mockCalculatePKCECodeChallenge = vi.fn().mockResolvedValue('test-challenge');
    const mockGetGoogleOIDCConfig = vi.fn().mockResolvedValue({});
    const mockDecodeJwtPayload = vi.fn().mockReturnValue({
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        name: 'Test User',
    });

    return {
        mockAuthorizationCodeGrant,
        mockBuildAuthorizationUrl,
        mockRandomPKCECodeVerifier,
        mockCalculatePKCECodeChallenge,
        mockGetGoogleOIDCConfig,
        mockDecodeJwtPayload,
    };
});

vi.mock('../auth/oidcProvider.js', () => ({
    getGoogleOIDCConfig: mockGetGoogleOIDCConfig,
    decodeJwtPayload: mockDecodeJwtPayload,
}));

vi.mock('openid-client', () => ({
    authorizationCodeGrant: mockAuthorizationCodeGrant,
    buildAuthorizationUrl: mockBuildAuthorizationUrl,
    randomPKCECodeVerifier: mockRandomPKCECodeVerifier,
    calculatePKCECodeChallenge: mockCalculatePKCECodeChallenge,
}));

vi.mock('../utils/sessionStore.js', () => ({
    sessionStore: {},
}));

vi.mock('../utils/logger.js', () => ({
    default: { error: vi.fn(), info: vi.fn() },
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        PORTAL_REALM: 'test-realm',
        DOMAIN_URL: 'https://example.com',
        KEYCLOAK_GOOGLE_CLIENT_ID: 'test-keycloak-client-id',
        KEYCLOAK_GOOGLE_CLIENT_SECRET: 'test-keycloak-secret',
    },
}));

import { buildKeycloakGoogleAuthUrl, exchangeKeycloakCode } from './googleAuthService.js';

describe('GoogleAuthService - Keycloak OIDC flow', () => {
    let mockRequest: Partial<Request>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetGoogleOIDCConfig.mockResolvedValue({});

        mockRequest = {
            get: vi.fn((header: string) => {
                if (header === 'host') return 'example.com';
                return undefined;
            }) as any,
            protocol: 'https',
            originalUrl: '/google/auth/callback?code=abc&state=xyz',
            session: {} as any,
            oidc: undefined,
        };
    });

    describe('buildKeycloakGoogleAuthUrl', () => {
        it('should build Keycloak authorization URL with kc_idp_hint=google', async () => {
            mockBuildAuthorizationUrl.mockReturnValue(
                new URL('https://keycloak.example.com/auth/realms/sunbird/protocol/openid-connect/auth?kc_idp_hint=google')
            );

            const url = await buildKeycloakGoogleAuthUrl(mockRequest as Request, 'test-state', 'test-challenge');

            expect(mockGetGoogleOIDCConfig).toHaveBeenCalled();
            expect(mockBuildAuthorizationUrl).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    redirect_uri: 'https://example.com/google/auth/callback',
                    scope: 'openid',
                    code_challenge: 'test-challenge',
                    code_challenge_method: 'S256',
                    state: 'test-state',
                    kc_idp_hint: 'google',
                })
            );
            expect(url).toContain('kc_idp_hint=google');
        });

        it('should throw if getGoogleOIDCConfig fails', async () => {
            mockGetGoogleOIDCConfig.mockRejectedValue(new Error('Discovery failed'));
            await expect(
                buildKeycloakGoogleAuthUrl(mockRequest as Request, 'test-state', 'test-challenge')
            ).rejects.toThrow('Discovery failed');
        });
    });

    describe('exchangeKeycloakCode', () => {
        it('should exchange code and return email + name from token claims', async () => {
            mockAuthorizationCodeGrant.mockResolvedValue({ access_token: 'test-access-token' });

            const result = await exchangeKeycloakCode(mockRequest as Request, 'test-verifier', 'test-state');

            expect(mockAuthorizationCodeGrant).toHaveBeenCalledWith(
                {},
                expect.any(URL),
                expect.objectContaining({
                    pkceCodeVerifier: 'test-verifier',
                    expectedState: 'test-state',
                    idTokenExpected: false,
                }),
                { redirect_uri: 'https://example.com/google/auth/callback' }
            );
            expect(result).toEqual({ emailId: 'test@example.com', name: 'Test User' });
        });

        it('should fall back to given_name + family_name if name claim is absent', async () => {
            mockAuthorizationCodeGrant.mockResolvedValue({ access_token: 'test-access-token' });
            mockDecodeJwtPayload.mockReturnValue({
                email: 'user@example.com',
                given_name: 'Jane',
                family_name: 'Doe',
            });

            const result = await exchangeKeycloakCode(mockRequest as Request, 'test-verifier', 'test-state');

            expect(result).toEqual({ emailId: 'user@example.com', name: 'Jane Doe' });
        });

        it('should return undefined email/name when claims are missing', async () => {
            mockAuthorizationCodeGrant.mockResolvedValue({ access_token: 'test-access-token' });
            mockDecodeJwtPayload.mockReturnValue({});

            const result = await exchangeKeycloakCode(mockRequest as Request, 'test-verifier', 'test-state');

            expect(result).toEqual({ emailId: undefined, name: undefined });
        });

        it('should throw if authorizationCodeGrant fails', async () => {
            mockAuthorizationCodeGrant.mockRejectedValue(new Error('Token exchange failed'));
            await expect(
                exchangeKeycloakCode(mockRequest as Request, 'test-verifier', 'test-state')
            ).rejects.toThrow('Token exchange failed');
        });
    });
});

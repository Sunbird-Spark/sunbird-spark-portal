import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAxiosPost } = vi.hoisted(() => ({
    mockAxiosPost: vi.fn(),
}));

vi.mock('axios', () => ({
    default: { post: mockAxiosPost },
}));

vi.mock('../auth/oidcProvider.js', () => ({
    issuerUrl: 'https://example.com/auth/realms/test-realm',
    decodeJwtPayload: vi.fn().mockReturnValue({ sub: 'f:google:user-id', email: 'test@example.com' }),
}));

vi.mock('../utils/logger.js', () => ({
    default: { error: vi.fn(), info: vi.fn() },
}));

import { createKeycloakSsoSession } from './keycloakSsoBridgeService.js';

describe('keycloakSsoBridgeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAxiosPost.mockResolvedValue({
            data: {
                access_token: 'kc-access-token',
                refresh_token: 'kc-refresh-token',
                id_token: 'kc-id-token',
            },
        });
    });

    describe('createKeycloakSsoSession', () => {
        it('should POST to Keycloak token endpoint with ROPC grant and return tokens', async () => {
            const result = await createKeycloakSsoSession(
                'google',
                'test@example.com',
                'test-keycloak-client-id',
                'test-keycloak-secret'
            );

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'https://example.com/auth/realms/test-realm/protocol/openid-connect/token',
                expect.stringContaining('grant_type=password'),
                expect.objectContaining({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
            );
            expect(mockAxiosPost).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('username=test%40example.com'),
                expect.any(Object)
            );
            expect(result.access_token).toBe('kc-access-token');
            expect(result.refresh_token).toBe('kc-refresh-token');
            expect(result.id_token).toBe('kc-id-token');
            expect(result.tokenClaims).toEqual({ sub: 'f:google:user-id', email: 'test@example.com' });
        });

        it('should include the passed-in keycloakClientId in the POST body', async () => {
            await createKeycloakSsoSession('google', 'user@example.com', 'test-keycloak-client-id', 'test-keycloak-secret');

            const postedBody = mockAxiosPost.mock.calls[0]![1] as string;
            expect(postedBody).toContain('client_id=test-keycloak-client-id');
            expect(postedBody).toContain('client_secret=test-keycloak-secret');
            expect(postedBody).toContain('scope=openid');
        });

        it('should throw if Keycloak token endpoint returns an error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new Error('Keycloak unavailable'));

            await expect(
                createKeycloakSsoSession('google', 'test@example.com', 'test-keycloak-client-id', 'test-keycloak-secret')
            ).rejects.toThrow('Keycloak unavailable');
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getKeycloakClient } from '../helpers/keycloakHelper.js';
import { sessionStore } from '../utils/sessionStore.js';
import { envConfig } from './env.js';

vi.mock('../helpers/keycloakHelper.js', () => ({
    getKeycloakClient: vi.fn()
}));
vi.mock('../utils/sessionStore.js');
vi.mock('./env.js');

const mockGetKeycloakClient = vi.mocked(getKeycloakClient);
const mockSessionStore = vi.mocked(sessionStore);

describe('Keycloak Configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('should create keycloak client with correct configuration', async () => {
        const mockKeycloakInstance = {
            authenticated: vi.fn(),
            deauthenticated: vi.fn(),
        };
        mockGetKeycloakClient.mockReturnValue(mockKeycloakInstance as any);

        const { keycloak } = await import('./keycloak.js');

        expect(mockGetKeycloakClient).toHaveBeenCalledWith(
            {
                realm: envConfig.PORTAL_REALM,
                'auth-server-url': envConfig.PORTAL_AUTH_SERVER_URL,
                'ssl-required': 'external',
                resource: envConfig.PORTAL_AUTH_SERVER_CLIENT,
                'confidential-port': 0,
                'public-client': true,
            },
            mockSessionStore
        );
        expect(keycloak).toBe(mockKeycloakInstance);
    });

    it('should use environment configuration values', async () => {
        const testEnvConfig = {
            PORTAL_REALM: 'test-realm',
            PORTAL_AUTH_SERVER_URL: 'https://test-auth-server.com',
            PORTAL_AUTH_SERVER_CLIENT: 'test-client',
        };

        vi.mocked(envConfig).PORTAL_REALM = testEnvConfig.PORTAL_REALM;
        vi.mocked(envConfig).PORTAL_AUTH_SERVER_URL = testEnvConfig.PORTAL_AUTH_SERVER_URL;
        vi.mocked(envConfig).PORTAL_AUTH_SERVER_CLIENT = testEnvConfig.PORTAL_AUTH_SERVER_CLIENT;

        const mockKeycloakInstance = {
            authenticated: vi.fn(),
            deauthenticated: vi.fn(),
        };
        mockGetKeycloakClient.mockReturnValue(mockKeycloakInstance as any);

        await import('./keycloak.js');

        expect(mockGetKeycloakClient).toHaveBeenCalledWith(
            expect.objectContaining({
                realm: testEnvConfig.PORTAL_REALM,
                'auth-server-url': testEnvConfig.PORTAL_AUTH_SERVER_URL,
                resource: testEnvConfig.PORTAL_AUTH_SERVER_CLIENT,
            }),
            mockSessionStore
        );
    });

    it('should have correct SSL and client configuration', async () => {
        const mockKeycloakInstance = {
            authenticated: vi.fn(),
            deauthenticated: vi.fn(),
        };
        mockGetKeycloakClient.mockReturnValue(mockKeycloakInstance as any);

        await import('./keycloak.js');

        expect(mockGetKeycloakClient).toHaveBeenCalledWith(
            expect.objectContaining({
                'ssl-required': 'external',
                'confidential-port': 0,
                'public-client': true,
            }),
            mockSessionStore
        );
    });
});
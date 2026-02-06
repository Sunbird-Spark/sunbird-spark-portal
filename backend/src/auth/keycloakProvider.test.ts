import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getKeycloakClient } from './keycloakManager.js';
import { sessionStore } from '../utils/sessionStore.js';
import { envConfig } from '../config/env.js';

vi.mock('./keycloakManager.js', () => ({
    getKeycloakClient: vi.fn()
}));
vi.mock('../utils/sessionStore.js');
vi.mock('../config/env.js', () => ({
    envConfig: {
        PORTAL_REALM: 'sunbird',
        DOMAIN_URL: 'http://localhost:8080',
        PORTAL_AUTH_SERVER_CLIENT: 'portal',
        ENVIRONMENT: 'local'
    }
}));

const mockGetKeycloakClient = vi.mocked(getKeycloakClient);
const mockSessionStore = vi.mocked(sessionStore);

describe('Keycloak Configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('should create keycloak client with correct configuration for local environment', async () => {
        const mockKeycloakInstance = {
            authenticated: vi.fn(),
            deauthenticated: vi.fn(),
        };
        mockGetKeycloakClient.mockReturnValue(mockKeycloakInstance as any);

        const { keycloak } = await import('./keycloakProvider.js');

        expect(mockGetKeycloakClient).toHaveBeenCalledWith(
            {
                realm: 'sunbird',
                'auth-server-url': 'http://localhost:8080/auth',
                'ssl-required': 'external',
                resource: 'portal',
                'confidential-port': 0,
                'public-client': true,
            },
            mockSessionStore
        );
        expect(keycloak).toBe(mockKeycloakInstance);
    });

    it('should use external SSL for non-local environment', async () => {
        // Mock production environment
        vi.mocked(envConfig).ENVIRONMENT = 'production';

        const mockKeycloakInstance = {
            authenticated: vi.fn(),
            deauthenticated: vi.fn(),
        };
        mockGetKeycloakClient.mockReturnValue(mockKeycloakInstance as any);

        await import('./keycloakProvider.js');

        expect(mockGetKeycloakClient).toHaveBeenCalledWith(
            expect.objectContaining({
                'ssl-required': 'external',
            }),
            mockSessionStore
        );
    });

    it('should have correct client configuration', async () => {
        const mockKeycloakInstance = {
            authenticated: vi.fn(),
            deauthenticated: vi.fn(),
        };
        mockGetKeycloakClient.mockReturnValue(mockKeycloakInstance as any);

        await import('./keycloakProvider.js');

        expect(mockGetKeycloakClient).toHaveBeenCalledWith(
            expect.objectContaining({
                'confidential-port': 0,
                'public-client': true,
            }),
            mockSessionStore
        );
    });
});
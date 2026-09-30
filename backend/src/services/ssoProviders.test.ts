import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/env.js', () => ({
    envConfig: {
        KEYCLOAK_GOOGLE_CLIENT_ID: 'test-keycloak-client-id',
        KEYCLOAK_GOOGLE_CLIENT_SECRET: 'test-keycloak-secret',
        GOOGLE_OAUTH_CLIENT_ID: 'test-google-client-id',
        GOOGLE_OAUTH_CLIENT_SECRET: 'test-google-secret',
        DOMAIN_URL: 'https://example.com',
    },
}));

vi.mock('./googleAuthService.js', () => ({
    buildGoogleAuthUrl: vi.fn(),
    exchangeGoogleCode: vi.fn(),
}));

import { buildGoogleAuthUrl, exchangeGoogleCode } from './googleAuthService.js';
import { ssoProviders } from './ssoProviders.js';

describe('ssoProviders registry', () => {
    it('registers exactly one provider: google', () => {
        expect(Object.keys(ssoProviders)).toEqual(['google']);
    });

    it('wires the google entry to the Google adapter functions and Keycloak credentials', () => {
        expect(ssoProviders.google?.buildAuthUrl).toBe(buildGoogleAuthUrl);
        expect(ssoProviders.google?.exchangeCode).toBe(exchangeGoogleCode);
        expect(ssoProviders.google?.keycloakClientId).toBe('test-keycloak-client-id');
        expect(ssoProviders.google?.keycloakClientSecret).toBe('test-keycloak-secret');
    });
});

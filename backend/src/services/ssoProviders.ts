import { envConfig } from '../config/env.js';
import { buildGoogleAuthUrl, exchangeGoogleCode } from './googleAuthService.js';

interface SsoProviderAdapter {
    buildAuthUrl(state: string, codeChallenge: string): string;
    exchangeCode(code: string, codeVerifier: string): Promise<{ emailId?: string; name?: string }>;
    keycloakClientId: string;
    keycloakClientSecret: string;
}

export const ssoProviders: Record<string, SsoProviderAdapter> = {
    google: {
        buildAuthUrl: buildGoogleAuthUrl,
        exchangeCode: exchangeGoogleCode,
        keycloakClientId: envConfig.KEYCLOAK_GOOGLE_CLIENT_ID,
        keycloakClientSecret: envConfig.KEYCLOAK_GOOGLE_CLIENT_SECRET,
    },
};

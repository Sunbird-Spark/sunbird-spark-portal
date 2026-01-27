import { getKeycloakClient } from './keycloakManager.js';
import { sessionStore } from '../utils/sessionStore.js';
import { envConfig } from '../config/env.js';

const portalKeycloakConfig = {
    realm: envConfig.PORTAL_REALM,
    'auth-server-url': envConfig.KEYCLOAK_BASE_SERVER_URL,
    'ssl-required': 'external' as const,
    resource: envConfig.PORTAL_AUTH_SERVER_CLIENT,
    'confidential-port': 0,
    'public-client': true
};

export const keycloak = getKeycloakClient(portalKeycloakConfig, sessionStore);

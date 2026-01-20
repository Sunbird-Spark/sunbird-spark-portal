import Keycloak from 'keycloak-connect';
import type { Request } from 'express';
import logger from '../utils/logger.js';
import { generateLoggedInKongToken } from '../services/kongAuthService.js';
import { sessionStore } from '../utils/sessionStore.js';
import { getCurrentUser } from '../services/userService.js';
import { regenerateSession, destroySession } from '../utils/sessionUtils.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';

export const getKeycloakClient = (config: Keycloak.KeycloakConfig, store: any) => {
    const keycloak = new Keycloak({ store: store || sessionStore }, config);
    keycloak.authenticated = authenticated;
    keycloak.deauthenticated = deauthenticated;
    return keycloak;
}

const deauthenticated = async function (request: Request) {
    try {
        await destroySession(request);
    } catch (err) {
        logger.error('Error destroying session during deauthentication', err);
    }
}

const authenticated = async (request: Request) => {
    try {
        await regenerateSession(request);
        setSessionTTLFromToken(request);
        const sub = (request.kauth?.grant?.access_token as any)?.content?.sub;
        if (sub) {
            const parts = sub.split(':');
            request.session.userId = parts[parts.length - 1];
        }
        await generateLoggedInKongToken(request);
        await getCurrentUser(request);
        logger.info('Keycloak authenticated successfully');
    } catch (err) {
        logger.error('error logging in user', err);
    }
}

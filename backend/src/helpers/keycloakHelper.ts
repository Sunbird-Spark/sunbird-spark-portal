import Keycloak from 'keycloak-connect';
import type { Request } from 'express';
import logger from '../utils/logger.js';
import { generateLoggedInKongToken } from '../services/kongAuthService.js';
import { sessionStore } from '../utils/sessionStore.js';
import { getCurrentUser } from '../services/userService.js';
import { regenerateSession } from '../utils/sessionUtils.js';

export const getKeycloakClient = (config: Keycloak.KeycloakConfig, store: any) => {
    const keycloak = new Keycloak({ store: store || sessionStore }, config);
    keycloak.authenticated = authenticated;
    keycloak.deauthenticated = deauthenticated;
    return keycloak
}

const deauthenticated = function (request: Request) {
    delete request.session['roles']
    delete request.session.userId
}

const authenticated = async (request: Request) => {
    try {
        await regenerateSession(request);
        const sub = request.kauth?.grant?.access_token?.content?.sub;
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

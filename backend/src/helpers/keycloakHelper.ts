import Keycloak from 'keycloak-connect';
import type { Request } from 'express';
import logger from '../utils/logger.js';
import { generateLoggedInKongToken } from '../services/kongAuthService.js'
import { sessionStore } from '../utils/sessionStore.js';
import { getCurrentUser } from '../services/userService.js';

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

const regenerateSession = (req: Request): Promise<void> =>
    new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

const authenticated = (request: Request) => {
    (async () => {
        try {
            await regenerateSession(request);
            const sub = request.kauth?.grant?.access_token?.content?.sub;
            if (sub) {
                const parts = sub.split(':');
                request.session.userId = parts[parts.length - 1];
            }
            await generateLoggedInKongToken(request);
            await getCurrentUser(request);
            logger.info({ msg: 'keycloak authenticated successfully' });
        } catch (err) {
            logger.error({ msg: 'error logging in user', error: err });
        }
    })();
}

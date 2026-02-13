import Keycloak from 'keycloak-connect';
import type { Request } from 'express';
import logger from '../utils/logger.js';
import { sessionStore } from '../utils/sessionStore.js';
import { destroySession, saveSession } from '../utils/sessionUtils.js';

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
        logger.info(`in authenticated`, request.kauth);
        // Explicitly save the session to ensure keycloak-token is persisted before redirect
        await saveSession(request);
        logger.info('Keycloak authenticated successfully - Session saved');
        // Authentication logic moved to /portal/login route handler
    } catch (err) {
        logger.error('error logging in user', err);
    }
}

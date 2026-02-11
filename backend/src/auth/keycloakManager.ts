import Keycloak from 'keycloak-connect';
import _ from 'lodash';
import type { Request } from 'express';
import logger from '../utils/logger.js';
import { sessionStore } from '../utils/sessionStore.js';
import { fetchUserById, setUserSession } from '../services/userService.js';
import { regenerateSession, destroySession } from '../utils/sessionUtils.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';

export const getKeycloakClient = (config: Keycloak.KeycloakConfig, store: any) => {
    const keycloak = new Keycloak({ store: store || sessionStore }, config);
    // keycloak.authenticated = authenticated; // We will call this manually to avoid race conditions
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

export const authenticated = async (request: Request) => {
    try {
        await regenerateSession(request);
        setSessionTTLFromToken(request);

        const tokenSubject = _.get(request, 'kauth.grant.access_token.content.sub');

        if (tokenSubject) {
            const userIdFromToken = _.last(_.split(tokenSubject, ':'));
            request.session.userId = userIdFromToken;
        }

        const userId = request.session.userId;
        if (!userId) {
            throw new Error('userId missing from session');
        }

        const userProfileResponse = await fetchUserById(userId, request);
        setUserSession(request, userProfileResponse);
        logger.info('Keycloak authenticated successfully');
    } catch (err) {
        logger.error('error logging in user', err);
    }
}

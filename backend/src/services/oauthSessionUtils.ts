import { envConfig } from '../config/env.js';
import { Request } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';

export const validateOAuthSession = (req: Request): { state: string; codeVerifier: string; client_id: string } => {
    if (!req.session.ssoOAuth) {
        throw new Error('OAUTH_SESSION_MISSING');
    }

    const { state, codeVerifier, client_id, timestamp, sessionUsed } = req.session.ssoOAuth;

    if (!_.isString(state) || _.isEmpty(state.trim())) {
        throw new Error('OAUTH_SESSION_INVALID_STATE');
    }

    if (!_.isString(codeVerifier) || _.isEmpty(codeVerifier.trim())) {
        throw new Error('OAUTH_SESSION_INVALID_CODE_VERIFIER');
    }

    if (!_.isString(client_id) || _.isEmpty(client_id.trim())) {
        throw new Error('OAUTH_SESSION_INVALID_CLIENT_ID');
    }

    if (!_.isFinite(timestamp)) {
        throw new Error('OAUTH_SESSION_INVALID_TIMESTAMP');
    }

    if (sessionUsed) {
        logger.error('Oauth session already used');
        throw new Error('OAUTH_SESSION_ALREADY_USED');
    }

    const SESSION_TIMEOUT = 5 * 60 * 1000;
    if (Date.now() - timestamp > SESSION_TIMEOUT) {
        logger.error('Oauth session expired');
        throw new Error('OAUTH_SESSION_EXPIRED');
    }

    return { state, codeVerifier, client_id };
};

export const validateOAuthCallback = (req: Request, expectedState: string): string => {
    if (req.query.state !== expectedState) {
        throw new Error('INVALID_OAUTH_STATE');
    }

    if (req.query.error) {
        logger.error('SSO OAuth error:', req.query.error);
        throw new Error(`OAUTH_ERROR: ${req.query.error}`);
    }

    if (!req.query.code || typeof req.query.code !== 'string' || Array.isArray(req.query.code)) {
        throw new Error('OAUTH_CODE_INVALID');
    }

    return req.query.code;
};

export const markSessionAsUsed = (req: Request): void => {
    if (req.session.ssoOAuth) {
        req.session.ssoOAuth.sessionUsed = true;
    }
};

export const validateRedirectUrl = (url: string | undefined): string => {
    if (!url) {
        return '/';
    }

    try {
        const parsedUrl = new URL(url, envConfig.DOMAIN_URL);

        if (!envConfig.DOMAIN_URL) {
            return '/';
        }

        const allowedHost = new URL(envConfig.DOMAIN_URL).hostname;

        if (parsedUrl.hostname === allowedHost) {
            return url;
        }

        return '/';
    } catch (error) {
        logger.error('Invalid redirect URL provided:', url, error);
        return '/';
    }
};

export const handleUserAuthentication = async (
    ssoUser: { emailId?: string; name?: string },
    client_id: string,
    req: Request
): Promise<boolean> => {
    logger.info(`handleUserAuthentication: emailId=${ssoUser.emailId} name=${ssoUser.name}`);

    if (!ssoUser.emailId) {
        throw new Error('SSO_EMAIL_NOT_FOUND');
    }

    let userExists;
    try {
        const { getUserByEmail } = await import('./userService.js');
        userExists = await getUserByEmail(ssoUser.emailId, req);
    } catch (error) {
        logger.error('Error fetching user by email:', error);
        throw new Error('FETCH_USER_FAILED');
    }

    if (!userExists) {
        try {
            const { createUserWithEmail } = await import('./userService.js');
            await createUserWithEmail(ssoUser, client_id, req);
        } catch (error) {
            logger.error('Error creating user:', error);
            throw new Error('CREATE_USER_FAILED');
        }
    }

    return !!userExists;
};

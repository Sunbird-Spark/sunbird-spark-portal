import { envConfig } from '../config/env.js';
import { Request } from 'express';
import * as oidcClient from 'openid-client';
import { getGoogleOIDCConfig, decodeJwtPayload } from '../auth/oidcProvider.js';
import logger from '../utils/logger.js';
import _ from 'lodash';

/**
 * Builds a Keycloak authorization URL that redirects the user through the Google
 * Identity Provider. The `google-auth` confidential client is used so that Node.js
 * can exchange the resulting auth code for a token containing email/name claims.
 */
export const buildKeycloakGoogleAuthUrl = async (
    req: Request,
    state: string,
    codeChallenge: string
): Promise<string> => {
    const config = await getGoogleOIDCConfig();
    const callbackUrl = `${envConfig.DOMAIN_URL}/google/auth/callback`;

    const redirectUrl = oidcClient.buildAuthorizationUrl(config, {
        redirect_uri: callbackUrl,
        scope: 'openid',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
        // Tell Keycloak to skip the login page and go directly to Google IDP
        kc_idp_hint: 'google',
    });

    return redirectUrl.href;
};

/**
 * Exchanges the Keycloak authorization code (from the Google IDP callback) for
 * tokens using the `google-auth` confidential client. Extracts email and name
 * from the access token claims (populated via Keycloak protocol mappers).
 */
export const exchangeKeycloakCode = async (
    req: Request,
    codeVerifier: string,
    state: string
): Promise<{ emailId?: string; name?: string }> => {
    const config = await getGoogleOIDCConfig();
    const callbackUrl = `${envConfig.DOMAIN_URL}/google/auth/callback`;

    const currentUrl = new URL(
        `${req.protocol}://${req.get('host')}${req.originalUrl}`
    );

    const tokens = await oidcClient.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedState: state,
        idTokenExpected: false,
    }, { redirect_uri: callbackUrl });

    const claims = decodeJwtPayload(tokens.access_token);

    const firstName = (claims?.given_name as string) || '';
    const lastName = (claims?.family_name as string) || '';
    const fullName = (claims?.name as string) || `${firstName} ${lastName}`.trim();

    return {
        emailId: claims?.email as string | undefined,
        name: fullName || undefined,
    };
};

export const validateOAuthSession = (req: Request): { state: string; codeVerifier: string; client_id: string } => {
    if (!req.session.googleOAuth) {
        throw new Error('OAUTH_SESSION_MISSING');
    }

    const { state, codeVerifier, client_id, timestamp, sessionUsed } = req.session.googleOAuth;

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
        logger.error('Keycloak Google OAuth error:', req.query.error);
        throw new Error(`GOOGLE_OAUTH_ERROR: ${req.query.error}`);
    }

    if (!req.query.code || typeof req.query.code !== 'string' || Array.isArray(req.query.code)) {
        throw new Error('OAUTH_CODE_INVALID');
    }

    return req.query.code;
};

export const markSessionAsUsed = (req: Request): void => {
    if (req.session.googleOAuth) {
        req.session.googleOAuth.sessionUsed = true;
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
    googleUser: { emailId?: string; name?: string },
    client_id: string,
    req: Request
): Promise<boolean> => {
    if (!googleUser.emailId) {
        throw new Error('GOOGLE_EMAIL_NOT_FOUND');
    }

    let userExists;
    try {
        const { getUserByEmail } = await import('./userService.js');
        userExists = await getUserByEmail(googleUser.emailId, req);
    } catch (error) {
        logger.error('Error fetching user by email:', error);
        throw new Error('FETCH_USER_FAILED');
    }

    if (!userExists) {
        try {
            const { createUserWithEmail } = await import('./userService.js');
            await createUserWithEmail(googleUser, client_id, req);
        } catch (error) {
            logger.error('Error creating user:', error);
            throw new Error('CREATE_USER_FAILED');
        }
    }

    return !!userExists;
};

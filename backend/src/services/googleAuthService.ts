import { envConfig } from '../config/env.js';
import { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';
import logger from '../utils/logger.js';
import _ from 'lodash';

const GOOGLE_CALLBACK_URL = () => `${envConfig.DOMAIN_URL}/google/auth/callback`;

const createOAuth2Client = () =>
    new OAuth2Client({
        clientId: envConfig.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: envConfig.GOOGLE_OAUTH_CLIENT_SECRET,
        redirectUri: GOOGLE_CALLBACK_URL(),
    });

/**
 * Builds a direct Google OAuth2 authorization URL using PKCE.
 * The portal backend acts as the OAuth client — no Keycloak broker involved.
 */
export const buildGoogleAuthUrl = (state: string, codeChallenge: string): string => {
    const client = createOAuth2Client();
    return client.generateAuthUrl({
        scope: ['openid', 'email', 'profile'],
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'online',
    });
};

/**
 * Exchanges the Google authorization code for tokens using PKCE, then
 * extracts the real email and name from the verified ID token payload.
 * Because we call Google directly (no Keycloak SPI), the email is never masked.
 */
export const exchangeGoogleCode = async (
    code: string,
    codeVerifier: string
): Promise<{ emailId?: string; name?: string }> => {
    const client = createOAuth2Client();

    const { tokens } = await client.getToken({ code, codeVerifier });

    if (!tokens.id_token) {
        throw new Error('GOOGLE_ID_TOKEN_MISSING');
    }

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: envConfig.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
        throw new Error('GOOGLE_TOKEN_PAYLOAD_MISSING');
    }

    logger.info(`exchangeGoogleCode: email=${payload.email} name=${payload.name} sub=${payload.sub}`);

    const email = payload.email;
    const EMAIL_REGEX = /^[^\s@*]+@[^\s@*]+\.[^\s@*]+$/;
    if (!email || !EMAIL_REGEX.test(email)) {
        logger.error(`exchangeGoogleCode: invalid or masked email from Google ID token: "${email}"`);
        throw new Error('GOOGLE_EMAIL_INVALID_OR_MASKED');
    }

    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    const fullName = payload.name || `${firstName} ${lastName}`.trim();

    return {
        emailId: email,
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
        logger.error('Google OAuth error:', req.query.error);
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
    logger.info(`handleUserAuthentication: emailId=${googleUser.emailId} name=${googleUser.name}`);

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

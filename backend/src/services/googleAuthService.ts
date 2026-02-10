import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { envConfig } from '../config/env.js';
import { Request, Response } from 'express';
import { getKeycloakClient } from '../auth/keycloakManager.js';
import { sessionStore } from '../utils/sessionStore.js';
import logger from '../utils/logger.js';
import _ from 'lodash';

const keycloakGoogleConfig = {
    realm: envConfig?.PORTAL_REALM,
    'auth-server-url': envConfig?.DOMAIN_URL + '/auth',
    resource: envConfig?.KEYCLOAK_GOOGLE_CLIENT_ID,
    'confidential-port': 0,
    'ssl-required': 'external' as const,
    credentials: {
        secret: envConfig?.KEYCLOAK_GOOGLE_CLIENT_SECRET
    }
};

const keycloakGoogle = getKeycloakClient(keycloakGoogleConfig, sessionStore);

export const createSession = async (emailId: string, req: Request, res: Response): Promise<{ access_token: string; expires_at: number }> => {
    let grant;

    try {
        grant = await keycloakGoogle.grantManager.obtainFromClientCredentials();
    } catch (error) {
        logger.error({
            msg: 'googleOauthHelper:createSession failed',
            error
        });
        throw error;
    }

    keycloakGoogle.storeGrant(grant, req, res);
    req.kauth = { grant };

    try {
        const originalGoogleOAuth = req.session?.googleOAuth;
        await keycloakGoogle.authenticated(req);
        if (req.session && originalGoogleOAuth && !req.session.googleOAuth) {
            req.session.googleOAuth = originalGoogleOAuth;
        }

        if (!grant.access_token?.token || !grant.access_token?.content?.exp) {
            throw new Error('INVALID_GRANT_TOKEN');
        }

        return {
            access_token: grant.access_token.token,
            expires_at: grant.access_token.content.exp
        };
    } catch (error) {
        logger.error({
            msg: 'googleOauthHelper:createSession failed during authentication',
            error
        });
        throw error;
    }
};

class GoogleOauth {
    createClient(req: Request) {
        try {
            const host = req.get('host');
            if (!_.isString(host) || _.isEmpty(host.trim())) {
                throw new Error('HOST_HEADER_MISSING');
            }
            if (!_.isString(envConfig.DOMAIN_URL) || _.isEmpty(envConfig.DOMAIN_URL.trim())) {
                logger.error('GOOGLE_OAUTH_DOMAIN_URL_MISSING');
                throw new Error('GOOGLE_OAUTH_DOMAIN_URL_MISSING');
            }

            const domainHost = new URL(envConfig.DOMAIN_URL).host;
            if (host !== domainHost) {
                logger.error(`HOST_MISMATCH: Request host ${host} does not match domain URL host ${domainHost}`);
                throw new Error('HOST_MISMATCH');
            }

            const redirect = `${envConfig.DOMAIN_URL}/google/auth/callback`;

            if (!_.isString(envConfig.GOOGLE_OAUTH_CLIENT_ID) || _.isEmpty(envConfig.GOOGLE_OAUTH_CLIENT_ID.trim()) ||
                !_.isString(envConfig.GOOGLE_OAUTH_CLIENT_SECRET) || _.isEmpty(envConfig.GOOGLE_OAUTH_CLIENT_SECRET.trim())) {
                logger.error('GOOGLE_OAUTH_CONFIG_MISSING');
                throw new Error('GOOGLE_OAUTH_CONFIG_MISSING');
            }

            return new google.auth.OAuth2(
                envConfig.GOOGLE_OAUTH_CLIENT_ID,
                envConfig.GOOGLE_OAUTH_CLIENT_SECRET,
                redirect
            );
        } catch (error) {
            logger.error({
                msg: 'GoogleOauth:createClient failed',
                error
            });
            throw error;
        }
    }

    generateAuthUrl({ nonce, state, req }: { nonce: string; state: string; req: Request }) {
        try {
            const client = this.createClient(req);
            return client.generateAuthUrl({
                access_type: 'offline',
                response_type: 'code',
                scope: ['openid', 'email', 'profile'],
                state,
                nonce,
                prompt: 'consent'
            });
        } catch (error) {
            logger.error({
                msg: 'GoogleOauth:generateAuthUrl failed',
                error
            });
            throw error;
        }
    }

    async verifyAndGetProfile({ code, nonce, req }: { code: string; nonce: string; req: Request }) {
        try {
            const client = this.createClient(req);

            const { tokens } = await client.getToken(code);

            if (!tokens?.id_token) {
                throw new Error('FAILED_TO_FETCH_ID_TOKEN');
            }

            const verifier = new OAuth2Client(envConfig.GOOGLE_OAUTH_CLIENT_ID);
            const ticket = await verifier.verifyIdToken({
                idToken: tokens.id_token,
                audience: envConfig.GOOGLE_OAUTH_CLIENT_ID
            });

            const payload = ticket.getPayload();

            if (!payload) {
                throw new Error('INVALID_ID_TOKEN');
            }

            if (!payload.email_verified) {
                throw new Error('EMAIL_NOT_VERIFIED');
            }

            if (payload.nonce !== nonce) {
                throw new Error('INVALID_NONCE');
            }

            return {
                emailId: payload.email,
                name: payload.name
            };
        } catch (error) {
            logger.error({
                msg: 'GoogleOauth:verifyAndGetProfile failed',
                error
            });
            throw error;
        }
    }

}

export default new GoogleOauth();

export const validateOAuthSession = (req: Request): { state: string; nonce: string; client_id: string } => {
    if (!req.session.googleOAuth) {
        throw new Error('OAUTH_SESSION_MISSING');
    }

    const { state, nonce, client_id, timestamp, sessionUsed } = req.session.googleOAuth;

    if (!_.isString(state) || _.isEmpty(state.trim())) {
        throw new Error('OAUTH_SESSION_INVALID_STATE');
    }

    if (!_.isString(nonce) || _.isEmpty(nonce.trim())) {
        throw new Error('OAUTH_SESSION_INVALID_NONCE');
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

    return { state, nonce, client_id };
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
    req: Request,
    res: Response
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

    try {
        await createSession(googleUser.emailId, req, res);
    } catch (error) {
        logger.error('Error creating session:', error);
        throw new Error('SESSION_CREATION_FAILED');
    }

    return !!userExists;
};

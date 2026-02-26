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

export const createSession = async (tokenData: any, req: Request, res: Response): Promise<{ access_token: string; expires_at: number }> => {
    let grant;

    try {
        grant = await keycloakGoogle.grantManager.createGrant(tokenData);
    } catch (error) {
        logger.error('googleOauthHelper:createSession failed to create grant', error);
        throw error;
    }

    if (!grant) {
        throw new Error('GRANT_CREATION_FAILED');
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
    generateAuthUrl({ nonce, state, req }: { nonce: string; state: string; req: Request }) {
        try {
            const host = req.get('host');
            if (!_.isString(host) || _.isEmpty(host.trim())) {
                throw new Error('HOST_HEADER_MISSING');
            }
            if (!_.isString(envConfig.DOMAIN_URL) || _.isEmpty(envConfig.DOMAIN_URL.trim())) {
                logger.error('DOMAIN_URL_MISSING');
                throw new Error('DOMAIN_URL_MISSING');
            }

            const domainHost = new URL(envConfig.DOMAIN_URL).host;
            if (host !== domainHost) {
                logger.error(`HOST_MISMATCH: Request host ${host} does not match domain URL host ${domainHost}`);
                throw new Error('HOST_MISMATCH');
            }

            const redirectUri = `${envConfig.DOMAIN_URL}/google/auth/callback`;
            const keycloakAuthUrl = new URL(`${envConfig.DOMAIN_URL}/auth/realms/${envConfig.PORTAL_REALM}/protocol/openid-connect/auth`);

            keycloakAuthUrl.searchParams.append('client_id', envConfig.KEYCLOAK_GOOGLE_CLIENT_ID);
            keycloakAuthUrl.searchParams.append('redirect_uri', redirectUri);
            keycloakAuthUrl.searchParams.append('response_type', 'code');
            keycloakAuthUrl.searchParams.append('scope', 'openid');
            keycloakAuthUrl.searchParams.append('state', state);
            keycloakAuthUrl.searchParams.append('nonce', nonce);
            keycloakAuthUrl.searchParams.append('kc_idp_hint', 'google');

            return keycloakAuthUrl.toString();
        } catch (error) {
            logger.error('GoogleOauth:generateAuthUrl failed', error);
            throw error;
        }
    }

    async verifyAndGetProfile({ code }: { code: string }) {
        try {
            const redirectUri = `${envConfig.DOMAIN_URL}/google/auth/callback`;
            const tokenUrl = `${envConfig.DOMAIN_URL}/auth/realms/${envConfig.PORTAL_REALM}/protocol/openid-connect/token`;

            const params = new URLSearchParams();
            params.append('client_id', envConfig.KEYCLOAK_GOOGLE_CLIENT_ID);
            params.append('client_secret', envConfig.KEYCLOAK_GOOGLE_CLIENT_SECRET);
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('redirect_uri', redirectUri);

            const { default: axios } = await import('axios');
            const response = await axios.post(tokenUrl, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const tokenData = response.data;

            if (!tokenData?.id_token) {
                throw new Error('FAILED_TO_FETCH_ID_TOKEN');
            }

            // Parse the JWT id_token to extract user information
            // Note: Since Keycloak issued this token to our confidential client over a secure backend channel,
            // we can confidently decode the payload without a full RSA signature verification for this specific step 
            // (the SSL/TLS connection provides the authenticity guarantee here).
            const base64 = tokenData.id_token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );
            const payload = JSON.parse(jsonPayload) as Record<string, string>;

            return {
                emailId: payload.email,
                name: payload.name || payload.preferred_username,
                tokenData: tokenData
            };
        } catch (error: any) {
            logger.error({
                msg: 'GoogleOauth:verifyAndGetProfile failed',
                error: error.response?.data || error
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
    if (!url || !envConfig.DOMAIN_URL) {
        return '/';
    }

    try {
        const parsedUrl = new URL(url, envConfig.DOMAIN_URL);
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
    googleUser: { emailId?: string; name?: string; tokenData?: any },
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

        // Refresh the token after user creation so Keycloak's SPI mapper
        // can include the Sunbird userId in the token's sub claim.
        // The initial token was issued before the user existed in Sunbird,
        // so the SPI mapper had nothing to map at that point.
        try {
            const tokenUrl = `${envConfig.DOMAIN_URL}/auth/realms/${envConfig.PORTAL_REALM}/protocol/openid-connect/token`;
            const refreshParams = new URLSearchParams();
            refreshParams.append('client_id', envConfig.KEYCLOAK_GOOGLE_CLIENT_ID);
            refreshParams.append('client_secret', envConfig.KEYCLOAK_GOOGLE_CLIENT_SECRET);
            refreshParams.append('grant_type', 'refresh_token');
            refreshParams.append('refresh_token', googleUser.tokenData.refresh_token);

            const { default: axios } = await import('axios');
            const refreshResponse = await axios.post(tokenUrl, refreshParams.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            googleUser.tokenData = refreshResponse.data;
        } catch (error) {
            logger.error('Error refreshing token after user creation:', error);
            throw new Error('TOKEN_REFRESH_FAILED');
        }
    }

    try {
        if (!googleUser.tokenData) throw new Error('KEYCLOAK_TOKENS_MISSING');
        await createSession(googleUser.tokenData, req, res);
    } catch (error) {
        logger.error('Error creating session:', error);
        throw new Error('SESSION_CREATION_FAILED');
    }

    // Mirror the regular login flow (/portal/auth/callback):
    // regenerate session (new SID + logged-in Kong token), then populate
    // userId/roles/orgs from the user profile so the rest of the portal
    // treats this session as authenticated.
    try {
        const { regenerateSession } = await import('../utils/sessionUtils.js');
        await regenerateSession(req);

        const tokenSubject = _.get(req, 'kauth.grant.access_token.content.sub');
        console.log(" req.kauth:", req.kauth);
        console.log(" tokenSubject:", tokenSubject);

        if (tokenSubject) {
            const userIdFromToken = _.last(_.split(tokenSubject, ':'));
            req.session.userId = userIdFromToken;

            if (userIdFromToken) {
                const { fetchUserById, setUserSession } = await import('./userService.js');
                const userProfileResponse = await fetchUserById(userIdFromToken, req);
                await setUserSession(req, userProfileResponse);
            }
        }
    } catch (error) {
        logger.error('Error setting up user session after Google SSO:', error);
        throw new Error('USER_SESSION_SETUP_FAILED');
    }

    return !!userExists;
};

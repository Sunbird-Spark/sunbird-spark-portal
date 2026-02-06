import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { envConfig } from '../config/env.js';
import { Request, Response } from 'express';
import { getKeycloakClient } from '../auth/keycloakManager.js';
import { sessionStore } from '../utils/sessionStore.js';
import logger from '../utils/logger.js';

const keycloakGoogleConfig = {
    realm: envConfig?.PORTAL_REALM,
    'auth-server-url': envConfig?.DOMAIN_URL + '/auth',
    resource: envConfig?.KEYCLOAK_GOOGLE_CLIENT_ID,
    'confidential-port': 0,
    'public-client': true,
    'ssl-required': 'external' as const,
    credentials: {
        secret: envConfig?.KEYCLOAK_GOOGLE_CLIENT_SECRET
    }
};

const keycloakGoogle = getKeycloakClient(keycloakGoogleConfig, sessionStore);

export const createSession = async (emailId: string, req: Request, res: Response): Promise<{ access_token: string; expires_in: number }> => {
    let grant;

    try {
        /**
         * Create Keycloak session for web user
         * This MUST be a trusted internal call
         */
        grant = await keycloakGoogle.grantManager.obtainDirectly(
            emailId,     // KC username or internal ID
            ''           // Empty password for trusted internal call
        );
    } catch (error) {
        logger.error({
            msg: 'googleOauthHelper:createSession failed',
            error
        });
        throw new Error('GOOGLE_CREATE_SESSION_FAILED');
    }

    /**
     * Store grant in session cookie
     * Keycloak adapter handles httpOnly + secure flags
     */
    keycloakGoogle.storeGrant(grant, req, res);
    req.kauth = { grant };

    /**
     * Establish authenticated session
     */
    try {
        await keycloakGoogle.authenticated(req);
        
        if (!grant.access_token?.token || !grant.access_token?.content?.exp) {
            throw new Error('INVALID_GRANT_TOKEN');
        }
        
        return {
            access_token: grant.access_token.token,
            expires_in: grant.access_token.content.exp
        };
    } catch (error) {
        logger.error({
            msg: 'googleOauthHelper:authenticated failed',
            error
        });
        throw new Error('GOOGLE_SESSION_AUTH_FAILED');
    }
};



class GoogleOauth {
    createClient(req: Request) {
        const redirect = `https://${req.get('host')}/google/auth/callback`;
        return new google.auth.OAuth2(
            envConfig.GOOGLE_OAUTH_CLIENT_ID,
            envConfig.GOOGLE_OAUTH_CLIENT_SECRET,
            redirect
        );
    }

    generateAuthUrl({ nonce, state, req }: { nonce: string; state: string; req: Request }) {
        const client = this.createClient(req);
        return client.generateAuthUrl({
            access_type: 'offline',
            response_type: 'code',
            scope: ['openid', 'email', 'profile'],
            state,
            nonce,
            prompt: 'consent'
        });
    }

    async verifyAndGetProfile({ code, nonce, req }: { code: string; nonce: string; req: Request }) {
        const client = this.createClient(req);
        const { tokens } = await client.getToken(code);

        if (!tokens.id_token) {
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
    }
}

export default new GoogleOauth();

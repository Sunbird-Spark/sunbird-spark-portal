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
        grant = await keycloakGoogle.grantManager.obtainDirectly(
            emailId,
            ''
        );
    } catch (error) {
        logger.error({
            msg: 'googleOauthHelper:createSession failed',
            error
        });
        throw new Error('GOOGLE_CREATE_SESSION_FAILED');
    }

    keycloakGoogle.storeGrant(grant, req, res);
    req.kauth = { grant };

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
        try {
            const host = req.get('host');
            if (!host) {
                throw new Error('HOST_HEADER_MISSING');
            }
            
            const redirect = `https://${host}/google/auth/callback`;
            
            if (!envConfig.GOOGLE_OAUTH_CLIENT_ID || !envConfig.GOOGLE_OAUTH_CLIENT_SECRET) {
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
            throw new Error('GOOGLE_CLIENT_CREATION_FAILED');
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
            throw new Error('GOOGLE_AUTH_URL_GENERATION_FAILED');
        }
    }

    async verifyAndGetProfile({ code, nonce, req }: { code: string; nonce: string; req: Request }) {
        try {
            const client = this.createClient(req);
            
            let tokens;
            try {
                const tokenResponse = await client.getToken(code);
                tokens = tokenResponse.tokens;
            } catch (error) {
                logger.error({
                    msg: 'GoogleOauth:getToken failed',
                    error
                });
                throw new Error('FAILED_TO_FETCH_TOKENS');
            }

            if (!tokens.id_token) {
                throw new Error('FAILED_TO_FETCH_ID_TOKEN');
            }

            const verifier = new OAuth2Client(envConfig.GOOGLE_OAUTH_CLIENT_ID);
            
            let ticket;
            try {
                ticket = await verifier.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: envConfig.GOOGLE_OAUTH_CLIENT_ID
                });
            } catch (error) {
                logger.error({
                    msg: 'GoogleOauth:verifyIdToken failed',
                    error
                });
                throw new Error('ID_TOKEN_VERIFICATION_FAILED');
            }

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

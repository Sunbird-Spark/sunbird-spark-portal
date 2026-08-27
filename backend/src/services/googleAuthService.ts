import { envConfig } from '../config/env.js';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import logger from '../utils/logger.js';

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
        code_challenge_method: CodeChallengeMethod.S256,
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

    if (payload.email_verified !== true) {
        throw new Error('GOOGLE_EMAIL_NOT_VERIFIED');
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

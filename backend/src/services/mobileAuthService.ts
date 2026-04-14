import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Request } from 'express';
import { envConfig } from '../config/env.js';
import { issuerUrl } from '../auth/oidcProvider.js';
import logger from '../utils/logger.js';

const GOOGLE_SIGN_IN_DELAY_MS = 3000;

export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
}

export interface MobileClientConfig {
    client_id: string;
    client_secret?: string;
}

/**
 * Whitelist of Keycloak clients that are allowed to use the token refresh endpoint.
 * Mirrors the keyClockMobileClients map from the reference refreshTokenRoutes.js.
 */
export const getMobileClients = (): Record<string, MobileClientConfig> => {
    const clients: Record<string, MobileClientConfig> = {};

    if (envConfig.KEYCLOAK_ANDROID_CLIENT_ID) {
        clients[envConfig.KEYCLOAK_ANDROID_CLIENT_ID] = {
            client_id: envConfig.KEYCLOAK_ANDROID_CLIENT_ID,
            client_secret: envConfig.KEYCLOAK_ANDROID_CLIENT_SECRET || undefined,
        };
    }

    if (envConfig.KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID) {
        clients[envConfig.KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID] = {
            client_id: envConfig.KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID,
            client_secret: envConfig.KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET || undefined,
        };
    }

    return clients;
};

/**
 * Maps Keycloak ROPC error responses to normalised { statusCode, error, error_msg }.
 */
export const mapKeycloakRopcError = (
    errorData: Record<string, string>
): { statusCode: number; error: string; error_msg: string } => {
    const error = errorData.error || 'LOGIN_FAILED';
    const description = errorData.error_description || 'Login failed';

    if (
        error === 'invalid_grant' &&
        (description.toLowerCase().includes('disabled') ||
            description.toLowerCase().includes('blocked') ||
            description.toLowerCase().includes('not fully set up'))
    ) {
        return {
            statusCode: 401,
            error: 'USER_ACCOUNT_BLOCKED',
            error_msg: 'User account is blocked. Please contact admin',
        };
    }

    if (error === 'invalid_grant') {
        return { statusCode: 401, error: 'INVALID_CREDENTIALS', error_msg: description };
    }

    return { statusCode: 400, error, error_msg: description };
};

/**
 * Native Keycloak login using ROPC (Resource Owner Password Credentials) grant.
 * Replaces the HTML form-scraping approach from the reference keycloakSignInRoutes.js.
 */
export const keycloakNativeLogin = async (
    emailId: string,
    password: string
): Promise<TokenResponse> => {
    const tokenEndpoint = `${issuerUrl}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: envConfig.KEYCLOAK_ANDROID_CLIENT_ID,
        username: emailId,
        password,
        scope: 'openid',
    });

    if (envConfig.KEYCLOAK_ANDROID_CLIENT_SECRET) {
        params.set('client_secret', envConfig.KEYCLOAK_ANDROID_CLIENT_SECRET);
    }

    try {
        const response = await axios.post(tokenEndpoint, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const { access_token, refresh_token, id_token } = response.data;
        logger.info('keycloakNativeLogin: login successful');
        return { access_token, refresh_token, id_token };
    } catch (err: any) {
        const errorData = err.response?.data || {};
        logger.error('keycloakNativeLogin: login failed', errorData);
        throw mapKeycloakRopcError(errorData);
    }
};

/**
 * Verifies a Google ID token using google-auth-library and returns the payload.
 * Mirrors the verify() function in the reference googleSignInRoutes.js.
 */
export const verifyGoogleIdToken = async (
    idToken: string,
    clientId: string
): Promise<{ email: string; name?: string; sub: string }> => {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.sub) {
        throw new Error('GOOGLE_TOKEN_PAYLOAD_INVALID');
    }

    return { email: payload.email, name: payload.name, sub: payload.sub };
};

/**
 * Returns the Kong bearer token to use for Sunbird API calls from mobile routes.
 * Mobile requests carry their own device token in the Authorization header.
 * Falls back to the anonymous device register token.
 */
const getMobileKongToken = (req: Request): string => {
    const authHeader = req.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return (
        envConfig.KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN ||
        envConfig.KONG_ANONYMOUS_FALLBACK_TOKEN
    );
};

const buildMobileApiHeaders = (req: Request): Record<string, string> => {
    const headers: Record<string, string> = {
        'x-msgid': uuidv4(),
        ts: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss:SSS'),
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${getMobileKongToken(req)}`,
    };
    const deviceId = req.get('x-device-id');
    if (deviceId) headers['x-device-id'] = deviceId;
    return headers;
};

/**
 * Checks whether a user with the given email exists in Sunbird.
 */
export const checkMobileUserExists = async (emailId: string, req: Request): Promise<boolean> => {
    const url = `${envConfig.KONG_URL}/user/v1/exists/email/${emailId}`;
    const response = await axios.get(url, { headers: buildMobileApiHeaders(req) });
    const data = response.data;

    if (data.responseCode !== 'OK') {
        throw new Error(data.params?.errmsg || data.params?.err || 'USER_CHECK_FAILED');
    }
    return data.result.exists;
};

/**
 * Creates a new Sunbird user via the signup API.
 * Throws USER_NAME_NOT_PRESENT if name is missing (matches reference behaviour).
 */
export const createMobileUser = async (
    user: { emailId: string; name?: string },
    clientId: string,
    req: Request
): Promise<void> => {
    if (!user.name) {
        throw new Error('USER_NAME_NOT_PRESENT');
    }

    const url = `${envConfig.KONG_URL}/user/v2/signup`;
    const response = await axios.post(
        url,
        {
            request: { firstName: user.name, email: user.emailId, emailVerified: true },
            params: { source: clientId, signupType: 'google' },
        },
        { headers: buildMobileApiHeaders(req) }
    );

    const data = response.data;
    if (data.responseCode !== 'OK') {
        logger.error('createMobileUser: failed', data);
        throw new Error(data.params?.errmsg || data.params?.err || 'USER_CREATE_FAILED');
    }
};

/**
 * Finds or creates a Google-authenticated user in Sunbird.
 * Waits GOOGLE_SIGN_IN_DELAY_MS after creation for propagation (matches reference).
 */
export const findOrCreateGoogleUser = async (
    googleUser: { emailId: string; name?: string },
    clientId: string,
    req: Request
): Promise<void> => {
    const exists = await checkMobileUserExists(googleUser.emailId, req);
    if (!exists) {
        logger.info(`findOrCreateGoogleUser: creating new user for ${googleUser.emailId}`);
        await createMobileUser(googleUser, clientId, req);
        await new Promise(resolve => setTimeout(resolve, GOOGLE_SIGN_IN_DELAY_MS));
    }
};

/**
 * Creates a Keycloak session for a Google-authenticated Android user using ROPC.
 * Uses KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID with offline_access scope to obtain
 * a refresh token (mirrors obtainDirectly with scope='offline_access').
 */
export const createKeycloakGoogleAndroidSession = async (
    emailId: string
): Promise<TokenResponse> => {
    const tokenEndpoint = `${issuerUrl}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: envConfig.KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID,
        username: emailId,
        scope: 'offline_access',
    });

    if (envConfig.KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET) {
        params.set('client_secret', envConfig.KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET);
    }

    try {
        const response = await axios.post(tokenEndpoint, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const { access_token, refresh_token, id_token } = response.data;
        logger.info(`createKeycloakGoogleAndroidSession: session created for ${emailId}`);
        return { access_token, refresh_token, id_token };
    } catch (err: any) {
        const errorData = err.response?.data || {};
        logger.error('createKeycloakGoogleAndroidSession: failed', errorData);
        throw mapKeycloakRopcError(errorData);
    }
};

/**
 * Verifies the caller's authorization token against the echo API.
 * Mirrors verifyAuthToken from the reference refreshTokenRoutes.js.
 */
export const verifyEchoAuthToken = async (authorization: string): Promise<void> => {
    await axios.get(`${envConfig.KONG_URL}/test`, {
        headers: { authorization },
        timeout: 60000,
    });
};

/**
 * Refreshes a Keycloak token using the refresh_token grant.
 * Attaches client_secret only for confidential clients.
 */
export const refreshMobileToken = async (
    clientDetails: MobileClientConfig,
    refreshToken: string
): Promise<Record<string, unknown>> => {
    const tokenEndpoint = `${issuerUrl}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientDetails.client_id,
        refresh_token: refreshToken,
    });

    if (clientDetails.client_secret) {
        params.set('client_secret', clientDetails.client_secret);
    }

    try {
        const response = await axios.post(tokenEndpoint, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 60000,
        });
        return response.data;
    } catch (err: any) {
        const errorData = err.response?.data || {};
        logger.error('refreshMobileToken: failed', errorData);
        throw {
            statusCode: err.response?.status || 500,
            error: errorData.error || 'INVALID_REQUEST',
            error_msg: errorData.error_description || errorData.error || 'Token refresh failed',
        };
    }
};

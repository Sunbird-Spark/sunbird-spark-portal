import axios from "axios";
import { envConfig } from '../config/env.js';
import { Request } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';
import { saveSession } from '../utils/sessionUtils.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';

// Use envConfig directly to ensure mocks are picked up correctly in tests

export const refreshSessionTTL = (req: Request) => {
    if (req?.session?.userId && req?.oidc?.isAuthenticated) {
        setSessionTTLFromToken(req);
    } else {
        _.set(req, 'session.cookie.maxAge', envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL);
        _.set(req, 'session.cookie.expires', new Date(Date.now() + envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL));
    }
};

export const isSessionNearExpiry = (req: Request): boolean => {
    const expiresAt = req.session?.cookie?.expires;
    if (!expiresAt || !(expiresAt instanceof Date)) return true;
    const remaining = expiresAt.getTime() - Date.now();
    const maxAge = req.session?.cookie?.maxAge ?? envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL;
    const threshold = maxAge / 2;
    return remaining <= threshold;
};

export const generateKongToken = async (req: Request): Promise<string> => {
    const apiEndpoint = `${envConfig.KONG_URL}/api-manager/v2/consumer/portal_anonymous/credential/register`;

    if (!envConfig.KONG_URL || !envConfig.KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN) {
        throw new Error('Device registration configuration missing');
    }

    if (!req.sessionID) {
        throw new Error('Session ID is missing');
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${envConfig.KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN}`
    };

    const response = await axios.post(
        apiEndpoint,
        {
            request: { key: req.sessionID }
        },
        { headers }
    );

    const status = _.get(response.data, 'params.status');
    const token = _.get(response.data, 'result.token');

    if (status !== 'successful') {
        throw new Error('ANONYMOUS_KONG_TOKEN :: Anonymous Kong token generation failed with an unsuccessful response status');
    }

    if (!token) {
        throw new Error('ANONYMOUS_KONG_TOKEN :: Token not found in response');
    }

    return token;
};

export const generateLoggedInKongToken = async (req: Request): Promise<string> => {
    logger.info('LOGGEDIN_KONG_TOKEN :: requesting logged-in token from Kong');

    const apiEndpoint = `${envConfig.KONG_URL}/api-manager/v2/consumer/portal_loggedin/credential/register`;

    try {
        if (!envConfig.KONG_URL || !envConfig.KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN) {
            throw new Error('Device registration configuration missing for logged-in user');
        }

        if (!req.sessionID) {
            throw new Error('Session ID is missing');
        }

        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${envConfig.KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN}`
        };

        const response = await axios.post(
            apiEndpoint,
            { request: { key: req.sessionID } },
            { headers }
        );

        const status = _.get(response.data, 'params.status');
        const token = _.get(response.data, 'result.token');

        if (status === 'successful' && token) {
            return token;
        }

        if (status !== 'successful') {
            throw new Error('Response status was not successful');
        }

        if (!token) {
            throw new Error('Token not found in response');
        }

    } catch (err) {
        logger.error(
            `LOGGEDIN_KONG_TOKEN :: token generation failed for session ${req.sessionID}`,
            err
        );
    }

    return envConfig.KONG_LOGGEDIN_FALLBACK_TOKEN;
};

const KONG_REFRESH_TOKEN_API = '/auth/v1/refresh/token';

export const getKongAccessToken = async (req: Request): Promise<{ accessToken: string; expiresIn?: number } | null> => {
    if (!envConfig.DOMAIN_URL) {
        logger.info('KONG_REFRESH_TOKEN :: DOMAIN_URL not configured, skipping');
        return null;
    }

    const refreshToken = req.session?.['oidc-tokens']?.refresh_token;
    if (!refreshToken) {
        logger.warn('KONG_REFRESH_TOKEN :: No OIDC refresh token available');
        return null;
    }

    const bearerToken = req.session?.kongToken;
    if (!bearerToken) {
        logger.warn('KONG_REFRESH_TOKEN :: No Kong bearer token in session');
        return null;
    }

    const apiEndpoint = `${envConfig.DOMAIN_URL}${KONG_REFRESH_TOKEN_API}`;
    logger.info(`KONG_REFRESH_TOKEN :: requesting Kong access token for session ${req.sessionID}`);

    const response = await axios.post(
        apiEndpoint,
        new URLSearchParams({ refresh_token: refreshToken }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${bearerToken}`,
            },
        }
    );

    const status = _.get(response.data, 'params.status');
    const accessToken = _.get(response.data, 'result.access_token');
    const expiresIn = _.get(response.data, 'result.expires_in');

    if (status !== 'successful' || !accessToken) {
        throw new Error('KONG_REFRESH_TOKEN :: Kong access token refresh failed');
    }

    logger.info(`KONG_REFRESH_TOKEN :: successfully generated Kong access token for session ${req.sessionID}`);
    return { accessToken, expiresIn };
};

export const saveKongTokenToSession = async (req: Request, token: string): Promise<void> => {
    req.session.kongToken = token;
    refreshSessionTTL(req);
    await saveSession(req);
    logger.info(`LOGGEDIN_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
};

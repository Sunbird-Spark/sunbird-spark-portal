import axios from "axios";
import { envConfig } from '../config/env.js';
import { Request } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';
import { saveSession } from '../utils/sessionUtils.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';

const {
    KONG_URL,
    SUNBIRD_ANONYMOUS_SESSION_TTL,
    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: bearerToken,
    KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN: loggedBearerToken,
} = envConfig;

export const refreshSessionTTL = (req: Request) => {
    if (req?.session?.userId && req?.kauth) {
        setSessionTTLFromToken(req);
    } else {
        _.set(req, 'session.cookie.maxAge', SUNBIRD_ANONYMOUS_SESSION_TTL);
        _.set(req, 'session.cookie.expires', new Date(Date.now() + SUNBIRD_ANONYMOUS_SESSION_TTL));
    }
};

export const isSessionNearExpiry = (req: Request): boolean => {
    const expiresAt = req.session?.cookie?.expires;
    if (!expiresAt || !(expiresAt instanceof Date)) return true;
    const remaining = expiresAt.getTime() - Date.now();
    const maxAge = req.session?.cookie?.maxAge ?? SUNBIRD_ANONYMOUS_SESSION_TTL;
    const threshold = maxAge / 2;
    return remaining <= threshold;
};

export const generateKongToken = async (req: Request): Promise<string> => {
    const apiEndpoint = `${KONG_URL}/api-manager/v2/consumer/portal_anonymous/credential/register`;

    if (!KONG_URL || !bearerToken) {
        throw new Error('Device registration configuration missing');
    }

    if (!req.sessionID) {
        throw new Error('Session ID is missing');
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`
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

    const apiEndpoint = `${KONG_URL}/api-manager/v2/consumer/portal_loggedin/credential/register`;

    try {
        if (!KONG_URL || !loggedBearerToken) {
            throw new Error('Device registration configuration missing for logged-in user');
        }

        if (!req.sessionID) {
            throw new Error('Session ID is missing');
        }

        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${loggedBearerToken}`
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

export const saveKongTokenToSession = async (req: Request, token: string): Promise<void> => {
    req.session.kongToken = token;
    refreshSessionTTL(req);
    await saveSession(req);
    logger.info(`LOGGEDIN_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
};
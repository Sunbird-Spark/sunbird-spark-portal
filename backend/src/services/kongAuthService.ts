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
    if (req.session.userId) {
        setSessionTTLFromToken(req);
    } else {
        req.session.cookie.maxAge = SUNBIRD_ANONYMOUS_SESSION_TTL;
        req.session.cookie.expires = new Date(Date.now() + SUNBIRD_ANONYMOUS_SESSION_TTL);
    }
};

export const generateKongToken = async (req: Request): Promise<string> => {
    const deviceRegisterAPI = KONG_URL + '/api-manager/v2/consumer/portal_anonymous/credential/register';
    if (!deviceRegisterAPI || !bearerToken) {
        throw new Error('Device registration configuration missing');
    }

    if (!req.sessionID) {
        throw new Error('Session ID is missing');
    }

    const response = await axios.post(
        deviceRegisterAPI,
        {
            request: { key: req.sessionID }
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${bearerToken}`
            }
        }
    );

    if (_.get(response.data, 'params.status') === 'successful') {
        const token = _.get(response.data, 'result.token');
        if (!token) {
            throw new Error('ANONYMOUS_KONG_TOKEN :: Token not found in response');
        }
        return token;
    }

    throw new Error('ANONYMOUS_KONG_TOKEN :: Anonymous Kong token generation failed with an unsuccessful response status');
};

export const generateLoggedInKongToken = async (req: Request): Promise<string> => {
    logger.info('LOGGEDIN_KONG_TOKEN :: requesting logged-in token from Kong');

    let token = envConfig.KONG_LOGGEDIN_FALLBACK_TOKEN;

    const loggedInDeviceRegistedAPI = KONG_URL + '/api-manager/v2/consumer/portal_loggedin/credential/register';

    try {
        if (!loggedInDeviceRegistedAPI || !loggedBearerToken) {
            throw new Error('Device registration configuration missing for logged-in user');
        }

        if (!req.sessionID) {
            throw new Error('Session ID is missing');
        }

        const response = await axios.post(
            loggedInDeviceRegistedAPI,
            { request: { key: req.sessionID } },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${loggedBearerToken}`
                }
            }
        );

        if (_.get(response.data, 'params.status') === 'successful') {
            token = _.get(response.data, 'result.token');
            if (!token) {
                throw new Error('LOGGEDIN_KONG_TOKEN :: Token not found in response');
            }
        }
    } catch (err) {
        logger.error(
            `LOGGEDIN_KONG_TOKEN :: token generation failed for session ${req.sessionID}`,
            err
        );
    }

    return token;
};

export const saveKongTokenToSession = async (req: Request, token: string): Promise<void> => {
    req.session.kongToken = token;
    refreshSessionTTL(req);
    await saveSession(req);
    logger.info(`LOGGEDIN_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
};
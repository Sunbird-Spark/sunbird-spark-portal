import axios from "axios";
import { envConfig } from '../config/env.js';
import { Request } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';

const {
    KONG_ANONYMOUS_DEVICE_REGISTER_API: deviceRegisterAPI,
    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: bearerToken,
    SUNBIRD_ANONYMOUS_SESSION_TTL,
    KONG_LOGGEDIN_DEVICE_REGISTER_API: loggedInDeviceRegistedAPI,
    KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN: loggedBearerToken,
    SUNBIRD_LOGGEDIN_SESSION_TTL,
} = envConfig;

export const refreshSessionTTL = (req: Request) => {
    if (req.session.userId) {
        req.session.cookie.maxAge = SUNBIRD_LOGGEDIN_SESSION_TTL;
        req.session.cookie.expires = new Date(Date.now() + SUNBIRD_LOGGEDIN_SESSION_TTL);
    } else {
        req.session.cookie.maxAge = SUNBIRD_ANONYMOUS_SESSION_TTL;
        req.session.cookie.expires = new Date(Date.now() + SUNBIRD_ANONYMOUS_SESSION_TTL);
    }
};

export const generateKongToken = async (req: Request): Promise<string> => {
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

export const generateLoggedInKongToken = async (req: Request): Promise<void> => {

    if (req.session.kongToken) {
        refreshSessionTTL(req);

        await new Promise<void>((resolve, reject) => {
            req.session.save((err: Error) => {
                if (err) {
                    logger.error('LOGGEDIN_KONG_TOKEN :: failed to save session', err);
                    reject(err);
                } else {
                    logger.info(`LOGGEDIN_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
                    resolve();
                }
            });
        });

        return;
    }

    logger.info('LOGGEDIN_KONG_TOKEN :: requesting logged-in token from Kong');

    let token = envConfig.KONG_LOGGEDIN_FALLBACK_TOKEN;

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

    req.session.kongToken = token;
    req.session['auth_redirect_uri'] = req.protocol + `://${req.get('host')}/resources?auth_callback=1`;
    refreshSessionTTL(req);
    await new Promise<void>((resolve, reject) => {
        req.session.save((err: Error) => {
            if (err) {
                logger.error('LOGGEDIN_KONG_TOKEN :: failed to save session', err);
                reject(err);
            } else {
                logger.info(`LOGGEDIN_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
                resolve();
            }
        });
    });
};
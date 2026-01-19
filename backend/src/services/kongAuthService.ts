import axios from "axios";
import { envConfig } from '../config/env.js';
import { Request, NextFunction } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';

const {
    KONG_ANONYMOUS_DEVICE_REGISTER_API: deviceRegisterAPI,
    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: bearerToken,
    SUNBIRD_ANONYMOUS_SESSION_TTL
} = envConfig;

export const refreshSessionTTL = (req: Request) => {
    if (req.session.cookie) {
        req.session.cookie.maxAge = SUNBIRD_ANONYMOUS_SESSION_TTL;
        req.session.cookie.expires = new Date(Date.now() + SUNBIRD_ANONYMOUS_SESSION_TTL);
    }
};

export const saveSession = (req: Request, next: NextFunction) => {
    req.session.save((err: Error) => {
        if (err) {
            logger.error('KONG_TOKEN :: failed to save session', err);
            return next(err);
        }
        logger.info(`KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
        next();
    });
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

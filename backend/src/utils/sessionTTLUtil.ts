import type { Request } from 'express';
import _ from 'lodash';
import logger from './logger.js';

export const extractTokenExpiration = (request: Request): number | null => {
    try {
        const refreshTokenExp = request.oidc?.refreshTokenClaims?.exp;
        if (refreshTokenExp && _.isNumber(refreshTokenExp)) {
            return refreshTokenExp;
        }

        const exp = request.oidc?.tokenClaims?.exp;
        if (_.isFinite(exp)) {
            return exp as number;
        }
        return null;
    } catch (error) {
        logger.error('Error extracting token expiration', error);
        return null;
    }
};

export const calculateSessionTTL = (exp: number): number => {
    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = exp - now;

    const ttlSeconds = _.max([remainingSeconds, 60]) || 60;

    return ttlSeconds * 1000;
};

export const setSessionTTLFromToken = (request: Request): void => {
    const exp = extractTokenExpiration(request);

    if (!exp) {
        const error = new Error('Token expiration not available - cannot set session TTL');
        logger.error('Failed to set session TTL from token', error);
        throw error;
    }

    const ttl = calculateSessionTTL(exp);
    request.session.cookie.maxAge = ttl;
    request.session.cookie.expires = new Date(Date.now() + ttl);

    const expirationDate = new Date(exp * 1000);
    logger.info(`Session TTL set from OIDC token: ${ttl}ms (expires at ${expirationDate.toISOString()})`);
};

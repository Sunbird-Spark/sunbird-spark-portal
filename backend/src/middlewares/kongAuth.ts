import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { generateKongToken, generateLoggedInKongToken, refreshSessionTTL, isSessionNearExpiry } from '../services/kongAuthService.js';
import { saveSession } from '../utils/sessionUtils.js';

export const registerDeviceWithKong = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        logger.info(`registerDeviceWithKong :: ${req.method} ${req.originalUrl}`);
        // Reuse existing token — only refresh if session is near expiry
        if (req.session.kongToken) {
            const isAnonymous = !req.session.userId;

            if (!isSessionNearExpiry(req)) {
                if (isAnonymous) {
                    logger.info('ANONYMOUS_KONG_TOKEN :: session still valid, skipping refresh');
                }
                return next();
            }

            if (isAnonymous) {
                logger.info('ANONYMOUS_KONG_TOKEN :: refreshing near-expiry session');
            }

            refreshSessionTTL(req);
            try {
                await saveSession(req);
                if (isAnonymous) {
                    logger.info(`ANONYMOUS_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
                }
            } catch (err) {
                if (isAnonymous) {
                    logger.error('ANONYMOUS_KONG_TOKEN :: failed to save session', err);
                }
                return next(err);
            }
            return next();
        }

        // Logged-in user with missing token — attempt re-registration with Kong
        if (req.session.userId) {
            logger.info(`LOGGEDIN_KONG_TOKEN :: no token for authenticated user, re-registering session`);
            let token: string;
            try {
                token = await generateLoggedInKongToken(req);
            } catch (err) {
                logger.error(`LOGGEDIN_KONG_TOKEN :: re-registration failed for session ${req.sessionID}`, err);
                return next(err);
            }
            req.session.kongToken = token;
            refreshSessionTTL(req);
            try {
                await saveSession(req);
                logger.info(`LOGGEDIN_KONG_TOKEN :: session re-registered with ID: ${req.sessionID}`);
            } catch (err) {
                logger.error('LOGGEDIN_KONG_TOKEN :: failed to save session', err);
                return next(err);
            }
            return next();
        }

        // Only generate anonymous token for non-authenticated users
        if (!req.session.userId) {
            logger.info('ANONYMOUS_KONG_TOKEN :: requesting anonymous token from Kong');

            let token: string | null;

            try {
                token = await generateKongToken(req);

                if (!token) {
                    logger.error('ANONYMOUS_KONG_TOKEN :: fallback token missing in config');
                }
            } catch (err) {
                logger.error(
                    `ANONYMOUS_KONG_TOKEN :: token generation failed for session ${req.sessionID}`,
                    err
                );
                token = envConfig.KONG_ANONYMOUS_FALLBACK_TOKEN;
            }

            req.session.kongToken = token;
            refreshSessionTTL(req);
            req.session['roles'] = [];
            req.session.roles = ['ANONYMOUS'];
            try {
                await saveSession(req);
                logger.info(`ANONYMOUS_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
            } catch (err) {
                logger.error('ANONYMOUS_KONG_TOKEN :: failed to save session', err);
                return next(err);
            }
        }

        next();
    };
};

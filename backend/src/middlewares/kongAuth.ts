import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { generateKongToken, generateLoggedInKongToken, refreshSessionTTL, isSessionNearExpiry } from '../services/kongAuthService.js';
import { saveSession } from '../utils/sessionUtils.js';

export const registerDeviceWithKong = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        logger.info(`registerDeviceWithKong :: ${req.method} ${req.originalUrl}`);

        // If user is authenticated but still holding an anonymous Kong token, upgrade it
        if (req.session.kongToken && req.session.userId && req.session.kongTokenType === 'anonymous') {
            logger.info('KONG_TOKEN_UPGRADE :: authenticated user with anonymous token, upgrading to logged-in token');
            try {
                const token = await generateLoggedInKongToken(req);
                req.session.kongToken = token;
                req.session.kongTokenType = 'logged-in';
                refreshSessionTTL(req);
                await saveSession(req);
                logger.info('KONG_TOKEN_UPGRADE :: successfully upgraded to logged-in Kong token');
            } catch (err) {
                logger.error('KONG_TOKEN_UPGRADE :: failed to upgrade token', err);
            }
            return next();
        }

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
            req.session.kongTokenType = 'anonymous';
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

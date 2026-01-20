import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { generateKongToken, refreshSessionTTL } from '../services/kongAuthService.js';
import { saveSession } from '../utils/sessionUtils.js';

export const registerDeviceWithKong = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        logger.info(`sessionid ${req.sessionID}`);
        if (req.session.userId) {
            refreshSessionTTL(req);
            try {
                await saveSession(req);
                return next();
            } catch (err) {
                return next(err);
            }
        }

        if (req.session.kongToken) {
            logger.info('ANONYMOUS_KONG_TOKEN :: using existing token');
            refreshSessionTTL(req);
            try {
                await saveSession(req);
                logger.info(`ANONYMOUS_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
                return next();
            } catch (err) {
                logger.error('ANONYMOUS_KONG_TOKEN :: failed to save session', err);
                return next(err);
            }
        }

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
            next();
        } catch (err) {
            logger.error('ANONYMOUS_KONG_TOKEN :: failed to save session', err);
            return next(err);
        }
    };
};
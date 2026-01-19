import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { generateKongToken, refreshSessionTTL, saveSession } from '../services/kongAuthService.js';

export const registerDeviceWithKong = () => {
    return async (req: Request, res: Response, next: NextFunction) => {

        if (req.session.kongToken) {
            logger.info('ANONYMOUS_KONG_TOKEN :: using existing token');
            refreshSessionTTL(req);
            return saveSession(req, next);
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
        saveSession(req, next);
    };
};
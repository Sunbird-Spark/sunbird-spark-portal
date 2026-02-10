import { Request, Response, NextFunction } from 'express';
import { getDefaultOrg, setOrgToSession, saveOrgSession } from '../services/organizationService.js';
import { getBearerToken } from '../utils/proxyUtils.js';
import logger from '../utils/logger.js';

/**
 * Middleware to set anonymous organization/channel ID
 * Only runs if channel ID is not already set in session
 */
export const setAnonymousOrg = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Skip if channel ID already set (logged-in user or already initialized)
            if (req.session?.rootOrghashTagId) {
                return next();
            }

            // Hardcoded slug (like mobile app)
            const slug = 'sunbird';
            const bearerToken = getBearerToken(req);

            const org = await getDefaultOrg(slug, bearerToken);
            setOrgToSession(req, org);
            await saveOrgSession(req);

            next();
        } catch (error: any) {
            // Don't block the request if org fetch fails
            logger.warn('setAnonymousOrg :: Failed to set anonymous org, continuing', {
                error: error.message,
            });
            next();
        }
    };
};

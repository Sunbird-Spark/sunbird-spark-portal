import { Request, Response } from 'express';
import { hasTenant, getTenantPath } from '../services/tenantService.js';
import logger from '../utils/logger.js';

export const redirectTenant = (req: Request, res: Response, next: any) => {
    const tenantName = req.params.tenantName as string;

    if (!hasTenant(tenantName)) {
        return next();
    }

    try {
        const tenantFile = getTenantPath(tenantName);
        res.sendFile(tenantFile, (error) => {
            logger.warn('Error sending tenant file:', error);
            if (error && !res.headersSent) {
                next();
            }
        });
    } catch (error) {
        logger.warn('Error sending tenant file:', error);
        next();
    }
}
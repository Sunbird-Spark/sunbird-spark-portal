import { Request, Response } from 'express';
import { hasTenant, getTenantPath } from '../services/tenantService.js';

export const redirectTenant = (req: Request, res: Response, next: any) => {
    const tenantName = req.params.tenantName as string;

    if (hasTenant(tenantName)) {
        const tenantFile = getTenantPath(tenantName);
        return res.sendFile(tenantFile, (err) => {
            if (err) {
                if (!res.headersSent) {
                    next();
                }
            }
        });
    }
    next();
}
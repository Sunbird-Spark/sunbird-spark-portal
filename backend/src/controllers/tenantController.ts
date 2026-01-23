import { Request, Response } from 'express';
import { hasTenant, getTenantPath } from '../services/tenantService.js';

export const redirectTenant = async (req: Request, res: Response) => {
    const tenantName = req.params.tenantName as string;

    if (hasTenant(tenantName)) {
        const tenantFile = getTenantPath(tenantName);
        return res.sendFile(tenantFile, (err) => {
            if (err) {
                if (!res.headersSent) {
                    res.status(404).send('Tenant not found');
                }
            }
        });
    }
    res.status(404).send('Tenant not found');
}


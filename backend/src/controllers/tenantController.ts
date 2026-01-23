import { Request, Response } from 'express';
import { hasTenant, getTenantPath } from '../services/tenantService.js';

export const redirectTenant = (req: Request, res: Response) => {
    let tenantName = req.params.tenantName as string;

    if (tenantName) {
        tenantName = tenantName.trim().toLowerCase();

        if (hasTenant(tenantName)) {
            const tenantFile = getTenantPath(tenantName);
            return res.sendFile(tenantFile);
        }
    }
    res.status(404).send('Not Found');
}


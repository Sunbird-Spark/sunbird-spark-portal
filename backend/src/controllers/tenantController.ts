import { Request, Response } from 'express';
import { hasTenant, getTenantPath } from '../services/tenantService.js';

const TENANT_NAME_REGEX = /^[a-z0-9_-]+$/;

export const redirectTenant = async (req: Request, res: Response) => {
    let tenantName = req.params.tenantName as string;

    if (tenantName) {
        tenantName = tenantName.trim().toLowerCase();

        if (TENANT_NAME_REGEX.test(tenantName) && hasTenant(tenantName)) {
            const tenantFile = getTenantPath(tenantName);
            return res.sendFile(tenantFile, (err) => {
                if (err) {
                    if (!res.headersSent) {
                        res.status(404).send('Tenant not found');
                    }
                }
            });
        }
    }
    res.status(404).send('Tenant not found');
}


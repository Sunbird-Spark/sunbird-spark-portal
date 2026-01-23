import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirectTenant } from './tenantController.js';
import * as tenantService from '../services/tenantService.js';

// Mock the entire service module
vi.mock('../services/tenantService.js', () => ({
    hasTenant: vi.fn(),
    getTenantPath: vi.fn()
}));

describe('TenantController', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        req = { params: {} };
        res = {
            sendFile: vi.fn(),
            status: vi.fn().mockReturnThis(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    it('should redirect to tenant file if valid', () => {
        req.params.tenantName = ' AP '; // With spaces and uppercase
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/mock/path/ap/index.html');

        redirectTenant(req, res);

        // Expect normalization
        expect(tenantService.hasTenant).toHaveBeenCalledWith('ap');
        expect(tenantService.getTenantPath).toHaveBeenCalledWith('ap');
        expect(res.sendFile).toHaveBeenCalledWith('/mock/path/ap/index.html');
    });

    it('should return 404 if tenant is invalid', () => {
        req.params.tenantName = 'invalid';
        (tenantService.hasTenant as any).mockReturnValue(false);

        redirectTenant(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Tenant not found');
    });

    it('should return 404 if tenantName is missing', () => {
        req.params.tenantName = undefined;

        redirectTenant(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Tenant not found');
    });
});

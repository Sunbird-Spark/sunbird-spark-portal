import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirectTenant } from './tenantController.js';
import * as tenantService from '../services/tenantService.js';

vi.mock('../services/tenantService.js', () => ({
    hasTenant: vi.fn(),
    getTenantPath: vi.fn(),
    isValidTenantName: vi.fn().mockReturnValue(true)
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
        // Default valid behavior
        (tenantService.isValidTenantName as any).mockReturnValue(true);
    });

    it('should redirect to tenant file if valid', () => {
        req.params.tenantName = ' AP '; // With spaces and uppercase
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/mock/path/ap/index.html');

        redirectTenant(req, res);

        // Controller now just passes the raw name to the service
        expect(tenantService.hasTenant).toHaveBeenCalledWith(' AP ');
        expect(tenantService.getTenantPath).toHaveBeenCalledWith(' AP ');
        expect(res.sendFile).toHaveBeenCalledWith('/mock/path/ap/index.html', expect.any(Function));
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
        (tenantService.hasTenant as any).mockReturnValue(false);

        redirectTenant(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Tenant not found');
    });

    it('should return 404 if tenantName is null', () => {
        req.params.tenantName = null;
        (tenantService.hasTenant as any).mockReturnValue(false);

        redirectTenant(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Tenant not found');
    });

    it('should return 404 if tenant name is unsafe', () => {
        req.params.tenantName = '../invalid';
        (tenantService.hasTenant as any).mockReturnValue(false);

        redirectTenant(req, res);

        expect(tenantService.hasTenant).toHaveBeenCalledWith('../invalid');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Tenant not found');
    });

    it('should handle sendFile error', () => {
        req.params.tenantName = 'ap';
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/path/to/ap/index.html');

        // Mock sendFile to trigger callback with error
        res.sendFile.mockImplementation((_path: string, cb: any) => {
            cb(new Error('File access error'));
        });

        redirectTenant(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Tenant not found');
    });
});

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
        const next = vi.fn();
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/mock/path/ap/index.html');

        redirectTenant(req, res, next);

        // Controller now just passes the raw name to the service
        expect(tenantService.hasTenant).toHaveBeenCalledWith(' AP ');
        expect(tenantService.getTenantPath).toHaveBeenCalledWith(' AP ');
        expect(res.sendFile).toHaveBeenCalledWith('/mock/path/ap/index.html', expect.any(Function));
    });

    it('should call next() if tenant is not found', () => {
        req.params.tenantName = 'invalid';
        const next = vi.fn();
        (tenantService.hasTenant as any).mockReturnValue(false);

        redirectTenant(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
    });

    it('should call next() if tenantName is missing', () => {
        req.params.tenantName = undefined;
        const next = vi.fn();
        (tenantService.hasTenant as any).mockReturnValue(false);

        redirectTenant(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() if tenantName is null', () => {
        req.params.tenantName = null;
        const next = vi.fn();
        (tenantService.hasTenant as any).mockReturnValue(false);

        redirectTenant(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() if sendFile fails', () => {
        req.params.tenantName = 'ap';
        const next = vi.fn();
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/path/to/ap/index.html');

        // Mock sendFile to trigger callback with error
        res.sendFile.mockImplementation((_path: string, cb: any) => {
            cb(new Error('File access error'));
        });

        redirectTenant(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should not call next() if headers sent when sendFile fails', () => {
        req.params.tenantName = 'ap';
        const next = vi.fn();
        res.headersSent = true;
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/path/to/ap/index.html');

        // Mock sendFile to trigger callback with error
        res.sendFile.mockImplementation((_path: string, cb: any) => {
            cb(new Error('File access error'));
        });

        redirectTenant(req, res, next);

        expect(next).not.toHaveBeenCalled();
    });

    it('should not call next() if headers sent during sendFile execution', () => {
        req.params.tenantName = 'ap';
        const next = vi.fn();
        res.headersSent = false;
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/path/to/ap/index.html');

        // Mock sendFile to trigger callback with error after headers are sent
        res.sendFile.mockImplementation((_path: string, cb: any) => {
            res.headersSent = true;
            cb(new Error('File access error'));
        });

        redirectTenant(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
    });

    it('should handle successful sendFile (happy path)', () => {
        req.params.tenantName = 'ap';
        const next = vi.fn();
        (tenantService.hasTenant as any).mockReturnValue(true);
        (tenantService.getTenantPath as any).mockReturnValue('/path/to/ap/index.html');

        // Mock sendFile to trigger callback successfully (no error)
        res.sendFile.mockImplementation((_path: string, cb: any) => {
            cb(null);
        });

        redirectTenant(req, res, next);

        expect(res.sendFile).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled(); // Should not call next on success
    });
});

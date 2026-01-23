import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tenantService from './tenantService.js';
import fs from 'fs/promises';

vi.mock('fs/promises');

describe('TenantService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it('should not load tenants if directory does not exist', async () => {
        (fs.access as any).mockRejectedValue(new Error('no access'));

        await tenantService.loadTenants();

        expect(fs.access).toHaveBeenCalled();
        expect(fs.readdir).not.toHaveBeenCalled();
    });

    it('should load tenants from directory', async () => {
        (fs.access as any).mockResolvedValue(undefined);
        (fs.readdir as any).mockResolvedValue([
            { name: 'tenant1', isDirectory: () => true },
            { name: 'TENANT2', isDirectory: () => true },
            { name: 'file.txt', isDirectory: () => false }
        ]);

        await tenantService.loadTenants();

        expect(tenantService.hasTenant('tenant1')).toBe(true);
        expect(tenantService.hasTenant('tenant2')).toBe(true);
        expect(tenantService.hasTenant('file.txt')).toBe(false);
    });

    it('should handle errors during load', async () => {
        (fs.access as any).mockResolvedValue(undefined);
        (fs.readdir as any).mockRejectedValue(new Error('Access denied'));

        await expect(tenantService.loadTenants()).resolves.not.toThrow();
    });

    it('should return correct tenant path', () => {
        const p = tenantService.getTenantPath('ap');
        expect(p).toContain('ap/index.html');
    });
});

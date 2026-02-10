import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tenantService from './tenantService.js';
import fs from 'fs/promises';

vi.mock('fs/promises', () => ({
    default: {
        readdir: vi.fn(),
        stat: vi.fn(),
    }
}));

describe('TenantService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        tenantService.clearCache();
    });

    afterEach(() => {
        vi.resetModules();
        tenantService.clearCache();
    });

    it('should not load tenants if directory does not exist', async () => {
        const error: any = new Error('no access');
        error.code = 'ENOENT';
        (fs.readdir as any).mockRejectedValue(error);

        await tenantService.loadTenants();

        expect(fs.readdir).toHaveBeenCalled();
    });

    it('should load tenants from directory', async () => {
        (fs.stat as any).mockResolvedValue({});
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

    it('should ignore directories without index.html', async () => {
        (fs.readdir as any).mockResolvedValue([
            { name: 'goodTenant', isDirectory: () => true },
            { name: 'badTenant', isDirectory: () => true }
        ]);

        (fs.stat as any).mockImplementation(async (filePath: string) => {
            // Check if the path ends with goodTenant/index.html
            const normalizedPath = filePath.toLowerCase();
            // Use path separator agnostic check or just loose check but specific enough
            if (normalizedPath.includes('goodtenant/index.html')) {
                return {};
            }
            throw new Error('ENOENT');
        });

        await tenantService.loadTenants();

        expect(tenantService.hasTenant('goodTenant')).toBe(true);
        expect(tenantService.hasTenant('badTenant')).toBe(false);
    });

    it('should handle errors during load', async () => {
        (fs.stat as any).mockResolvedValue({});
        (fs.readdir as any).mockRejectedValue(new Error('Access denied'));

        await expect(tenantService.loadTenants()).resolves.toBeUndefined();
    });

    it('should return correct tenant path', () => {
        const p = tenantService.getTenantPath('ap');
        expect(p).toContain('ap/index.html');
    });

    it('should normalize tenant name to lowercase internally', async () => {
        (fs.stat as any).mockResolvedValue({});
        (fs.readdir as any).mockResolvedValue([
            { name: 'tenant1', isDirectory: () => true },
            { name: 'ap', isDirectory: () => true }
        ]);
        await tenantService.loadTenants();

        expect(tenantService.hasTenant(' AP ')).toBe(true);
        expect(tenantService.hasTenant(' TENANT1 ')).toBe(true);

        const p = tenantService.getTenantPath(' AP ');
        expect(p).toContain('ap/index.html');
    });

    it('should handle undefined/null inputs gracefully', () => {
        expect(tenantService.hasTenant(undefined)).toBe(false);
        expect(tenantService.hasTenant(null as any)).toBe(false);
        expect(() => tenantService.getTenantPath(undefined)).toThrow('Invalid tenant name');
    });

    it('should throw error for unsafe paths', () => {
        expect(() => tenantService.getTenantPath('../test')).toThrow('Invalid tenant name');
        expect(() => tenantService.getTenantPath('test/path')).toThrow('Invalid tenant name');
    });

    it('should validate tenant name correctly', () => {
        expect(tenantService.isValidTenantName('valid-name')).toBe(true);
        expect(tenantService.isValidTenantName('valid_name')).toBe(true);
        expect(tenantService.isValidTenantName('valid123')).toBe(true);

        expect(tenantService.isValidTenantName('invalid/name')).toBe(false);
        expect(tenantService.isValidTenantName('invalid..name')).toBe(false);
        expect(tenantService.isValidTenantName('invalid name')).toBe(false);
    });
});

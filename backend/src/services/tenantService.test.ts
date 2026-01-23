import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tenantService from './tenantService.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');
vi.mock('path');

describe('TenantService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock path.join to just return valid strings or stub logic
        (path.join as any).mockImplementation((...args: string[]) => args.join('/'));
        // Mock dirname
        (path.dirname as any).mockReturnValue('/mock/dir');
    });

    afterEach(() => {
        vi.resetModules();
    });

    it('should not load tenants if directory does not exist', () => {
        (fs.existsSync as any).mockReturnValue(false);
        // Spy on logger if possible, or just ensure no crash
        // Since loadTenants accesses module-level vars, we need to consider that.
        // We can just call it.
        tenantService.loadTenants();
        expect(fs.existsSync).toHaveBeenCalled();
        expect(fs.readdirSync).not.toHaveBeenCalled();
    });

    it('should load tenants from directory', () => {
        (fs.existsSync as any).mockReturnValue(true);
        (fs.readdirSync as any).mockReturnValue([
            { name: 'tenant1', isDirectory: () => true },
            { name: 'TENANT2', isDirectory: () => true }, // Check lowercase logic
            { name: 'file.txt', isDirectory: () => false }
        ]);

        tenantService.loadTenants();

        // internal cache is not exported, so we test via hasTenant
        expect(tenantService.hasTenant('tenant1')).toBe(true);
        expect(tenantService.hasTenant('tenant2')).toBe(true);
        expect(tenantService.hasTenant('file.txt')).toBe(false);
    });

    it('should handle errors during load', () => {
        (fs.existsSync as any).mockReturnValue(true);
        (fs.readdirSync as any).mockImplementation(() => { throw new Error('Access denied'); });

        // Should not throw
        expect(() => tenantService.loadTenants()).not.toThrow();
    });

    it('should return correct tenant path', () => {
        const p = tenantService.getTenantPath('ap');
        expect(p).toContain('ap/index.html');
    });
});

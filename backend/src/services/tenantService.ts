import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tenantCache: Set<string> = new Set();
const tenantPath = path.join(__dirname, '../../tenant');

export const clearCache = () => {
    tenantCache.clear();
};

const loadTenant = async (itemName: string) => {
    try {
        await fs.stat(path.join(tenantPath, itemName, 'index.html'));
        tenantCache.add(itemName.toLowerCase());
    } catch {
        // Ignore directories without index.html
        logger.warn('Ignored tenant without index.html:', itemName);
    }
};

export const loadTenants = async () => {
    clearCache();
    try {
        const items = await fs.readdir(tenantPath, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                await loadTenant(item.name);
            }
        }
        logger.info(`Loaded ${tenantCache.size} tenants: ${Array.from(tenantCache).join(', ')}`);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            logger.warn(`Tenant directory not found at ${tenantPath}`, error?.message);
            return;
        }
        logger.warn('Error loading tenants:', error);
    }
};

export const isValidTenantName = (name: string): boolean => {
    return /^[a-z0-9_-]+$/.test(name);
};

export const hasTenant = (tenantName: string | undefined | null): boolean => {
    if (!tenantName) return false;
    const normalized = tenantName.trim().toLowerCase();
    if (!isValidTenantName(normalized)) return false;
    return tenantCache.has(normalized);
};

export const getTenantPath = (tenantName: string | undefined | null): string => {
    if (!tenantName) throw new Error('Invalid tenant name');
    const normalized = tenantName.trim().toLowerCase();

    if (!isValidTenantName(normalized)) {
        throw new Error('Invalid tenant name');
    }

    return path.join(tenantPath, normalized, 'index.html');
};

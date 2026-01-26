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

export const loadTenants = async () => {
    clearCache();
    try {
        await fs.access(tenantPath);
    } catch {
        logger.warn(`Tenant directory not found at ${tenantPath}`);
        return;
    }

    try {
        const items = await fs.readdir(tenantPath, { withFileTypes: true });
        items.forEach(item => {
            if (item.isDirectory()) {
                tenantCache.add(item.name.toLowerCase());
            }
        });
        logger.info(`Loaded ${tenantCache.size} tenants: ${Array.from(tenantCache).join(', ')}`);
    } catch (error) {
        logger.error('Error loading tenants:', error);
        throw error; // Re-throw to allow caller to handle critical failure
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

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tenantCache: Set<string> = new Set();
const tenantPath = path.join(__dirname, '../../tenant');

export const loadTenants = async () => {
    try {
        try {
            await fs.access(tenantPath);
        } catch {
            logger.warn(`Tenant directory not found at ${tenantPath}`);
            return;
        }
        const items = await fs.readdir(tenantPath, { withFileTypes: true });
        items.forEach(item => {
            if (item.isDirectory()) {
                tenantCache.add(item.name.toLowerCase());
            }
        });
        logger.info(`Loaded ${tenantCache.size} tenants: ${Array.from(tenantCache).join(', ')}`);
    } catch (error) {
        logger.error('Error loading tenants:', error);
    }
};

export const hasTenant = (tenantName: string): boolean => {
    return tenantCache.has(tenantName);
};

export const getTenantPath = (tenantName: string): string => {
    // Prevent path traversal
    if (tenantName.includes('..') || tenantName.includes('/') || tenantName.includes('\\')) {
        return '';
    }
    return path.join(tenantPath, tenantName, 'index.html');
};

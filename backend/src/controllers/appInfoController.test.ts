import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock package.json
vi.mock('../../package.json', () => ({
    default: {
        version: '9.9.9',
        buildHash: 'mocked-hash'
    }
}));

// Mock envConfig using importOriginal to preserve other config values
vi.mock('../config/env.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../config/env.js')>();
    return {
        ...actual,
        envConfig: {
            ...actual.envConfig,
            APPID: 'mock.app.id',
            KONG_URL: 'http://localhost:8000', // Ensure this is valid URL
        }
    };
});

// Import app AFTER mocking modules
import { app } from '../app.js';

describe('GET /app/v1/info', () => {
    it('should return application metadata with mocked values', async () => {
        const response = await request(app).get('/portal/app/v1/info');

        expect(response.status).toBe(200);
        expect(response.body.responseCode).toBe('OK');
        expect(response.body.result).toEqual({
            version: '9.9.9',
            buildHash: 'mocked-hash',
            appId: 'mock.app.id'
        });
    });
});

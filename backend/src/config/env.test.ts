import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env.ts — ENABLED_SSO_PROVIDERS parsing', () => {
    const ORIGINAL_ENV = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    it('defaults to ["google"] when unset', async () => {
        delete process.env.ENABLED_SSO_PROVIDERS;
        const { envConfig } = await import('./env.js');
        expect(envConfig.ENABLED_SSO_PROVIDERS).toEqual(['google']);
    });

    it('falls back to ["google"] and logs an error on malformed JSON', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        process.env.ENABLED_SSO_PROVIDERS = 'not-json';

        const { envConfig } = await import('./env.js');

        expect(envConfig.ENABLED_SSO_PROVIDERS).toEqual(['google']);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid ENABLED_SSO_PROVIDERS value'));
    });

    it('falls back to ["google"] when parsed value is valid JSON but not an array', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        process.env.ENABLED_SSO_PROVIDERS = '{"provider":"google"}';

        const { envConfig } = await import('./env.js');

        expect(envConfig.ENABLED_SSO_PROVIDERS).toEqual(['google']);
    });

    it('parses a valid JSON array as-is (registry validation happens elsewhere)', async () => {
        process.env.ENABLED_SSO_PROVIDERS = '["google","microsoft"]';
        const { envConfig } = await import('./env.js');
        expect(envConfig.ENABLED_SSO_PROVIDERS).toEqual(['google', 'microsoft']);
    });

    it('parses an empty array as-is (registry validation falls back elsewhere)', async () => {
        process.env.ENABLED_SSO_PROVIDERS = '[]';
        const { envConfig } = await import('./env.js');
        expect(envConfig.ENABLED_SSO_PROVIDERS).toEqual([]);
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }));

vi.mock('../utils/logger.js', () => ({
    default: { error: mockLoggerError, info: vi.fn() },
}));

vi.mock('../services/ssoProviders.js', () => ({
    ssoProviders: { google: {} },
}));

const loadValidateSsoConfig = async (enabledSsoProviders: string[]) => {
    vi.resetModules();
    vi.doMock('../config/env.js', () => ({
        envConfig: { ENABLED_SSO_PROVIDERS: enabledSsoProviders },
    }));
    return (await import('./validateSsoConfig.js')).validateSsoConfig;
};

describe('validateSsoConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps a valid registered provider list as-is', async () => {
        const validateSsoConfig = await loadValidateSsoConfig(['google']);
        expect(validateSsoConfig()).toEqual(['google']);
        expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it('returns an empty list when the list contains only unregistered providers', async () => {
        const validateSsoConfig = await loadValidateSsoConfig(['microsoft']);
        expect(validateSsoConfig()).toEqual([]);
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('microsoft'));
    });

    it('returns an empty list when the list contains an unknown/bogus provider', async () => {
        const validateSsoConfig = await loadValidateSsoConfig(['bogus']);
        expect(validateSsoConfig()).toEqual([]);
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('bogus'));
    });

    it('respects an explicitly empty provider list (SSO disabled)', async () => {
        const validateSsoConfig = await loadValidateSsoConfig([]);
        expect(validateSsoConfig()).toEqual([]);
    });

    it('drops unregistered entries but keeps registered ones from a mixed list', async () => {
        const validateSsoConfig = await loadValidateSsoConfig(['google', 'bogus']);
        expect(validateSsoConfig()).toEqual(['google']);
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('bogus'));
    });

    it('memoizes the result across repeated calls', async () => {
        const validateSsoConfig = await loadValidateSsoConfig(['google', 'bogus']);
        const first = validateSsoConfig();
        const second = validateSsoConfig();
        expect(first).toBe(second);
        expect(mockLoggerError).toHaveBeenCalledTimes(1);
    });
});

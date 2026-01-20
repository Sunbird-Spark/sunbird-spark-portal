import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request } from 'express';
import * as http from 'http';

vi.mock('./logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('logProxyRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    const importProxyUtils = async (overrideEnv?: {
        KONG_ANONYMOUS_FALLBACK_TOKEN?: string;
        APPID?: string;
    }) => {
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                KONG_ANONYMOUS_FALLBACK_TOKEN: overrideEnv?.KONG_ANONYMOUS_FALLBACK_TOKEN || 'fallback-token',
                APPID: overrideEnv?.APPID || 'test-app-id'
            }
        }));
        return await import('./proxyUtils.js');
    };

    it('should not throw when importing proxyUtils module', async () => {
        const module = await importProxyUtils();
        expect(module).toBeDefined();
    });

    it('should export getAuthToken and getBearerToken functions', async () => {
        const { getAuthToken, getBearerToken } = await importProxyUtils();
        expect(typeof getAuthToken).toBe('function');
        expect(typeof getBearerToken).toBe('function');
    });

    it('decorateRequestHeaders should set Connection keep-alive', async () => {
        const { decorateRequestHeaders } = await importProxyUtils();
        const mockProxyReq = { setHeader: vi.fn() } as unknown as http.ClientRequest;
        const mockReq = {
            session: {},
            sessionID: 'session-123',
            get: vi.fn().mockReturnValue(undefined)
        } as unknown as Request;
        decorateRequestHeaders(mockProxyReq, mockReq);
        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    });
});

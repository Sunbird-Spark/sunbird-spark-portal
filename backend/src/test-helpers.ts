import { vi } from 'vitest';

/**
 * Helper function to properly mock modules for tests
 * This ensures mocks are applied before any imports happen
 */
export const setupModuleMocks = () => {
    // Mock logger
    vi.mock('./utils/logger.js', () => ({
        default: {
            info: vi.fn(),
            error: vi.fn()
        }
    }));

    // Mock http-proxy-middleware with proper importOriginal pattern
    vi.mock('http-proxy-middleware', async (importOriginal) => {
        const actual = await importOriginal<typeof import('http-proxy-middleware')>();
        return {
            ...actual,
            createProxyMiddleware: vi.fn(() => (req: any, res: any, next: any) => next()),
            responseInterceptor: vi.fn((fn: Function) => fn),
            fixRequestBody: vi.fn()
        };
    });

    // Mock proxyUtils
    vi.mock('./utils/proxyUtils.js', () => ({
        decorateRequestHeaders: vi.fn()
    }));

    // Mock connect-pg-simple
    vi.mock('connect-pg-simple', () => ({
        default: vi.fn(() => {
            return class MockPgStore extends require('events').EventEmitter {
                constructor() {
                    super();
                }
                get() {}
                set() {}
                destroy() {}
            };
        })
    }));

    // Mock pg
    vi.mock('pg', () => ({
        default: {
            Pool: class MockPool {
                connect(cb: Function) {
                    cb(null, {}, vi.fn());
                }
            }
        }
    }));
};

/**
 * Helper to reset all mocks and modules
 */
export const resetTestEnvironment = () => {
    vi.resetModules();
    vi.clearAllMocks();
};
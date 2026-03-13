import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import session from 'express-session';
import { EventEmitter } from 'events';

vi.mock('./logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('connect-pg-simple', () => ({
    default: vi.fn(() => {
        return class MockPgStore extends EventEmitter {
            constructor() {
                super();
            }
            get() {}
            set() {}
            destroy() {}
        };
    })
}));

class MockPool {
    connect(cb: Mock) {
        cb(null, {}, vi.fn());
    }
}

describe('getSessionStore', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.doUnmock('../config/env.js');
        vi.doUnmock('pg');
    });

    it('should return MemoryStore when SUNBIRD_PORTAL_SESSION_STORE is not yugabyte', async () => {
        vi.doMock('pg', () => ({
            default: { Pool: MockPool }
        }));
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                SUNBIRD_PORTAL_SESSION_STORE: 'memory'
            }
        }));

        const { getSessionStore } = await import('./sessionStore.js');
        const store = getSessionStore();

        expect(store).toBeInstanceOf(session.MemoryStore);
    });

    it('should return MemoryStore when SUNBIRD_PORTAL_SESSION_STORE is undefined', async () => {
        vi.doMock('pg', () => ({
            default: { Pool: MockPool }
        }));
        vi.doMock('../config/env.js', () => ({
            envConfig: {}
        }));

        const { getSessionStore } = await import('./sessionStore.js');
        const store = getSessionStore();

        expect(store).toBeInstanceOf(session.MemoryStore);
    });

    it('should create PgStore when SUNBIRD_PORTAL_SESSION_STORE is yugabyte', async () => {
        vi.doMock('pg', () => ({
            default: { Pool: MockPool }
        }));
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                SUNBIRD_PORTAL_SESSION_STORE: 'yugabyte',
                SUNBIRD_YUGABYTE_HOST: 'localhost',
                SUNBIRD_YUGABYTE_PORT: 5433,
                SUNBIRD_YUGABYTE_DATABASE: 'portal',
                SUNBIRD_YUGABYTE_USER: 'yugabyte',
                SUNBIRD_YUGABYTE_PASSWORD: 'yugabyte',
                SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
            }
        }));

        const logger = (await import('./logger.js')).default;
        const { getSessionStore } = await import('./sessionStore.js');

        const store = getSessionStore();

        expect(store).not.toBeInstanceOf(session.MemoryStore);
        expect(store).toHaveProperty('get');
        expect(store).toHaveProperty('set');
        expect(store).toHaveProperty('destroy');

        expect(logger.info).toHaveBeenCalledWith(
            'Using YugabyteDB (PostgreSQL-compatible) for session management'
        );
    });

    it('should log successful YugabyteDB pool connection and release client', async () => {
        vi.resetModules();

        const mockRelease = vi.fn();

        class SuccessfulPool {
            connect(cb: Mock) {
                cb(null, {}, mockRelease);
            }
        }

        vi.doMock('pg', () => ({
            default: {
                Pool: SuccessfulPool
            }
        }));

        vi.doMock('../config/env.js', () => ({
            envConfig: {
                SUNBIRD_PORTAL_SESSION_STORE: 'yugabyte',
                SUNBIRD_YUGABYTE_HOST: 'localhost',
                SUNBIRD_YUGABYTE_PORT: 5433,
                SUNBIRD_YUGABYTE_DATABASE: 'testdb',
                SUNBIRD_YUGABYTE_USER: 'testuser',
                SUNBIRD_YUGABYTE_PASSWORD: 'testpass',
                SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
            }
        }));

        const logger = (await import('./logger.js')).default;
        const { getSessionStore } = await import('./sessionStore.js');

        getSessionStore();

        expect(logger.info).toHaveBeenCalledWith(
            'Successfully connected to YugabyteDB pool'
        );
        expect(mockRelease).toHaveBeenCalled();
    });

    it('should log error when session store emits error', async () => {
        vi.doMock('pg', () => ({
            default: { Pool: MockPool }
        }));
        vi.doMock('../config/env.js', () => ({
            envConfig: {
                SUNBIRD_PORTAL_SESSION_STORE: 'yugabyte',
                SUNBIRD_YUGABYTE_HOST: 'localhost',
                SUNBIRD_YUGABYTE_PORT: 5433,
                SUNBIRD_YUGABYTE_DATABASE: 'testdb',
                SUNBIRD_YUGABYTE_USER: 'testuser',
                SUNBIRD_YUGABYTE_PASSWORD: 'testpass',
                SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
            }
        }));

        const logger = (await import('./logger.js')).default;
        const { getSessionStore } = await import('./sessionStore.js');

        const store = getSessionStore();
        const error = new Error('Test store error');

        store.emit('error', error);

        expect(logger.error).toHaveBeenCalledWith(
            'Session store error',
            error
        );
    });

    it('should log error when YugabyteDB pool connection fails in test environment', async () => {
        vi.resetModules();

        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

        class FailingPool {
            connect(cb: Mock) {
                cb(new Error('Connection failed'), null, null);
            }
        }

        vi.doMock('pg', () => ({
            default: {
                Pool: FailingPool
            }
        }));

        vi.doMock('../config/env.js', () => ({
            envConfig: {
                SUNBIRD_PORTAL_SESSION_STORE: 'yugabyte',
                SUNBIRD_YUGABYTE_HOST: 'localhost',
                SUNBIRD_YUGABYTE_PORT: 5433,
                SUNBIRD_YUGABYTE_DATABASE: 'testdb',
                SUNBIRD_YUGABYTE_USER: 'testuser',
                SUNBIRD_YUGABYTE_PASSWORD: 'testpass',
                SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
            }
        }));

        const logger = (await import('./logger.js')).default;
        const { getSessionStore } = await import('./sessionStore.js');

        getSessionStore();

        expect(logger.error).toHaveBeenCalledWith(
            'Failed to connect to YugabyteDB pool',
            expect.any(Error)
        );
        // In test environment, process.exit should not be called
        expect(mockExit).not.toHaveBeenCalled();

        mockExit.mockRestore();
    });
});

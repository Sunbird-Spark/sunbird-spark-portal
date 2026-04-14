import { describe, it, expect, vi } from 'vitest';
import session from 'express-session';
import { registerDeviceWithKong } from './kongAuth.js';
import { setAnonymousOrg } from './anonymousOrg.js';

// Hoisted mocks for dependencies
const mocks = vi.hoisted(() => {
    return {
        sessionMiddleware: vi.fn(),
        kongMiddleware: vi.fn(),
        orgMiddleware: vi.fn(),
        sessionConfig: { name: 'mock_session_config' }
    };
});

vi.mock('express-session', () => ({
    default: vi.fn(() => mocks.sessionMiddleware)
}));

vi.mock('../config/sessionConfig.js', () => ({
    sessionConfig: mocks.sessionConfig
}));

vi.mock('./kongAuth.js', () => ({
    registerDeviceWithKong: vi.fn(() => mocks.kongMiddleware)
}));

vi.mock('./anonymousOrg.js', () => ({
    setAnonymousOrg: vi.fn(() => mocks.orgMiddleware)
}));

// Import the module under test AFTER mocks are set up
import { sessionMiddleware, anonymousMiddlewares } from './conditionalSession.js';

describe('sessionMiddleware', () => {
    it('should be created with sessionConfig', () => {
        expect(session).toHaveBeenCalledWith(mocks.sessionConfig);
        expect(sessionMiddleware).toBe(mocks.sessionMiddleware);
    });
});

describe('anonymousMiddlewares', () => {
    it('should contain the correct middleware chain', () => {
        expect(registerDeviceWithKong).toHaveBeenCalled();
        expect(setAnonymousOrg).toHaveBeenCalled();
        expect(anonymousMiddlewares).toHaveLength(2);
        expect(anonymousMiddlewares[0]).toBe(mocks.kongMiddleware);
        expect(anonymousMiddlewares[1]).toBe(mocks.orgMiddleware);
    });
});
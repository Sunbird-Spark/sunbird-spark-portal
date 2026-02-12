import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import type { Session } from 'express-session';
import type Keycloak from 'keycloak-connect';

import KeycloakConnect from 'keycloak-connect';

import { getKeycloakClient } from './keycloakManager.js';

import logger from '../utils/logger.js';
import { generateLoggedInKongToken, saveKongTokenToSession } from '../services/kongAuthService.js';
import { sessionStore } from '../utils/sessionStore.js';
import { fetchUserById, setUserSession } from '../services/userService.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';
import { regenerateSession, destroySession, saveSession } from '../utils/sessionUtils.js';

vi.mock('keycloak-connect', () => {
    const MockKeycloak = vi.fn().mockImplementation(function () {
        return {
            authenticated: undefined,
            deauthenticated: undefined
        };
    });

    return {
        default: MockKeycloak
    };
});

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../services/kongAuthService.js', () => ({
    generateLoggedInKongToken: vi.fn(),
    saveKongTokenToSession: vi.fn()
}));

vi.mock('../services/userService.js', () => ({
    fetchUserById: vi.fn(),
    setUserSession: vi.fn()
}));

vi.mock('../utils/sessionStore.js', () => ({
    sessionStore: {}
}));

vi.mock('../utils/sessionTTLUtil.js', () => ({
    setSessionTTLFromToken: vi.fn()
}));

vi.mock('../utils/sessionUtils.js', () => ({
    regenerateSession: vi.fn(),
    destroySession: vi.fn(),
    saveSession: vi.fn()
}));

describe('getKeycloakClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a keycloak instance and attach handlers', () => {
        const config = { realm: 'test', clientId: 'client' } as unknown as Keycloak.KeycloakConfig;

        const kc = getKeycloakClient(config, undefined);

        expect(KeycloakConnect).toHaveBeenCalledWith(
            { store: sessionStore },
            config
        );

        expect((kc as unknown as { authenticated: unknown }).authenticated).toBeTypeOf('function');
        expect((kc as unknown as { deauthenticated: unknown }).deauthenticated).toBeTypeOf('function');
    });

    it('should prefer provided store over default sessionStore', () => {
        const config = { realm: 'test' } as unknown as Keycloak.KeycloakConfig;
        const customStore = { foo: 'bar' };

        getKeycloakClient(config, customStore);

        expect(KeycloakConnect).toHaveBeenCalledWith(
            { store: customStore },
            config
        );
    });
});

describe('authenticated handler', () => {
    let req: Partial<Request>;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            session: {
                userId: undefined,
                save: vi.fn((cb) => cb && cb(null))
            } as unknown as Session,
            kauth: {
                grant: {
                    access_token: {
                        content: {
                            sub: 'provider:users:12345'
                        }
                    }
                }
            }
        } as unknown as Request;

        vi.mocked(regenerateSession).mockResolvedValue(undefined as any);
        vi.mocked(generateLoggedInKongToken).mockResolvedValue('test-kong-token');
        vi.mocked(saveKongTokenToSession).mockResolvedValue(undefined as any);
        vi.mocked(saveSession).mockResolvedValue(undefined as any); // Mock saveSession
        vi.mocked(fetchUserById).mockResolvedValue({
            responseCode: 'OK',
            result: { response: { id: '12345', userName: 'testuser' } }
        } as any);
        vi.mocked(setUserSession).mockResolvedValue(undefined as any);
    });

    it('should log success and save session', async () => {
        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);

        // wait for the async IIFE inside authenticated()
        await new Promise(process.nextTick);

        expect(vi.mocked(logger.info)).toHaveBeenCalledWith('in authenticated', req.kauth);
        expect(saveSession).toHaveBeenCalledWith(req);
        expect(vi.mocked(logger.info)).toHaveBeenCalledWith('Keycloak authenticated successfully - Session saved');

        // Confirm removed logic is NOT called
        expect(regenerateSession).not.toHaveBeenCalled();
        expect(fetchUserById).not.toHaveBeenCalled();
        expect(setUserSession).not.toHaveBeenCalled();
    });

    it('should log error if saving session fails', async () => {
        vi.mocked(saveSession).mockRejectedValue(new Error('save failed'));

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );
    });
});

describe('deauthenticated handler', () => {
    it('should destroy the session on deauthentication', async () => {
        const req = {
            session: {
                roles: ['admin'],
                userId: '123'
            }
        } as unknown as Request;

        vi.mocked(destroySession).mockResolvedValue(undefined as any);

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        await (kc as any).deauthenticated(req);

        expect(destroySession).toHaveBeenCalledWith(req);
    });

    it('should handle destroySession errors gracefully', async () => {
        const req = {} as unknown as Request;

        vi.mocked(destroySession).mockRejectedValue(new Error('destroy failed'));

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        await (kc as any).deauthenticated(req);

        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'Error destroying session during deauthentication',
            expect.any(Error)
        );
    });
});
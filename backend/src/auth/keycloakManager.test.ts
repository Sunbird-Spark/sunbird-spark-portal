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
import { regenerateSession, destroySession } from '../utils/sessionUtils.js';

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
    destroySession: vi.fn()
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
                userId: undefined
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
        vi.mocked(fetchUserById).mockResolvedValue({
            responseCode: 'OK',
            result: { response: { id: '12345', userName: 'testuser' } }
        } as any);
        vi.mocked(setUserSession).mockImplementation(() => {});
    });

    it('should regenerate session, extract userId, generate kong token and fetch user', async () => {
        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);

        // wait for the async IIFE inside authenticated()
        await new Promise(process.nextTick);

        expect(regenerateSession).toHaveBeenCalledWith(req);
        expect(setSessionTTLFromToken).toHaveBeenCalledWith(req);
        expect((req.session as any)?.userId).toBe('12345');
        expect(generateLoggedInKongToken).toHaveBeenCalledWith(req);
        expect(saveKongTokenToSession).toHaveBeenCalledWith(req, 'test-kong-token');
        expect(fetchUserById).toHaveBeenCalledWith('12345', req);
        expect(setUserSession).toHaveBeenCalledWith(req, expect.any(Object));
        expect(vi.mocked(logger.info)).toHaveBeenCalledWith('Keycloak authenticated successfully');
        expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });

    it('should handle missing sub gracefully', async () => {
        (req as any).kauth = {};

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect((req.session as any)?.userId).toBeUndefined();
        expect(generateLoggedInKongToken).toHaveBeenCalledWith(req);
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );
    });

    it('should log error if regenerateSession fails', async () => {
        vi.mocked(regenerateSession).mockRejectedValue(new Error('regen failed'));

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );

        expect(generateLoggedInKongToken).not.toHaveBeenCalled();
        expect(fetchUserById).not.toHaveBeenCalled();
    });

    it('should log error if generateLoggedInKongToken fails', async () => {
        vi.mocked(generateLoggedInKongToken).mockRejectedValue(
            new Error('kong failure')
        );

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );

        expect(fetchUserById).not.toHaveBeenCalled();
    });

    it('should log error if fetchUserById fails', async () => {
        vi.mocked(fetchUserById).mockRejectedValue(
            new Error('user service failure')
        );

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(generateLoggedInKongToken).toHaveBeenCalled();
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );
    });

    it('should handle missing userId after extraction', async () => {
        (req as any).kauth = {
            grant: {
                access_token: {
                    content: {
                        sub: ''  // Empty sub will result in empty userId
                    }
                }
            }
        };

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as any).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.objectContaining({
                message: 'userId missing from session'
            })
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
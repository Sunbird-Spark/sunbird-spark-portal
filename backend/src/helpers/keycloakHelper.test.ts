// getKeycloakClient.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import type { Session } from 'express-session';
import type Keycloak from 'keycloak-connect';

import KeycloakConnect from 'keycloak-connect';

import { getKeycloakClient } from '../helpers/keycloakHelper.js';

import logger from '../utils/logger.js';
import { generateLoggedInKongToken } from '../services/kongAuthService.js';
import { sessionStore } from '../utils/sessionStore.js';
import { getCurrentUser } from '../services/userService.js';

vi.mock('keycloak-connect', () => {
    const MockKeycloak = vi.fn().mockImplementation(function (_opts: unknown, _config: unknown) {
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
    generateLoggedInKongToken: vi.fn()
}));

vi.mock('../services/userService.js', () => ({
    getCurrentUser: vi.fn()
}));

vi.mock('../utils/sessionStore.js', () => ({
    sessionStore: {}
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
                regenerate: vi.fn().mockImplementation((cb: (err?: Error) => void) => {
                    cb();
                })
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

        vi.mocked(generateLoggedInKongToken).mockResolvedValue(undefined as any);
        vi.mocked(getCurrentUser).mockResolvedValue(undefined as any);
    });

    it('should regenerate session, extract userId, generate kong token and fetch user', async () => {
        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as unknown as { authenticated: (r: Request) => void }).authenticated(req as Request);

        // wait for the async IIFE inside authenticated()
        await new Promise(process.nextTick);

        expect((req.session as any)?.userId).toBe('12345');
        expect(generateLoggedInKongToken).toHaveBeenCalledWith(req);
        expect(getCurrentUser).toHaveBeenCalledWith(req);
        expect(vi.mocked(logger.info)).toHaveBeenCalledWith('Keycloak authenticated successfully');
        expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });

    it('should handle missing sub gracefully', async () => {
        (req as any).kauth = {};

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as unknown as { authenticated: (r: Request) => void }).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect((req.session as any)?.userId).toBeUndefined();
        expect(generateLoggedInKongToken).toHaveBeenCalledWith(req);
        expect(getCurrentUser).toHaveBeenCalledWith(req);
        expect(vi.mocked(logger.info)).toHaveBeenCalled();
    });

    it('should log error if session regeneration fails', async () => {
        (req.session?.regenerate as ReturnType<typeof vi.fn>).mockImplementation((cb: (err?: Error) => void) => {
            cb(new Error('regen failed'));
        });

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as unknown as { authenticated: (r: Request) => void }).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );

        expect(generateLoggedInKongToken).not.toHaveBeenCalled();
        expect(getCurrentUser).not.toHaveBeenCalled();
    });

    it('should log error if generateLoggedInKongToken fails', async () => {
        vi.mocked(generateLoggedInKongToken).mockRejectedValue(
            new Error('kong failure')
        );

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as unknown as { authenticated: (r: Request) => void }).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );

        expect(getCurrentUser).not.toHaveBeenCalled();
    });

    it('should log error if getCurrentUser fails', async () => {
        vi.mocked(getCurrentUser).mockRejectedValue(
            new Error('user service failure')
        );

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as unknown as { authenticated: (r: Request) => void }).authenticated(req as Request);
        await new Promise(process.nextTick);

        expect(generateLoggedInKongToken).toHaveBeenCalled();
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'error logging in user',
            expect.any(Error)
        );
    });
});

describe('deauthenticated handler', () => {
    it('should delete roles and userId from session', () => {
        const req = {
            session: {
                regenerate: vi.fn().mockImplementation((cb: (err?: Error) => void) => {
                    cb();
                }),
                roles: ['admin'],
                userId: '123'
            }
        } as unknown as Request;

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        (kc as unknown as { deauthenticated: (r: Request) => void }).deauthenticated(req);

        expect((req.session as any).roles).toBeUndefined();
        expect((req.session as any).userId).toBeUndefined();
    });

    it('should not throw if session properties do not exist', () => {
        const req = {
            session: {
                regenerate: vi.fn().mockImplementation((cb: (err?: Error) => void) => {
                    cb();
                })
            }
        } as unknown as Request;

        const kc = getKeycloakClient({} as Keycloak.KeycloakConfig, undefined);

        expect(() =>
            (kc as unknown as { deauthenticated: (r: Request) => void }).deauthenticated(req)
        ).not.toThrow();
    });
});
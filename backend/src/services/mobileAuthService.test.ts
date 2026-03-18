import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request } from 'express';

const { mockAxiosPost, mockAxiosGet, mockVerifyIdToken } = vi.hoisted(() => ({
    mockAxiosPost: vi.fn(),
    mockAxiosGet: vi.fn(),
    mockVerifyIdToken: vi.fn(),
}));

vi.mock('axios', () => ({
    default: {
        post: mockAxiosPost,
        get: mockAxiosGet,
    },
}));

vi.mock('google-auth-library', () => ({
    OAuth2Client: class {
        verifyIdToken = mockVerifyIdToken;
    },
}));

vi.mock('../auth/oidcProvider.js', () => ({
    issuerUrl: 'https://keycloak.example.com/auth/realms/test',
}));

vi.mock('../utils/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        KEYCLOAK_ANDROID_CLIENT_ID: 'android-client',
        KEYCLOAK_ANDROID_CLIENT_SECRET: '',
        KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID: 'google-android-client',
        KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET: 'google-android-secret',
        GOOGLE_OAUTH_CLIENT_ID: 'google-client-id',
        GOOGLE_OAUTH_CLIENT_ID_IOS: 'google-ios-client-id',
        KONG_URL: 'https://kong.example.com',
        KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'device-token',
        KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-token',
        PORTAL_ECHO_API_URL: 'https://echo.example.com/',
    },
}));

import {
    keycloakNativeLogin,
    verifyGoogleIdToken,
    checkMobileUserExists,
    createMobileUser,
    findOrCreateGoogleUser,
    createKeycloakGoogleAndroidSession,
    verifyEchoAuthToken,
    refreshMobileToken,
    getMobileClients,
    mapKeycloakRopcError,
} from './mobileAuthService.js';

const makeReq = (overrides: Partial<Request> = {}): Request =>
    ({
        get: vi.fn((header: string) => {
            if (header === 'authorization') return 'Bearer test-token';
            if (header === 'x-device-id') return 'device-123';
            return undefined;
        }),
        session: {},
        ...overrides,
    } as unknown as Request);

describe('mobileAuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    describe('mapKeycloakRopcError', () => {
        it('maps invalid_grant + disabled to USER_ACCOUNT_BLOCKED', () => {
            const result = mapKeycloakRopcError({
                error: 'invalid_grant',
                error_description: 'User is disabled',
            });
            expect(result.error).toBe('USER_ACCOUNT_BLOCKED');
            expect(result.statusCode).toBe(401);
        });

        it('maps invalid_grant + other description to INVALID_CREDENTIALS', () => {
            const result = mapKeycloakRopcError({
                error: 'invalid_grant',
                error_description: 'Invalid user credentials',
            });
            expect(result.error).toBe('INVALID_CREDENTIALS');
            expect(result.statusCode).toBe(401);
        });

        it('passes through other errors', () => {
            const result = mapKeycloakRopcError({
                error: 'unauthorized_client',
                error_description: 'Client not allowed',
            });
            expect(result.error).toBe('unauthorized_client');
            expect(result.statusCode).toBe(400);
        });
    });

    // -------------------------------------------------------------------------
    describe('getMobileClients', () => {
        it('returns the configured mobile clients', () => {
            const clients = getMobileClients();
            expect(clients['android-client']).toBeDefined();
            expect(clients['android-client'].client_secret).toBeUndefined();
            expect(clients['google-android-client']).toBeDefined();
            expect(clients['google-android-client'].client_secret).toBe('google-android-secret');
        });
    });

    // -------------------------------------------------------------------------
    describe('keycloakNativeLogin', () => {
        it('returns tokens on success and always sends client_secret', async () => {
            mockAxiosPost.mockResolvedValue({
                data: {
                    access_token: 'acc',
                    refresh_token: 'ref',
                    id_token: 'id',
                },
            });

            const result = await keycloakNativeLogin('user@example.com', 'password');
            expect(result.access_token).toBe('acc');
            expect(result.refresh_token).toBe('ref');

            const [url, body] = mockAxiosPost.mock.calls[0];
            expect(url).toContain('/openid-connect/token');
            expect(body).toContain('grant_type=password');
            expect(body).toContain('username=user%40example.com');
            // client_secret is always sent since Android client is confidential
            expect(body).toContain('client_secret=');
        });

        it('throws mapped error on Keycloak failure', async () => {
            mockAxiosPost.mockRejectedValue({
                response: {
                    status: 401,
                    data: { error: 'invalid_grant', error_description: 'Invalid user credentials' },
                },
            });

            await expect(keycloakNativeLogin('user@example.com', 'wrong')).rejects.toMatchObject({
                error: 'INVALID_CREDENTIALS',
                statusCode: 401,
            });
        });

        it('throws USER_ACCOUNT_BLOCKED for disabled accounts', async () => {
            mockAxiosPost.mockRejectedValue({
                response: {
                    status: 401,
                    data: { error: 'invalid_grant', error_description: 'User is disabled' },
                },
            });

            await expect(keycloakNativeLogin('user@example.com', 'pass')).rejects.toMatchObject({
                error: 'USER_ACCOUNT_BLOCKED',
            });
        });
    });

    // -------------------------------------------------------------------------
    describe('verifyGoogleIdToken', () => {
        it('returns email, name, sub from valid token', async () => {
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({
                    email: 'user@example.com',
                    name: 'Test User',
                    sub: 'google-sub-123',
                }),
            });

            const result = await verifyGoogleIdToken('id-token', 'client-id');
            expect(result.email).toBe('user@example.com');
            expect(result.name).toBe('Test User');
            expect(result.sub).toBe('google-sub-123');
        });

        it('throws GOOGLE_TOKEN_PAYLOAD_INVALID when payload is missing email', async () => {
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({ sub: 'abc' }),
            });

            await expect(verifyGoogleIdToken('bad-token', 'client-id')).rejects.toThrow(
                'GOOGLE_TOKEN_PAYLOAD_INVALID'
            );
        });
    });

    // -------------------------------------------------------------------------
    describe('checkMobileUserExists', () => {
        it('returns true when user exists', async () => {
            mockAxiosGet.mockResolvedValue({
                data: { responseCode: 'OK', result: { exists: true } },
            });

            const result = await checkMobileUserExists('user@example.com', makeReq());
            expect(result).toBe(true);
        });

        it('returns false when user does not exist', async () => {
            mockAxiosGet.mockResolvedValue({
                data: { responseCode: 'OK', result: { exists: false } },
            });

            const result = await checkMobileUserExists('new@example.com', makeReq());
            expect(result).toBe(false);
        });

        it('throws when responseCode is not OK', async () => {
            mockAxiosGet.mockResolvedValue({
                data: {
                    responseCode: 'ERROR',
                    params: { errmsg: 'Something went wrong' },
                },
            });

            await expect(checkMobileUserExists('user@example.com', makeReq())).rejects.toThrow(
                'Something went wrong'
            );
        });

        it('uses Authorization header from request as Kong token', async () => {
            mockAxiosGet.mockResolvedValue({
                data: { responseCode: 'OK', result: { exists: true } },
            });

            const req = makeReq();
            await checkMobileUserExists('user@example.com', req);

            const [, config] = mockAxiosGet.mock.calls[0];
            expect(config.headers.Authorization).toBe('Bearer test-token');
        });

        it('falls back to device register token when no auth header', async () => {
            mockAxiosGet.mockResolvedValue({
                data: { responseCode: 'OK', result: { exists: false } },
            });

            const req = makeReq({ get: vi.fn().mockReturnValue(undefined) } as any);
            await checkMobileUserExists('user@example.com', req);

            const [, config] = mockAxiosGet.mock.calls[0];
            expect(config.headers.Authorization).toBe('Bearer device-token');
        });
    });

    // -------------------------------------------------------------------------
    describe('createMobileUser', () => {
        it('throws USER_NAME_NOT_PRESENT when name is missing', async () => {
            await expect(
                createMobileUser({ emailId: 'user@example.com' }, 'android', makeReq())
            ).rejects.toThrow('USER_NAME_NOT_PRESENT');
        });

        it('creates the user successfully', async () => {
            mockAxiosPost.mockResolvedValue({
                data: { responseCode: 'OK' },
            });

            await expect(
                createMobileUser({ emailId: 'user@example.com', name: 'Test User' }, 'android', makeReq())
            ).resolves.not.toThrow();

            const [url, body] = mockAxiosPost.mock.calls[0];
            expect(url).toContain('/user/v2/signup');
            expect(body.request.firstName).toBe('Test User');
            expect(body.params.signupType).toBe('google');
        });

        it('throws when API returns non-OK response', async () => {
            mockAxiosPost.mockResolvedValue({
                data: {
                    responseCode: 'ERROR',
                    params: { errmsg: 'Duplicate email' },
                },
            });

            await expect(
                createMobileUser({ emailId: 'user@example.com', name: 'Test User' }, 'android', makeReq())
            ).rejects.toThrow('Duplicate email');
        });
    });

    // -------------------------------------------------------------------------
    describe('findOrCreateGoogleUser', () => {
        it('does not create user when they already exist', async () => {
            mockAxiosGet.mockResolvedValue({
                data: { responseCode: 'OK', result: { exists: true } },
            });

            await findOrCreateGoogleUser({ emailId: 'user@example.com', name: 'Test' }, 'android', makeReq());
            expect(mockAxiosPost).not.toHaveBeenCalled();
        });

        it('creates user and waits when they do not exist', async () => {
            vi.useFakeTimers();
            mockAxiosGet.mockResolvedValue({
                data: { responseCode: 'OK', result: { exists: false } },
            });
            mockAxiosPost.mockResolvedValue({ data: { responseCode: 'OK' } });

            const promise = findOrCreateGoogleUser(
                { emailId: 'new@example.com', name: 'New User' },
                'android',
                makeReq()
            );
            await vi.runAllTimersAsync();
            await promise;

            expect(mockAxiosPost).toHaveBeenCalledOnce();
            vi.useRealTimers();
        });
    });

    // -------------------------------------------------------------------------
    describe('createKeycloakGoogleAndroidSession', () => {
        it('returns tokens on success with offline_access scope', async () => {
            mockAxiosPost.mockResolvedValue({
                data: { access_token: 'acc', refresh_token: 'ref' },
            });

            const result = await createKeycloakGoogleAndroidSession('user@example.com');
            expect(result.access_token).toBe('acc');

            const [, body] = mockAxiosPost.mock.calls[0];
            expect(body).toContain('scope=offline_access');
            expect(body).toContain('client_id=google-android-client');
        });

        it('throws mapped error on Keycloak failure', async () => {
            mockAxiosPost.mockRejectedValue({
                response: {
                    status: 401,
                    data: { error: 'invalid_grant', error_description: 'User is disabled' },
                },
            });

            await expect(createKeycloakGoogleAndroidSession('user@example.com')).rejects.toMatchObject({
                error: 'USER_ACCOUNT_BLOCKED',
            });
        });
    });

    // -------------------------------------------------------------------------
    describe('verifyEchoAuthToken', () => {
        it('calls the echo API with the authorization header', async () => {
            mockAxiosGet.mockResolvedValue({ status: 200 });

            await verifyEchoAuthToken('Bearer some-token');
            const [url, config] = mockAxiosGet.mock.calls[0];
            expect(url).toBe('https://echo.example.com/test');
            expect(config.headers.authorization).toBe('Bearer some-token');
        });

        it('throws when echo API returns an error', async () => {
            mockAxiosGet.mockRejectedValue(new Error('Network error'));
            await expect(verifyEchoAuthToken('Bearer bad-token')).rejects.toThrow();
        });
    });

    // -------------------------------------------------------------------------
    describe('refreshMobileToken', () => {
        it('calls token endpoint with refresh_token grant', async () => {
            mockAxiosPost.mockResolvedValue({
                data: { access_token: 'new-acc', refresh_token: 'new-ref' },
            });

            const result = await refreshMobileToken(
                { client_id: 'android-client' },
                'old-refresh-token'
            );

            expect(result).toMatchObject({ access_token: 'new-acc' });
            const [, body] = mockAxiosPost.mock.calls[0];
            expect(body).toContain('grant_type=refresh_token');
            expect(body).toContain('client_id=android-client');
            expect(body).not.toContain('client_secret');
        });

        it('includes client_secret for confidential clients', async () => {
            mockAxiosPost.mockResolvedValue({ data: { access_token: 'acc' } });

            await refreshMobileToken(
                { client_id: 'google-android-client', client_secret: 'secret' },
                'ref-token'
            );

            const [, body] = mockAxiosPost.mock.calls[0];
            expect(body).toContain('client_secret=secret');
        });

        it('throws structured error on failure', async () => {
            mockAxiosPost.mockRejectedValue({
                response: {
                    status: 400,
                    data: { error: 'invalid_token', error_description: 'Token expired' },
                },
            });

            await expect(
                refreshMobileToken({ client_id: 'android-client' }, 'expired-token')
            ).rejects.toMatchObject({ error: 'invalid_token', statusCode: 400 });
        });
    });
});

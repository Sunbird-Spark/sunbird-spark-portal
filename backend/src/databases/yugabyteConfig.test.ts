import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import tls from 'node:tls';

const { mockReadFileSync } = vi.hoisted(() => ({ mockReadFileSync: vi.fn() }));

vi.mock('node:fs', () => ({
    default: { readFileSync: mockReadFileSync }
}));

const baseEnv = {
    SUNBIRD_YUGABYTE_HOST: 'abc.ap-south-1.aws.yugabyte.cloud',
    SUNBIRD_YUGABYTE_PORT: 5433,
    SUNBIRD_YUGABYTE_YCQL_PORT: 9042,
    SUNBIRD_YUGABYTE_DATABASE: 'portal',
    SUNBIRD_YUGABYTE_USER: 'admin',
    SUNBIRD_YUGABYTE_PASSWORD: 'secret',
    SUNBIRD_YUGABYTE_SSL_MODE: 'disable',
    SUNBIRD_YUGABYTE_SSL_ROOT_CERT_PATH: '',
    SUNBIRD_YUGABYTE_SSL_ROOT_CERT: '',
    SUNBIRD_YUGABYTE_YCQL_LOCAL_DATACENTER: 'datacenter1',
    SUNBIRD_YUGABYTE_YSQL_POOL_MAX: 10,
    SUNBIRD_YUGABYTE_CONNECT_TIMEOUT_MS: 10000,
};

const loadModule = async (overrides: Partial<Record<keyof typeof baseEnv, string | number>> = {}) => {
    vi.doMock('../config/env.js', () => ({ envConfig: { ...baseEnv, ...overrides } }));
    return import('./yugabyteConfig.js');
};

describe('yugabyteConfig', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.doUnmock('../config/env.js');
    });

    describe('getYsqlPoolConfig', () => {
        it('builds a plain connection config when SSL is disabled', async () => {
            const { getYsqlPoolConfig } = await loadModule();

            const config = getYsqlPoolConfig();

            expect(config).toMatchObject({
                host: 'abc.ap-south-1.aws.yugabyte.cloud',
                port: 5433,
                database: 'portal',
                user: 'admin',
                password: 'secret',
                max: 10,
                connectionTimeoutMillis: 10000,
                keepAlive: true,
            });
            expect(config.ssl).toBeUndefined();
        });

        it('applies overrides', async () => {
            const { getYsqlPoolConfig } = await loadModule();

            expect(getYsqlPoolConfig({ max: 1 }).max).toBe(1);
        });

        it('uses the first host when a comma-separated list is configured', async () => {
            const { getYsqlPoolConfig } = await loadModule({ SUNBIRD_YUGABYTE_HOST: ' host-a , host-b ' });

            expect(getYsqlPoolConfig().host).toBe('host-a');
        });

        it('enables TLS without verification in require mode', async () => {
            const { getYsqlPoolConfig } = await loadModule({ SUNBIRD_YUGABYTE_SSL_MODE: 'require' });

            expect(getYsqlPoolConfig().ssl).toEqual({ rejectUnauthorized: false });
        });

        it('verifies against the CA read from file in verify-full mode', async () => {
            mockReadFileSync.mockReturnValue('FILE_CA');
            const { getYsqlPoolConfig } = await loadModule({
                SUNBIRD_YUGABYTE_SSL_MODE: 'verify-full',
                SUNBIRD_YUGABYTE_SSL_ROOT_CERT_PATH: '/etc/yugabyte/certs/root.crt',
                SUNBIRD_YUGABYTE_SSL_ROOT_CERT: 'INLINE_CA',
            });

            expect(getYsqlPoolConfig().ssl).toEqual({ ca: 'FILE_CA', rejectUnauthorized: true });
            expect(mockReadFileSync).toHaveBeenCalledWith('/etc/yugabyte/certs/root.crt', 'utf8');
        });

        it('uses the inline CA when no cert path is set', async () => {
            const { getYsqlPoolConfig } = await loadModule({
                SUNBIRD_YUGABYTE_SSL_MODE: 'VERIFY-FULL',
                SUNBIRD_YUGABYTE_SSL_ROOT_CERT: 'INLINE_CA',
            });

            expect(getYsqlPoolConfig().ssl).toEqual({ ca: 'INLINE_CA', rejectUnauthorized: true });
            expect(mockReadFileSync).not.toHaveBeenCalled();
        });

        it('verifies the CA but skips the hostname check in verify-ca mode', async () => {
            const { getYsqlPoolConfig } = await loadModule({
                SUNBIRD_YUGABYTE_SSL_MODE: 'verify-ca',
                SUNBIRD_YUGABYTE_SSL_ROOT_CERT: 'INLINE_CA',
            });

            const ssl = getYsqlPoolConfig().ssl;

            expect(ssl).toMatchObject({ ca: 'INLINE_CA', rejectUnauthorized: true });
            const checkServerIdentity = typeof ssl === 'object' ? ssl.checkServerIdentity : undefined;
            expect(checkServerIdentity?.('other-host', {} as tls.PeerCertificate)).toBeUndefined();
        });

        it('throws when verify-ca is set without a root certificate', async () => {
            const { getYsqlPoolConfig } = await loadModule({ SUNBIRD_YUGABYTE_SSL_MODE: 'verify-ca' });

            expect(() => getYsqlPoolConfig()).toThrow(/verify-ca but no root certificate is configured/);
        });

        it('throws when verify-full is set without a root certificate', async () => {
            const { getYsqlPoolConfig } = await loadModule({ SUNBIRD_YUGABYTE_SSL_MODE: 'verify-full' });

            expect(() => getYsqlPoolConfig()).toThrow(/no root certificate is configured/);
        });

        it('throws on an unknown SSL mode', async () => {
            const { getYsqlPoolConfig } = await loadModule({ SUNBIRD_YUGABYTE_SSL_MODE: 'prefer' });

            expect(() => getYsqlPoolConfig()).toThrow(/Invalid SUNBIRD_YUGABYTE_SSL_MODE "prefer"/);
        });
    });

    describe('getYcqlClientOptions', () => {
        it('builds client options without TLS by default', async () => {
            const { getYcqlClientOptions } = await loadModule();

            const options = getYcqlClientOptions('forms');

            expect(options).toEqual({
                contactPoints: ['abc.ap-south-1.aws.yugabyte.cloud'],
                localDataCenter: 'datacenter1',
                keyspace: 'forms',
                protocolOptions: { port: 9042 },
                credentials: { username: 'admin', password: 'secret' },
                socketOptions: { connectTimeout: 10000 },
            });
        });

        it('uses all configured hosts as contact points and the configured data center', async () => {
            const { getYcqlClientOptions } = await loadModule({
                SUNBIRD_YUGABYTE_HOST: 'host-a,host-b,',
                SUNBIRD_YUGABYTE_YCQL_LOCAL_DATACENTER: 'ap-south-1',
            });

            const options = getYcqlClientOptions('forms');

            expect(options.contactPoints).toEqual(['host-a', 'host-b']);
            expect(options.localDataCenter).toBe('ap-south-1');
        });

        it('enables TLS without verification in require mode', async () => {
            const { getYcqlClientOptions } = await loadModule({ SUNBIRD_YUGABYTE_SSL_MODE: 'require' });

            expect(getYcqlClientOptions('forms').sslOptions).toEqual({ rejectUnauthorized: false });
        });

        it('verifies the certificate against the configured host in verify-full mode', async () => {
            const { getYcqlClientOptions } = await loadModule({
                SUNBIRD_YUGABYTE_SSL_MODE: 'verify-full',
                SUNBIRD_YUGABYTE_SSL_ROOT_CERT: 'INLINE_CA',
            });
            const identitySpy = vi.spyOn(tls, 'checkServerIdentity').mockReturnValue(undefined);

            const sslOptions = getYcqlClientOptions('forms').sslOptions;

            expect(sslOptions).toMatchObject({
                ca: ['INLINE_CA'],
                rejectUnauthorized: true,
                servername: 'abc.ap-south-1.aws.yugabyte.cloud',
            });

            const cert = {} as tls.PeerCertificate;
            sslOptions?.checkServerIdentity?.('10.0.0.5', cert);
            expect(identitySpy).toHaveBeenCalledWith('abc.ap-south-1.aws.yugabyte.cloud', cert);

            identitySpy.mockRestore();
        });

        it('verifies the CA but skips the hostname check in verify-ca mode', async () => {
            const { getYcqlClientOptions } = await loadModule({
                SUNBIRD_YUGABYTE_SSL_MODE: 'verify-ca',
                SUNBIRD_YUGABYTE_SSL_ROOT_CERT: 'INLINE_CA',
            });
            const identitySpy = vi.spyOn(tls, 'checkServerIdentity');

            const sslOptions = getYcqlClientOptions('forms').sslOptions;

            expect(sslOptions).toMatchObject({ ca: ['INLINE_CA'], rejectUnauthorized: true });
            expect(sslOptions?.servername).toBeUndefined();
            expect(sslOptions?.checkServerIdentity?.('10.0.0.5', {} as tls.PeerCertificate)).toBeUndefined();
            expect(identitySpy).not.toHaveBeenCalled();

            identitySpy.mockRestore();
        });

        it('throws when verify-full is set without a root certificate', async () => {
            const { getYcqlClientOptions } = await loadModule({ SUNBIRD_YUGABYTE_SSL_MODE: 'verify-full' });

            expect(() => getYcqlClientOptions('forms')).toThrow(/no root certificate is configured/);
        });
    });
});

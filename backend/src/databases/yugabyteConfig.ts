import fs from 'node:fs';
import tls from 'node:tls';
import type { PoolConfig } from 'pg';
import type cassandra from 'cassandra-driver';
import { envConfig } from '../config/env.js';

/**
 * Shared YugabyteDB connection settings for YSQL (pg) and YCQL (cassandra-driver).
 * Supports both self-hosted clusters (plain TCP) and managed clusters such as
 * YugabyteDB Aeon, which require TLS and a region-named YCQL data center.
 */

export type YugabyteSslMode = 'disable' | 'require' | 'verify-ca' | 'verify-full';

const SSL_MODES: readonly YugabyteSslMode[] = ['disable', 'require', 'verify-ca', 'verify-full'];

// verify-ca: trust the CA chain and validity dates but skip the hostname check
// (same as libpq verify-ca and lern-service's YCQL TLS).
const skipHostnameCheck = (): undefined => undefined;

export const getYugabyteSslMode = (): YugabyteSslMode => {
    const mode = envConfig.SUNBIRD_YUGABYTE_SSL_MODE.trim().toLowerCase();
    if (!SSL_MODES.includes(mode as YugabyteSslMode)) {
        throw new Error(
            `Invalid SUNBIRD_YUGABYTE_SSL_MODE "${envConfig.SUNBIRD_YUGABYTE_SSL_MODE}". Expected one of: ${SSL_MODES.join(', ')}`
        );
    }
    return mode as YugabyteSslMode;
};

/** Comma-separated SUNBIRD_YUGABYTE_HOST parsed into a list of hosts. */
export const getYugabyteHosts = (): string[] =>
    envConfig.SUNBIRD_YUGABYTE_HOST.split(',').map((h) => h.trim()).filter(Boolean);

/**
 * Root CA used to verify the cluster certificate. A file path (e.g. a mounted
 * Kubernetes Secret) takes precedence over inline PEM content.
 */
export const getYugabyteSslCa = (): string | undefined => {
    if (envConfig.SUNBIRD_YUGABYTE_SSL_ROOT_CERT_PATH) {
        return fs.readFileSync(envConfig.SUNBIRD_YUGABYTE_SSL_ROOT_CERT_PATH, 'utf8');
    }
    return envConfig.SUNBIRD_YUGABYTE_SSL_ROOT_CERT || undefined;
};

const requireSslCa = (mode: YugabyteSslMode): string => {
    const ca = getYugabyteSslCa();
    if (!ca) {
        throw new Error(
            `SUNBIRD_YUGABYTE_SSL_MODE is ${mode} but no root certificate is configured. ` +
            'Set SUNBIRD_YUGABYTE_SSL_ROOT_CERT_PATH or SUNBIRD_YUGABYTE_SSL_ROOT_CERT.'
        );
    }
    return ca;
};

const getYsqlSsl = (): PoolConfig['ssl'] => {
    const mode = getYugabyteSslMode();
    if (mode === 'disable') return undefined;
    if (mode === 'require') return { rejectUnauthorized: false };
    const ca = requireSslCa(mode);
    if (mode === 'verify-ca') return { ca, rejectUnauthorized: true, checkServerIdentity: skipHostnameCheck };
    return { ca, rejectUnauthorized: true };
};

export const getYsqlPoolConfig = (overrides: PoolConfig = {}): PoolConfig => {
    const ssl = getYsqlSsl();
    return {
        host: getYugabyteHosts()[0] ?? '',
        port: envConfig.SUNBIRD_YUGABYTE_PORT,
        database: envConfig.SUNBIRD_YUGABYTE_DATABASE,
        user: envConfig.SUNBIRD_YUGABYTE_USER,
        password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
        max: envConfig.SUNBIRD_YUGABYTE_YSQL_POOL_MAX,
        connectionTimeoutMillis: envConfig.SUNBIRD_YUGABYTE_CONNECT_TIMEOUT_MS,
        idleTimeoutMillis: 30000,
        // Keep connections alive across cloud load balancers / NAT gateways
        keepAlive: true,
        ...(ssl ? { ssl } : {}),
        ...overrides,
    };
};

const getYcqlSslOptions = (): tls.ConnectionOptions | undefined => {
    const mode = getYugabyteSslMode();
    if (mode === 'disable') return undefined;
    if (mode === 'require') return { rejectUnauthorized: false };

    const ca = requireSslCa(mode);
    if (mode === 'verify-ca') return { ca: [ca], rejectUnauthorized: true, checkServerIdentity: skipHostnameCheck };

    const host = getYugabyteHosts()[0] ?? '';
    return {
        ca: [ca],
        rejectUnauthorized: true,
        servername: host,
        // The driver connects to discovered peers by IP, so verify the certificate
        // against the configured cluster hostname rather than the peer IP.
        checkServerIdentity: (_hostname: string, cert: tls.PeerCertificate) =>
            tls.checkServerIdentity(host, cert),
    };
};

export const getYcqlClientOptions = (keyspace: string): cassandra.ClientOptions => {
    const sslOptions = getYcqlSslOptions();
    return {
        contactPoints: getYugabyteHosts(),
        localDataCenter: envConfig.SUNBIRD_YUGABYTE_YCQL_LOCAL_DATACENTER,
        keyspace,
        protocolOptions: { port: envConfig.SUNBIRD_YUGABYTE_YCQL_PORT },
        credentials: {
            username: envConfig.SUNBIRD_YUGABYTE_USER,
            password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
        },
        socketOptions: { connectTimeout: envConfig.SUNBIRD_YUGABYTE_CONNECT_TIMEOUT_MS },
        ...(sslOptions ? { sslOptions } : {}),
    };
};

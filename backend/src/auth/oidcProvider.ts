import * as client from 'openid-client';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';

// OIDC Issuer URL - defaults to Keycloak-style URL for backward compatibility
const issuerUrl = envConfig.OIDC_ISSUER_URL ||
    `${envConfig.DOMAIN_URL}/auth/realms/${envConfig.PORTAL_REALM}`;

// Cached OIDC configurations (lazy-initialized on first use, expires after TTL)
const CONFIG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let portalConfig: client.Configuration | null = null;
let portalConfigTimestamp = 0;
let googleConfig: client.Configuration | null = null;
let googleConfigTimestamp = 0;

/**
 * Get the OIDC configuration for the portal (public client, authorization code flow).
 * Uses OIDC Discovery to automatically resolve endpoints.
 */
export async function getPortalOIDCConfig(): Promise<client.Configuration> {
    const now = Date.now();
    if (!portalConfig || (now - portalConfigTimestamp) > CONFIG_CACHE_TTL_MS) {
        portalConfig = await client.discovery(
            new URL(issuerUrl),
            envConfig.PORTAL_AUTH_SERVER_CLIENT
        );
        portalConfigTimestamp = now;
        logger.info('OIDC discovery completed for portal client');
    }
    return portalConfig;
}

/**
 * Get the OIDC configuration for the Google auth service account (confidential client).
 * Used for client credentials grant.
 */
export async function getGoogleOIDCConfig(): Promise<client.Configuration> {
    const now = Date.now();
    if (!googleConfig || (now - googleConfigTimestamp) > CONFIG_CACHE_TTL_MS) {
        googleConfig = await client.discovery(
            new URL(issuerUrl),
            envConfig.KEYCLOAK_GOOGLE_CLIENT_ID,
            envConfig.KEYCLOAK_GOOGLE_CLIENT_SECRET
        );
        googleConfigTimestamp = now;
        logger.info('OIDC discovery completed for Google auth client');
    }
    return googleConfig;
}

/**
 * Decode a JWT payload without signature verification.
 * Used to read claims from access/refresh tokens for session management.
 *
 * SECURITY NOTE: This is safe because the tokens are obtained directly from
 * the OIDC provider over TLS (via authorizationCodeGrant / refreshTokenGrant /
 * clientCredentialsGrant) and stored server-side in the session. They never
 * come from the browser. Signature verification is performed by the OIDC
 * provider during token exchange. We only decode here to read expiry/subject
 * claims for session TTL management and user identification.
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payloadSegment = parts[1];
        if (!payloadSegment) return null;

        const payload = Buffer.from(payloadSegment, 'base64url').toString('utf8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

export { client };
export { issuerUrl };

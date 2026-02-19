import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decodeJwtPayload } from './oidcProvider.js';

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        DOMAIN_URL: 'http://localhost:8080',
        PORTAL_REALM: 'sunbird',
        PORTAL_AUTH_SERVER_CLIENT: 'portal',
        KEYCLOAK_GOOGLE_CLIENT_ID: 'google-client',
        KEYCLOAK_GOOGLE_CLIENT_SECRET: 'google-secret',
        OIDC_ISSUER_URL: ''
    }
}));

describe('oidcProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('decodeJwtPayload', () => {
        it('should decode a valid JWT payload', () => {
            // Create a test JWT with header.payload.signature
            const payload = { sub: 'user123', exp: 1737400000, email: 'test@example.com' };
            const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
            const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const token = `${header}.${body}.signature`;

            const result = decodeJwtPayload(token);
            expect(result).toEqual(payload);
        });

        it('should return null for invalid JWT format', () => {
            expect(decodeJwtPayload('not-a-jwt')).toBeNull();
            expect(decodeJwtPayload('')).toBeNull();
            expect(decodeJwtPayload('one.two')).toBeNull();
        });

        it('should return null for invalid base64 payload', () => {
            expect(decodeJwtPayload('header.!!!invalid!!!.signature')).toBeNull();
        });

        it('should handle tokens with standard base64url encoding', () => {
            const payload = { sub: 'f:provider:userid', name: 'Test User' };
            const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const token = `header.${body}.sig`;

            const result = decodeJwtPayload(token);
            expect(result).toEqual(payload);
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { extractTokenExpiration, calculateSessionTTL, setSessionTTLFromToken } from './sessionTTLUtil.js';

vi.mock('./logger.js', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }
}));

describe('sessionTTLUtil', () => {
    describe('extractTokenExpiration', () => {
        it('should extract expiration timestamp from valid token claims', () => {
            const mockRequest = {
                oidc: {
                    isAuthenticated: true,
                    tokenClaims: { exp: 1737400000 }
                }
            } as unknown as Request;

            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBe(1737400000);
        });

        it('should prioritize refresh token expiration over access token', () => {
            const mockRequest = {
                oidc: {
                    isAuthenticated: true,
                    refreshTokenClaims: { exp: 1737500000 },
                    tokenClaims: { exp: 1737400000 }
                }
            } as unknown as Request;

            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBe(1737500000);
        });

        it('should return null when token is not available', () => {
            const mockRequest = {} as Request;
            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBeNull();
        });

        it('should return null when exp claim is missing', () => {
            const mockRequest = {
                oidc: { isAuthenticated: true, tokenClaims: {} }
            } as unknown as Request;
            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBeNull();
        });

        it('should return null when exp is not a number', () => {
            const mockRequest = {
                oidc: { isAuthenticated: true, tokenClaims: { exp: 'invalid' } }
            } as unknown as Request;
            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBeNull();
        });
    });

    describe('calculateSessionTTL', () => {
        it('should calculate correct TTL in milliseconds', () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const ttl = calculateSessionTTL(futureTime);
            expect(ttl).toBeGreaterThanOrEqual(3599000);
            expect(ttl).toBeLessThanOrEqual(3600000);
        });

        it('should return minimum TTL of 60 seconds for expired tokens', () => {
            const pastTime = Math.floor(Date.now() / 1000) - 100;
            const ttl = calculateSessionTTL(pastTime);
            expect(ttl).toBe(60000);
        });

        it('should return minimum TTL of 60 seconds for very short remaining time', () => {
            const nearFuture = Math.floor(Date.now() / 1000) + 10;
            const ttl = calculateSessionTTL(nearFuture);
            expect(ttl).toBe(60000);
        });
    });

    describe('setSessionTTLFromToken', () => {
        let mockRequest: Request;

        beforeEach(() => {
            mockRequest = {
                session: {
                    cookie: { maxAge: 0, expires: new Date() }
                },
                oidc: {
                    isAuthenticated: true,
                    tokenClaims: { exp: Math.floor(Date.now() / 1000) + 3600 }
                }
            } as unknown as Request;
        });

        it('should set session TTL from token when available', () => {
            setSessionTTLFromToken(mockRequest);
            expect(mockRequest.session.cookie.maxAge).toBeGreaterThan(0);
            expect(mockRequest.session.cookie.expires).toBeInstanceOf(Date);
        });

        it('should exit silently when token is not available', () => {
            mockRequest.oidc = undefined;
            expect(setSessionTTLFromToken(mockRequest)).toBeUndefined();
        });

        it('should set cookie expires to match maxAge', () => {
            const beforeTime = Date.now();
            setSessionTTLFromToken(mockRequest);
            const afterTime = Date.now();
            const expiresTime = mockRequest.session.cookie.expires!.getTime();
            const expectedMin = beforeTime + mockRequest.session.cookie.maxAge!;
            const expectedMax = afterTime + mockRequest.session.cookie.maxAge!;
            expect(expiresTime).toBeGreaterThanOrEqual(expectedMin);
            expect(expiresTime).toBeLessThanOrEqual(expectedMax);
        });

        it('should handle token with exp in the past', () => {
            mockRequest.oidc!.tokenClaims = { exp: Math.floor(Date.now() / 1000) - 100 };
            setSessionTTLFromToken(mockRequest);
            expect(mockRequest.session.cookie.maxAge).toBe(60000);
        });
    });
});

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
        it('should extract expiration timestamp from valid token', () => {
            const mockRequest = {
                kauth: {
                    grant: {
                        access_token: {
                            content: {
                                exp: 1737400000
                            }
                        }
                    }
                }
            } as unknown as Request;

            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBe(1737400000);
        });

        it('should prioritize refresh token expiration over access token', () => {
            const mockRequest = {
                kauth: {
                    grant: {
                        refresh_token: {
                            content: {
                                exp: 1737500000
                            }
                        },
                        access_token: {
                            content: {
                                exp: 1737400000
                            }
                        }
                    }
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
                kauth: {
                    grant: {
                        access_token: {
                            content: {}
                        }
                    }
                }
            } as unknown as Request;

            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBeNull();
        });

        it('should return null when exp is not a number', () => {
            const mockRequest = {
                kauth: {
                    grant: {
                        access_token: {
                            content: {
                                exp: 'invalid'
                            }
                        }
                    }
                }
            } as unknown as Request;

            const exp = extractTokenExpiration(mockRequest);
            expect(exp).toBeNull();
        });
    });

    describe('calculateSessionTTL', () => {
        it('should calculate correct TTL in milliseconds', () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const ttl = calculateSessionTTL(futureTime);

            // Should be approximately 1 hour (3600000ms), allow 1 second tolerance
            expect(ttl).toBeGreaterThanOrEqual(3599000);
            expect(ttl).toBeLessThanOrEqual(3600000);
        });

        it('should return minimum TTL of 60 seconds for expired tokens', () => {
            const pastTime = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
            const ttl = calculateSessionTTL(pastTime);

            expect(ttl).toBe(60000); // 60 seconds in milliseconds
        });

        it('should return minimum TTL of 60 seconds for very short remaining time', () => {
            const nearFuture = Math.floor(Date.now() / 1000) + 10; // 10 seconds from now
            const ttl = calculateSessionTTL(nearFuture);

            expect(ttl).toBe(60000); // 60 seconds in milliseconds
        });
    });

    describe('setSessionTTLFromToken', () => {
        let mockRequest: Request;

        beforeEach(() => {
            mockRequest = {
                session: {
                    cookie: {
                        maxAge: 0,
                        expires: new Date()
                    }
                },
                kauth: {
                    grant: {
                        access_token: {
                            content: {
                                exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
                            }
                        }
                    }
                }
            } as unknown as Request;
        });

        it('should set session TTL from token when available', () => {
            setSessionTTLFromToken(mockRequest);

            expect(mockRequest.session.cookie.maxAge).toBeGreaterThan(0);
            expect(mockRequest.session.cookie.expires).toBeInstanceOf(Date);
        });

        it('should throw error when token is not available', () => {
            mockRequest.kauth = undefined;

            expect(() => setSessionTTLFromToken(mockRequest)).toThrow('Token expiration not available - cannot set session TTL');
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
            mockRequest.kauth!.grant!.access_token = {
                content: {
                    exp: Math.floor(Date.now() / 1000) - 100 // 100 seconds ago
                }
            } as any;

            setSessionTTLFromToken(mockRequest);

            expect(mockRequest.session.cookie.maxAge).toBe(60000); // Minimum 60 seconds
        });
    });
});

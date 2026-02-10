import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { handlePasswordForSignup, handlePasswordForReset } from './passwordHandler.js';

describe('Password Handler Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            body: {}
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        mockNext = vi.fn();
    });

    describe('handlePasswordForSignup', () => {
        it('should accept valid bcrypt hash', () => {
            // Valid bcrypt hash (example)
            const bcryptHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
            mockRequest.body = {
                request: {
                    password: bcryptHash
                }
            };

            handlePasswordForSignup(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.body.request.password).toBe(bcryptHash);
        });

        it('should accept bcrypt hash with $2b$ prefix', () => {
            const bcryptHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
            mockRequest.body = {
                request: {
                    password: bcryptHash
                }
            };

            handlePasswordForSignup(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle requests without password', () => {
            mockRequest.body = {
                request: {}
            };

            handlePasswordForSignup(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should still proceed with invalid hash format (Kong will validate)', () => {
            mockRequest.body = {
                request: {
                    password: 'not-a-bcrypt-hash'
                }
            };

            handlePasswordForSignup(mockRequest as Request, mockResponse as Response, mockNext);

            // Should still call next() - Kong will handle validation
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('handlePasswordForReset', () => {
        it('should accept valid bcrypt hash for reset', () => {
            const bcryptHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
            mockRequest.body = {
                request: {
                    password: bcryptHash
                }
            };

            handlePasswordForReset(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.body.request.password).toBe(bcryptHash);
        });

        it('should handle requests without password', () => {
            mockRequest.body = {
                request: {}
            };

            handlePasswordForReset(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});

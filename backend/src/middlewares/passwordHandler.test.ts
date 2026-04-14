import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { handlePassword } from './passwordHandler.js';

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

    describe('handlePassword', () => {
        it('should decode base64 encoded password', () => {
            // "TestPass123!" encoded in base64
            const base64Password = btoa('TestPass123!');
            mockRequest.body = {
                request: {
                    password: base64Password
                }
            };

            handlePassword(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.body.request.password).toBe('TestPass123!');
        });

        it('should decode password with special characters', () => {
            const originalPassword = 'P@ssw0rd!#$%^&*()';
            const base64Password = btoa(originalPassword);
            mockRequest.body = {
                request: {
                    password: base64Password
                }
            };

            handlePassword(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.body.request.password).toBe(originalPassword);
        });

        it('should handle requests without password', () => {
            mockRequest.body = {
                request: {}
            };

            handlePassword(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle empty request body', () => {
            mockRequest.body = {};

            handlePassword(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle invalid base64 gracefully', () => {
            mockRequest.body = {
                request: {
                    password: 'not-valid-base64!!!'
                }
            };

            handlePassword(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid password format',
                message: 'Password must be base64 encoded'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});

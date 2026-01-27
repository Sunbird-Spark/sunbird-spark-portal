import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { Session, SessionData } from 'express-session';
import axios from 'axios';

vi.mock('axios');
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

describe('kongAuth middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRequest = {
            sessionID: 'test-session-id',
            session: {
                cookie: {
                    maxAge: 30000,
                    expires: new Date(Date.now() + 30000)
                } as Session['cookie'],
                save: vi.fn((callback) => {
                    if (callback) callback();
                    return mockRequest.session as Session & Partial<SessionData>;
                }),
                regenerate: vi.fn(),
                destroy: vi.fn(),
                reload: vi.fn(),
                resetMaxAge: vi.fn(),
                touch: vi.fn(),
                id: 'test-session-id'
            } as Session & Partial<SessionData>
        };

        mockResponse = {};
        mockNext = vi.fn() as NextFunction;
    });

    describe('refreshSessionTTL', () => {
        it('should update session cookie maxAge and expires when cookie exists', async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: { SUNBIRD_ANONYMOUS_SESSION_TTL: 60000 }
            }));

            const { refreshSessionTTL } = await import('../services/kongAuthService.js');
            const req = mockRequest as Request;
            const beforeMaxAge = req.session?.cookie.maxAge;

            refreshSessionTTL(req);

            expect(req.session?.cookie.maxAge).toBe(60000);
            expect(req.session?.cookie.maxAge).not.toBe(beforeMaxAge);
            expect(req.session?.cookie.expires).toBeInstanceOf(Date);
        });

    });

    describe('registerDeviceWithKong', () => {
        const mockEnvConfig = {
            KONG_URL: 'http://kong-api.com',
            KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'test-bearer-token',
            KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-token',
            SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
        };

        beforeEach(() => {
            vi.resetModules();
        });
        it('should reuse existing kongToken and refresh session TTL', async () => {
            vi.doMock('../config/env.js', () => ({ envConfig: mockEnvConfig }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            if (mockRequest.session) mockRequest.session.kongToken = 'existing-token';

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.info).toHaveBeenCalledWith('ANONYMOUS_KONG_TOKEN :: using existing token');
            expect(mockRequest.session?.cookie.maxAge).toBe(60000);
            expect(mockRequest.session?.save).toHaveBeenCalled();
            expect(axios.post).not.toHaveBeenCalled();
        });

        it('should generate new token when kongToken does not exist', async () => {
            vi.doMock('../config/env.js', () => ({ envConfig: mockEnvConfig }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
                data: { params: { status: 'successful' }, result: { token: 'new-generated-token' } }
            });

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.info).toHaveBeenCalledWith('ANONYMOUS_KONG_TOKEN :: requesting anonymous token from Kong');
            expect(axios.post).toHaveBeenCalledWith('http://kong-api.com/api-manager/v2/consumer/portal_anonymous/credential/register',
                { request: { key: 'test-session-id' } },
                { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-bearer-token' } }
            );
            expect(mockRequest.session?.kongToken).toBe('new-generated-token');
            expect(mockRequest.session?.roles).toEqual(['ANONYMOUS']);
        });

        it('should use fallback token when API returns unsuccessful status', async () => {
            vi.doMock('../config/env.js', () => ({ envConfig: mockEnvConfig }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');

            (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
                data: { params: { status: 'failed' } }
            });

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockRequest.session?.kongToken).toBe('fallback-token');
        });

        it('should use fallback token when API throws error', async () => {
            vi.doMock('../config/env.js', () => ({ envConfig: mockEnvConfig }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            const apiError = new Error('Network error');
            (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.error).toHaveBeenCalledWith(
                'ANONYMOUS_KONG_TOKEN :: token generation failed for session test-session-id',
                apiError
            );
            expect(mockRequest.session?.kongToken).toBe('fallback-token');
        });

        it('should handle session save error', async () => {
            vi.doMock('../config/env.js', () => ({ envConfig: mockEnvConfig }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            const saveError = new Error('Session save failed');
            if (mockRequest.session) {
                mockRequest.session.save = vi.fn((callback) => {
                    if (callback) callback(saveError);
                    return mockRequest.session as Session & Partial<SessionData>;
                });
            }

            (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
                data: { params: { status: 'successful' }, result: { token: 'new-token' } }
            });

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.error).toHaveBeenCalledWith('ANONYMOUS_KONG_TOKEN :: failed to save session', saveError);
            expect(mockNext).toHaveBeenCalledWith(saveError);
        });

        it('should handle missing sessionID and use fallback token', async () => {
            vi.doMock('../config/env.js', () => ({ envConfig: mockEnvConfig }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            mockRequest.sessionID = undefined;

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.error).toHaveBeenCalledWith(
                'ANONYMOUS_KONG_TOKEN :: token generation failed for session undefined',
                expect.any(Error)
            );
            expect(mockRequest.session?.kongToken).toBe('fallback-token');
        });

        it('should use empty fallback token when API fails and fallback is not configured', async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: { ...mockEnvConfig, KONG_ANONYMOUS_FALLBACK_TOKEN: '' }
            }));

            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            // API returns unsuccessful status, causing generateKongToken to throw
            (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
                data: { params: { status: 'failed' } }
            });

            const middleware = registerDeviceWithKong();
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.error).toHaveBeenCalledWith(
                'ANONYMOUS_KONG_TOKEN :: token generation failed for session test-session-id',
                expect.any(Error)
            );
            expect(mockRequest.session?.kongToken).toBe('');
        });

        it('should handle missing device registration API config', async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: { ...mockEnvConfig, KONG_URL: '' }
            }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.error).toHaveBeenCalledWith(
                'ANONYMOUS_KONG_TOKEN :: token generation failed for session test-session-id',
                expect.any(Error)
            );
            expect(mockRequest.session?.kongToken).toBe('fallback-token');
        });

        it('should handle missing bearer token config', async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: { ...mockEnvConfig, KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: '' }
            }));
            const { registerDeviceWithKong } = await import('./kongAuth.js');
            const logger = (await import('../utils/logger.js')).default;

            await registerDeviceWithKong()(mockRequest as Request, mockResponse as Response, mockNext);

            expect(logger.error).toHaveBeenCalledWith(
                'ANONYMOUS_KONG_TOKEN :: token generation failed for session test-session-id',
                expect.any(Error)
            );
            expect(mockRequest.session?.kongToken).toBe('fallback-token');
        });
    });
});
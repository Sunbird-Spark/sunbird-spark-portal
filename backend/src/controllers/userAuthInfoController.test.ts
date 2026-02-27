import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getAuthInfo } from './userAuthInfoController.js';
import { Response as ApiResponse } from '../models/Response.js';
import logger from '../utils/logger.js';
import { saveSession } from '../utils/sessionUtils.js';

// Mock dependencies
vi.mock('../models/Response');
vi.mock('../utils/logger');
vi.mock('../utils/sessionUtils');

describe('AuthController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let mockResponseInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Request
        req = {
            headers: {},
            session: {
                deviceId: undefined,
                userId: undefined,
                save: vi.fn(),
                regenerate: vi.fn(),
                reload: vi.fn(),
                destroy: vi.fn(),
                touch: vi.fn(),
                resetMaxAge: vi.fn(),
                cookie: {} as any,
                id: 'test-session-id',
            } as any,
            sessionID: 'test-session-id',
            kauth: undefined
        };

        // Mock Response
        res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn()
        };

        // Mock ApiResponse class
        mockResponseInstance = {
            setResult: vi.fn(),
            setError: vi.fn()
        };
        // Ensure ApiResponse construction returns our mock instance
        (ApiResponse as any).mockImplementation(function () { return mockResponseInstance; });
    });

    it('should return auth status for anonymous user without device ID', async () => {
        await getAuthInfo(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockResponseInstance.setResult).toHaveBeenCalledWith({
            data: {
                sid: 'test-session-id',
                uid: null,
                isAuthenticated: false
            }
        });
    });

    it('should return auth status for authenticated user', async () => {
        req.session!.userId = 'user-123';
        req.kauth = { grant: {} } as any; // Simulate authenticated state logic

        await getAuthInfo(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockResponseInstance.setResult).toHaveBeenCalledWith({
            data: {
                sid: 'test-session-id',
                uid: 'user-123',
                isAuthenticated: true,
            }
        });
    });

    it('should store device ID in session if provided in headers', async () => {
        req.headers!['x-device-id'] = 'device-123';

        await getAuthInfo(req as Request, res as Response);

        expect(req.session!.deviceId).toBe('device-123');
        expect(saveSession).toHaveBeenCalledWith(req);
        expect(logger.info).toHaveBeenCalledWith('AUTH_STATUS :: Device ID stored in session: device-123');
    });

    it('should not overwrite existing device ID in session', async () => {
        req.headers!['x-device-id'] = 'device-new';
        req.session!.deviceId = 'device-old';

        await getAuthInfo(req as Request, res as Response);

        expect(req.session!.deviceId).toBe('device-old');
        expect(saveSession).not.toHaveBeenCalled();
    });

    it('should log device ID for debugging', async () => {
        req.headers!['x-device-id'] = 'device-123';

        await getAuthInfo(req as Request, res as Response);

        expect(logger.info).toHaveBeenCalledWith('AUTH_STATUS :: Request from device ID: device-123');
    });

    it('should handle errors properly', async () => {
        const error = new Error('Test error');
        // Simulate error by making sessionID access throw (or any other part)
        // Here we can force an error by redefining a property to throw
        Object.defineProperty(req, 'sessionID', {
            get: () => { throw error; }
        });

        await getAuthInfo(req as Request, res as Response);

        expect(logger.error).toHaveBeenCalledWith('Error fetching auth status:', error);
        expect(mockResponseInstance.setError).toHaveBeenCalledWith({
            err: "ERR_GET_AUTH_STATUS",
            errmsg: 'Test error',
            responseCode: "SERVER_ERROR"
        });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockResponseInstance);
    });

    it('should handle errors with custom status code', async () => {
        const error: any = new Error('Custom error');
        error.statusCode = 400;

        Object.defineProperty(req, 'sessionID', {
            get: () => { throw error; }
        });

        await getAuthInfo(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});

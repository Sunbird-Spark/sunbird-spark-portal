import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { Request } from 'express';
import { saveSession, regenerateSession, regenerateAnonymousSession, destroySession } from './sessionUtils.js';

vi.mock('./logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }
}));

vi.mock('../services/kongAuthService.js', () => ({
    generateLoggedInKongToken: vi.fn(),
    generateKongToken: vi.fn(),
}));

vi.mock('../config/env.js', () => ({
    envConfig: {
        KONG_ANONYMOUS_FALLBACK_TOKEN: 'mock-fallback-token'
    }
}));

import logger from './logger.js';
import { generateLoggedInKongToken, generateKongToken } from '../services/kongAuthService.js';

describe('sessionUtils', () => {
    let mockReq: Request;
    let mockSession: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSession = {
            id: 'old-session-id',
            save: vi.fn((cb) => cb && cb(null)),
            regenerate: vi.fn((cb) => {
                mockSession.id = 'new-session-id';
                (mockReq as any).sessionID = 'new-session-id';
                cb && cb(null);
            }),
            destroy: vi.fn((cb) => cb && cb(null)),
            cookie: {},
        };

        mockReq = {
            session: mockSession,
            sessionID: 'old-session-id',
        } as unknown as Request;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('saveSession', () => {
        it('should resolve immediately if no session exists', async () => {
            mockReq.session = undefined as any;
            await expect(saveSession(mockReq)).resolves.toBeUndefined();
        });

        it('should save the session successfully', async () => {
            await expect(saveSession(mockReq)).resolves.toBeUndefined();
            expect(mockSession.save).toHaveBeenCalled();
        });

        it('should reject if session.save fails', async () => {
            const error = new Error('Save failed');
            mockSession.save.mockImplementation((cb: any) => cb(error));
            await expect(saveSession(mockReq)).rejects.toThrow('Save failed');
        });
    });

    describe('regenerateSession', () => {
        it('should resolve immediately if no session exists', async () => {
            mockReq.session = undefined as any;
            await expect(regenerateSession(mockReq)).resolves.toBeUndefined();
        });

        it('should regenerate session and update tokens successfully', async () => {
            mockSession['oidc-tokens'] = { access_token: 'old-access-token' };
            mockSession.auth_redirect_uri = '/dashboard';

            (generateLoggedInKongToken as Mock).mockResolvedValue('new-kong-token');

            await regenerateSession(mockReq);

            expect(mockSession.regenerate).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Session regenerated old-session-id->new-session-id'));

            expect(mockSession['oidc-tokens']).toEqual({ access_token: 'old-access-token' });
            expect(mockSession.auth_redirect_uri).toBe('/dashboard');
            expect(mockSession.kongToken).toBe('new-kong-token');

            expect(mockSession.save).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Regenerated session saved successfully');
        });

        it('should reject if session.regenerate fails', async () => {
            const error = new Error('Regenerate failed');
            mockSession.regenerate.mockImplementation((cb: any) => cb(error));
            await expect(regenerateSession(mockReq)).rejects.toThrow('Regenerate failed');
        });

        it('should reject if generateLoggedInKongToken fails', async () => {
            (generateLoggedInKongToken as Mock).mockRejectedValue(new Error('Token generation failed'));
            await expect(regenerateSession(mockReq)).rejects.toThrow('Token generation failed');
            expect(logger.error).toHaveBeenCalledWith('Error generating new Kong token:', expect.any(Error));
        });

        it('should reject if session.save after regenerate fails', async () => {
            (generateLoggedInKongToken as Mock).mockResolvedValue('new-kong-token');
            const error = new Error('Save after regenerate failed');
            mockSession.regenerate.mockImplementation((cb: Function) => cb(null));
            mockSession.save.mockImplementation((cb: Function) => cb(error));
            await expect(regenerateSession(mockReq)).rejects.toThrow('Save after regenerate failed');
            expect(logger.error).toHaveBeenCalledWith('Error saving regenerated session:', error);
        });
    });

    describe('regenerateAnonymousSession', () => {
        it('should resolve immediately if no session exists', async () => {
            mockReq.session = undefined as any;
            await expect(regenerateAnonymousSession(mockReq)).resolves.toBeUndefined();
        });

        it('should regenerate anonymous session with generated token', async () => {
            (generateKongToken as Mock).mockResolvedValue('generated-anon-token');
            await regenerateAnonymousSession(mockReq);
            expect(mockSession.regenerate).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Anonymous Session regenerated'));
            expect(mockSession.kongToken).toBe('generated-anon-token');
            expect(mockSession.roles).toEqual(['ANONYMOUS']);
            expect(mockSession.save).toHaveBeenCalled();
        });

        it('should use fallback token if generateKongToken returns null', async () => {
            (generateKongToken as Mock).mockResolvedValue(null);
            await regenerateAnonymousSession(mockReq);
            expect(mockSession.kongToken).toBe('mock-fallback-token');
        });

        it('should reject if session.regenerate fails', async () => {
            const error = new Error('Regenerate failed');
            mockSession.regenerate.mockImplementation((cb: any) => cb(error));
            await expect(regenerateAnonymousSession(mockReq)).rejects.toThrow('Regenerate failed');
        });

        it('should reject if token generation fails', async () => {
            (generateKongToken as Mock).mockRejectedValue(new Error('Token gen failed'));
            await expect(regenerateAnonymousSession(mockReq)).rejects.toThrow('Token gen failed');
            expect(logger.error).toHaveBeenCalledWith('Error generating new Anonymous Kong token:', expect.any(Error));
        });

        it('should reject if saving regenerated session fails', async () => {
            (generateKongToken as Mock).mockResolvedValue('token');
            const error = new Error('Save failed');
            mockSession.regenerate.mockImplementation((cb: Function) => cb(null));
            mockSession.save.mockImplementation((cb: Function) => cb(error));
            await expect(regenerateAnonymousSession(mockReq)).rejects.toThrow('Save failed');
            expect(logger.error).toHaveBeenCalledWith('Error saving regenerated anonymous session:', error);
        });
    });

    describe('destroySession', () => {
        it('should resolve immediately if no session exists', async () => {
            mockReq.session = undefined as any;
            await expect(destroySession(mockReq)).resolves.toBeUndefined();
        });

        it('should destroy the session successfully', async () => {
            await expect(destroySession(mockReq)).resolves.toBeUndefined();
            expect(mockSession.destroy).toHaveBeenCalled();
        });

        it('should reject if session.destroy fails', async () => {
            const error = new Error('Destroy failed');
            mockSession.destroy.mockImplementation((cb: any) => cb(error));
            await expect(destroySession(mockReq)).rejects.toThrow('Destroy failed');
        });
    });
});

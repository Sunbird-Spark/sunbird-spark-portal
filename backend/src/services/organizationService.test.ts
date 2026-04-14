import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getDefaultOrg, setOrgToSession, saveOrgSession } from './organizationService.js';
import * as sessionUtils from '../utils/sessionUtils.js';

vi.mock('axios');
vi.mock('../utils/sessionUtils.js');
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('organizationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDefaultOrg', () => {
        it('should fetch organization successfully', async () => {
            const mockOrg = {
                id: 'org-123',
                slug: 'sunbird',
                hashTagId: 'channel-123',
            };

            (axios.post as any).mockResolvedValue({
                data: {
                    responseCode: 'OK',
                    result: {
                        response: {
                            content: [mockOrg],
                        },
                    },
                },
            });

            const result = await getDefaultOrg('sunbird', 'test-token');

            expect(result).toEqual(mockOrg);
            // Expect either relative or absolute URL containing the path
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringMatching(/\/org\/v2\/search/),
                { request: { filters: { slug: 'sunbird', isTenant: true } } },
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });

        it('should throw error if response code is not OK', async () => {
            (axios.post as any).mockResolvedValue({
                data: {
                    responseCode: 'ERROR',
                },
            });

            await expect(getDefaultOrg('sunbird', 'test-token')).rejects.toThrow(
                'Failed to fetch organization: ERROR'
            );
        });

        it('should throw error if organization not found', async () => {
            (axios.post as any).mockResolvedValue({
                data: {
                    responseCode: 'OK',
                    result: {
                        response: {
                            content: [],
                        },
                    },
                },
            });

            await expect(getDefaultOrg('sunbird', 'test-token')).rejects.toThrow(
                'Organization not found for slug: sunbird'
            );
        });

        it('should handle API errors', async () => {
            (axios.post as any).mockRejectedValue(new Error('Network error'));

            await expect(getDefaultOrg('sunbird', 'test-token')).rejects.toThrow('Network error');
        });
    });

    describe('setOrgToSession', () => {
        it('should set hashTagId to session', () => {
            const mockReq: any = { session: {} };
            const mockOrg = {
                id: 'org-123',
                slug: 'sunbird',
                hashTagId: 'channel-123',
            };

            setOrgToSession(mockReq, mockOrg);

            expect(mockReq.session.rootOrghashTagId).toBe('channel-123');
        });

        it('should fallback to channel if hashTagId not present', () => {
            const mockReq: any = { session: {} };
            const mockOrg = {
                id: 'org-123',
                slug: 'sunbird',
                channel: 'channel-456',
            };

            setOrgToSession(mockReq, mockOrg);

            expect(mockReq.session.rootOrghashTagId).toBe('channel-456');
        });
    });

    describe('saveOrgSession', () => {
        it('should save session', async () => {
            const mockReq: any = { session: {} };
            (sessionUtils.saveSession as any).mockResolvedValue(undefined);

            await saveOrgSession(mockReq);

            expect(sessionUtils.saveSession).toHaveBeenCalledWith(mockReq);
        });

        it('should handle save errors', async () => {
            const mockReq: any = { session: {} };
            (sessionUtils.saveSession as any).mockRejectedValue(new Error('Save failed'));

            await expect(saveOrgSession(mockReq)).rejects.toThrow('Save failed');
        });
    });
});

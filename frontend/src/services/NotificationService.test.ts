import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './NotificationService';
import { getClient } from '../lib/http-client';

vi.mock('../lib/http-client', () => ({
    getClient: vi.fn(),
}));

describe('NotificationService', () => {
    let service: NotificationService;
    const mockGet = vi.fn();
    const mockPatch = vi.fn();
    const mockPost = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (getClient as ReturnType<typeof vi.fn>).mockReturnValue({
            get: mockGet,
            patch: mockPatch,
            post: mockPost,
        });
        service = new NotificationService();
    });

    describe('notificationsRead', () => {
        it('calls GET with the correct URL including userId', async () => {
            mockGet.mockResolvedValue({ data: { feeds: [] }, status: 200, headers: {} });

            await service.notificationsRead('user-123');

            expect(mockGet).toHaveBeenCalledWith('/notification/v1/feed/read/user-123');
        });

        it('returns the API response', async () => {
            const mockFeeds = [{ id: 'notif-1', status: 'unread' }];
            mockGet.mockResolvedValue({ data: { feeds: mockFeeds }, status: 200, headers: {} });

            const result = await service.notificationsRead('user-123');

            expect(result.data.feeds).toEqual(mockFeeds);
        });
    });

    describe('notificationsUpdate', () => {
        it('calls PATCH with the correct URL', async () => {
            mockPatch.mockResolvedValue({ data: {}, status: 200, headers: {} });

            await service.notificationsUpdate(['notif-1', 'notif-2'], 'user-123');

            expect(mockPatch).toHaveBeenCalledWith(
                '/notification/v1/feed/update',
                expect.anything(),
            );
        });

        it('sends correct request body', async () => {
            mockPatch.mockResolvedValue({ data: {}, status: 200, headers: {} });

            await service.notificationsUpdate(['notif-1', 'notif-2'], 'user-123');

            expect(mockPatch).toHaveBeenCalledWith('/notification/v1/feed/update', {
                request: { ids: ['notif-1', 'notif-2'], userId: 'user-123' },
            });
        });
    });

    describe('notificationsDelete', () => {
        it('calls POST with the correct URL', async () => {
            mockPost.mockResolvedValue({ data: {}, status: 200, headers: {} });

            await service.notificationsDelete(['notif-1'], 'user-123', 'group-feed');

            expect(mockPost).toHaveBeenCalledWith(
                '/notification/v1/feed/delete',
                expect.anything(),
            );
        });

        it('sends correct request body with ids, userId and category', async () => {
            mockPost.mockResolvedValue({ data: {}, status: 200, headers: {} });

            await service.notificationsDelete(['notif-1', 'notif-2'], 'user-123', 'group-feed');

            expect(mockPost).toHaveBeenCalledWith('/notification/v1/feed/delete', {
                request: { ids: ['notif-1', 'notif-2'], userId: 'user-123', category: 'group-feed' },
            });
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService, getDateGroup, parseTemplateMessage } from './NotificationService';
import { getClient } from '../lib/http-client';
import dayjs from 'dayjs';

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

describe('getDateGroup', () => {
    it('returns "Today" for current date', () => {
        const today = dayjs().format('YYYY-MM-DDTHH:mm:ss');
        expect(getDateGroup(today)).toBe('Today');
    });

    it('returns "Yesterday" for yesterday\'s date', () => {
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm:ss');
        expect(getDateGroup(yesterday)).toBe('Yesterday');
    });

    it('returns "Older" for dates before yesterday', () => {
        const twoDaysAgo = dayjs().subtract(2, 'days').format('YYYY-MM-DDTHH:mm:ss');
        expect(getDateGroup(twoDaysAgo)).toBe('Older');
    });

    it('returns "Older" for dates in the past', () => {
        const lastWeek = dayjs().subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss');
        expect(getDateGroup(lastWeek)).toBe('Older');
    });
});

describe('parseTemplateMessage', () => {
    it('parses JSON and returns description if present', () => {
        const templateData = JSON.stringify({ description: 'Test description', title: 'Test title' });
        expect(parseTemplateMessage(templateData)).toBe('Test description');
    });

    it('parses JSON and returns title if description is not present', () => {
        const templateData = JSON.stringify({ title: 'Test title' });
        expect(parseTemplateMessage(templateData)).toBe('Test title');
    });

    it('returns original string if neither description nor title is present', () => {
        const templateData = JSON.stringify({ message: 'Test message' });
        expect(parseTemplateMessage(templateData)).toBe(templateData);
    });

    it('returns original string if JSON parsing fails', () => {
        const invalidJson = 'not a valid json';
        expect(parseTemplateMessage(invalidJson)).toBe(invalidJson);
    });

    it('handles empty string', () => {
        expect(parseTemplateMessage('')).toBe('');
    });
});

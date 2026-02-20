import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import dayjs from 'dayjs';
import {
    useNotificationRead,
    useNotificationUpdate,
    useNotificationDelete,
    useNotificationGrouping,
    useNotificationMessage,
} from './useNotification';
import { NotificationFeed } from '../types/notificationTypes';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockNotificationService, mockUserAuthInfoService } = vi.hoisted(() => ({
    mockNotificationService: {
        notificationsRead: vi.fn(),
        notificationsUpdate: vi.fn(),
        notificationsDelete: vi.fn(),
    },
    mockUserAuthInfoService: {
        getUserId: vi.fn(),
        getAuthInfo: vi.fn(),
    },
}));

vi.mock('../services/NotificationService', () => ({
    notificationService: mockNotificationService,
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
    default: mockUserAuthInfoService,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

const makeFeed = (overrides: Partial<NotificationFeed> = {}): NotificationFeed => ({
    id: 'notif-1',
    userId: 'user-1',
    category: 'course',
    priority: 1,
    status: 'unread',
    createdOn: dayjs().toISOString(),
    updatedOn: null,
    expireOn: null,
    updatedBy: null,
    createdBy: 'creator-1',
    version: null,
    action: {
        createdBy: { name: 'Creator', id: 'creator-1', type: 'user' },
        additionalInfo: {},
        type: 'group-activity-added',
        category: 'group-feed',
        template: {
            ver: '4.3.0',
            data: JSON.stringify({ title: 'Test title', description: 'Test description' }),
            type: 'JSON',
        },
    },
    ...overrides,
});

// ── useNotificationMessage ────────────────────────────────────────────────────
describe('useNotificationMessage', () => {
    it('getMessage returns description from template data', () => {
        const { result } = renderHook(() => useNotificationMessage());
        expect(result.current.getMessage(makeFeed())).toBe('Test description');
    });

    it('getMessage falls back to title when description is absent', () => {
        const feed = makeFeed({
            action: {
                ...makeFeed().action,
                template: {
                    ver: '4.3.0',
                    data: JSON.stringify({ title: 'Title only' }),
                    type: 'JSON',
                },
            },
        });
        const { result } = renderHook(() => useNotificationMessage());
        expect(result.current.getMessage(feed)).toBe('Title only');
    });

    it('getMessage returns raw data string when JSON is invalid', () => {
        const feed = makeFeed({
            action: {
                ...makeFeed().action,
                template: { ver: '4.3.0', data: 'not-json', type: 'JSON' },
            },
        });
        const { result } = renderHook(() => useNotificationMessage());
        expect(result.current.getMessage(feed)).toBe('not-json');
    });
});

// ── useNotificationGrouping ───────────────────────────────────────────────────
describe('useNotificationGrouping', () => {
    it('groups a notification as Today when createdOn is today', () => {
        const feed = makeFeed({ createdOn: dayjs().toISOString() });
        const { result } = renderHook(() => useNotificationGrouping([feed]));
        expect(result.current.groupedNotifications[0].group).toBe('Today');
    });

    it('groups a notification as Yesterday when createdOn is yesterday', () => {
        const feed = makeFeed({ createdOn: dayjs().subtract(1, 'day').toISOString() });
        const { result } = renderHook(() => useNotificationGrouping([feed]));
        expect(result.current.groupedNotifications[0].group).toBe('Yesterday');
    });

    it('groups a notification as Older when createdOn is more than a day ago', () => {
        const feed = makeFeed({ createdOn: dayjs().subtract(5, 'day').toISOString() });
        const { result } = renderHook(() => useNotificationGrouping([feed]));
        expect(result.current.groupedNotifications[0].group).toBe('Older');
    });

    it('filters out groups that have no items', () => {
        const feed = makeFeed({ createdOn: dayjs().toISOString() });
        const { result } = renderHook(() => useNotificationGrouping([feed]));
        const groups = result.current.groupedNotifications.map(g => g.group);
        expect(groups).toEqual(['Today']);
        expect(groups).not.toContain('Yesterday');
        expect(groups).not.toContain('Older');
    });

    it('counts only unread notifications', () => {
        const unread = makeFeed({ id: 'notif-1', status: 'unread' });
        const read = makeFeed({ id: 'notif-2', status: 'read' });
        const { result } = renderHook(() => useNotificationGrouping([unread, read]));
        expect(result.current.unreadCount).toBe(1);
    });

    it('returns zero unreadCount when all notifications are read', () => {
        const read1 = makeFeed({ id: 'notif-1', status: 'read' });
        const read2 = makeFeed({ id: 'notif-2', status: 'read' });
        const { result } = renderHook(() => useNotificationGrouping([read1, read2]));
        expect(result.current.unreadCount).toBe(0);
    });

    it('returns empty groupedNotifications for empty input', () => {
        const { result } = renderHook(() => useNotificationGrouping([]));
        expect(result.current.groupedNotifications).toEqual([]);
        expect(result.current.unreadCount).toBe(0);
    });
});

// ── useNotificationRead ───────────────────────────────────────────────────────
describe('useNotificationRead', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches notifications using synchronous userId', async () => {
        const feeds = [makeFeed()];
        mockUserAuthInfoService.getUserId.mockReturnValue('user-1');
        mockNotificationService.notificationsRead.mockResolvedValue({
            data: { feeds },
            status: 200,
            headers: {},
        });

        const { result } = renderHook(() => useNotificationRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.notifications).toEqual(feeds);
        expect(mockNotificationService.notificationsRead).toHaveBeenCalledWith('user-1');
    });

    it('falls back to getAuthInfo when getUserId returns null', async () => {
        mockUserAuthInfoService.getUserId.mockReturnValue(null);
        mockUserAuthInfoService.getAuthInfo.mockResolvedValue({ uid: 'user-from-auth' });
        mockNotificationService.notificationsRead.mockResolvedValue({
            data: { feeds: [] },
            status: 200,
            headers: {},
        });

        const { result } = renderHook(() => useNotificationRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(mockNotificationService.notificationsRead).toHaveBeenCalledWith('user-from-auth');
    });

    it('sets error when no userId is available', async () => {
        mockUserAuthInfoService.getUserId.mockReturnValue(null);
        mockUserAuthInfoService.getAuthInfo.mockResolvedValue({ uid: null });

        const { result } = renderHook(() => useNotificationRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.error).toBeInstanceOf(Error), { timeout: 3000 });
        expect(result.current.error?.message).toBe('User ID not available');
    });

    it('returns empty array as default before data loads', () => {
        mockUserAuthInfoService.getUserId.mockReturnValue('user-1');
        mockNotificationService.notificationsRead.mockResolvedValue({
            data: { feeds: [] },
            status: 200,
            headers: {},
        });

        const { result } = renderHook(() => useNotificationRead(), { wrapper: createWrapper() });

        expect(result.current.notifications).toEqual([]);
    });
});

// ── useNotificationUpdate ─────────────────────────────────────────────────────
describe('useNotificationUpdate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls notificationsUpdate with correct ids and userId', async () => {
        mockNotificationService.notificationsUpdate.mockResolvedValue({
            data: {},
            status: 200,
            headers: {},
        });

        const { result } = renderHook(() => useNotificationUpdate(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ ids: ['notif-1'], userId: 'user-1' });
        });

        expect(mockNotificationService.notificationsUpdate).toHaveBeenCalledWith(
            ['notif-1'],
            'user-1',
        );
    });

    it('calls notificationsUpdate with multiple ids', async () => {
        mockNotificationService.notificationsUpdate.mockResolvedValue({
            data: {},
            status: 200,
            headers: {},
        });

        const { result } = renderHook(() => useNotificationUpdate(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.mutateAsync({ ids: ['notif-1', 'notif-2'], userId: 'user-1' });
        });

        expect(mockNotificationService.notificationsUpdate).toHaveBeenCalledWith(
            ['notif-1', 'notif-2'],
            'user-1',
        );
    });
});

// ── useNotificationDelete ─────────────────────────────────────────────────────
describe('useNotificationDelete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('optimistically hides notification before API resolves', async () => {
        let resolveFn!: () => void;
        mockNotificationService.notificationsDelete.mockReturnValue(
            new Promise<void>(res => { resolveFn = res; }),
        );

        const feed = makeFeed();
        const { result } = renderHook(() => useNotificationDelete(), { wrapper: createWrapper() });

        act(() => {
            result.current.deleteNotification(feed);
        });

        expect(result.current.filterDeleted([feed])).toEqual([]);
        resolveFn();
    });

    it('calls notificationsDelete with notification id, userId and action.category', async () => {
        mockNotificationService.notificationsDelete.mockResolvedValue({
            data: {},
            status: 200,
            headers: {},
        });

        const feed = makeFeed();
        const { result } = renderHook(() => useNotificationDelete(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.deleteNotification(feed);
        });

        expect(mockNotificationService.notificationsDelete).toHaveBeenCalledWith(
            [feed.id],
            feed.userId,
            feed.action.category,
        );
    });

    it('filterDeleted excludes ids that have been deleted', async () => {
        mockNotificationService.notificationsDelete.mockResolvedValue({
            data: {},
            status: 200,
            headers: {},
        });

        const feed1 = makeFeed({ id: 'notif-1' });
        const feed2 = makeFeed({ id: 'notif-2' });
        const { result } = renderHook(() => useNotificationDelete(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.deleteNotification(feed1);
        });

        expect(result.current.filterDeleted([feed1, feed2])).toEqual([feed2]);
    });

    it('deleteAll marks every notification as deleted', async () => {
        mockNotificationService.notificationsDelete.mockResolvedValue({
            data: {},
            status: 200,
            headers: {},
        });

        const feed1 = makeFeed({ id: 'notif-1' });
        const feed2 = makeFeed({ id: 'notif-2' });
        const { result } = renderHook(() => useNotificationDelete(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.deleteAll([feed1, feed2]);
        });

        expect(result.current.filterDeleted([feed1, feed2])).toEqual([]);
    });

    it('deleteAll calls notificationsDelete once per notification', async () => {
        mockNotificationService.notificationsDelete.mockResolvedValue({
            data: {},
            status: 200,
            headers: {},
        });

        const feed1 = makeFeed({ id: 'notif-1' });
        const feed2 = makeFeed({ id: 'notif-2' });
        const { result } = renderHook(() => useNotificationDelete(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.deleteAll([feed1, feed2]);
        });

        expect(mockNotificationService.notificationsDelete).toHaveBeenCalledTimes(2);
    });
});

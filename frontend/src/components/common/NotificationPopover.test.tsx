import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationPopover } from './NotificationPopover';
import type { NotificationFeed } from '@/types/notificationTypes';

// ── Mock react-router-dom navigate ───────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock i18n
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.notifications': 'Notifications',
        'notifications.empty': 'No notifications',
        'notifications.deleteAll': 'Delete All',
      };
      return translations[key] || key;
    },
  }),
}));

// ── Mock all useNotification hooks ────────────────────────────────────────────
vi.mock('@/hooks/useNotification', () => ({
    useNotificationRead: vi.fn(),
    useNotificationDelete: vi.fn(),
    useNotificationGrouping: vi.fn(),
    useNotificationMessage: vi.fn(),
    useNotificationUpdate: vi.fn(),
}));

import * as notificationHooks from '@/hooks/useNotification';

// ── Test data ─────────────────────────────────────────────────────────────────
const makeFeed = (id: string, overrides: Partial<NotificationFeed> = {}): NotificationFeed => ({
    id,
    userId: 'user-1',
    category: 'course',
    priority: 1,
    status: 'unread',
    createdOn: '2026-02-20T09:30:00Z',
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
            data: JSON.stringify({ title: 'Notification ' + id }),
            type: 'JSON',
        },
    },
    ...overrides,
});

const feed1 = makeFeed('1');
const feed2 = makeFeed('2', { createdOn: '2026-02-20T08:30:00Z' });
const feed3 = makeFeed('3', { createdOn: '2026-01-13T09:00:00Z' });

const mockGrouped = [
    { group: 'Today' as const, items: [feed1, feed2] },
    { group: 'Older' as const, items: [feed3] },
];
const mockNotifications = [feed1, feed2, feed3];

// ── Shared mock functions ─────────────────────────────────────────────────────
const mockRefetch = vi.fn();
const mockDeleteNotification = vi.fn((item: NotificationFeed) => Promise.resolve());
const mockDeleteAll = vi.fn((items: NotificationFeed[]) => Promise.resolve());
const mockFilterDeleted = vi.fn((n: NotificationFeed[]) => n);
const mockGetMessage = vi.fn((feed: NotificationFeed) => {
    try { return JSON.parse(feed.action.template.data).title ?? ''; } catch { return ''; }
});
const mockMutateAsync = vi.fn((params: { ids: string[]; userId: string }) => Promise.resolve({ data: {}, status: 200, headers: {} }));

const setupDefaultMocks = () => {
    vi.mocked(notificationHooks.useNotificationRead).mockReturnValue({
        notifications: mockNotifications,
        refetch: mockRefetch,
        isLoading: false,
        error: null,
    });
    vi.mocked(notificationHooks.useNotificationDelete).mockReturnValue({
        deleteNotification: mockDeleteNotification,
        deleteAll: mockDeleteAll,
        filterDeleted: mockFilterDeleted,
        deletedIds: new Set(),
    });
    vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
        groupedNotifications: mockGrouped,
        unreadCount: 3,
    });
    vi.mocked(notificationHooks.useNotificationMessage).mockReturnValue({
        getMessage: mockGetMessage,
    });
    vi.mocked(notificationHooks.useNotificationUpdate).mockReturnValue({
        mutateAsync: mockMutateAsync,
        mutate: vi.fn(),
        data: undefined,
        error: null,
        isError: false,
        isIdle: true,
        isPending: false,
        isSuccess: false,
        status: 'idle',
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        reset: vi.fn(),
        submittedAt: 0,
    } as ReturnType<typeof notificationHooks.useNotificationUpdate>);
};

const renderPopover = () =>
    render(<MemoryRouter><NotificationPopover /></MemoryRouter>);

const openPopover = () =>
    fireEvent.click(screen.getByLabelText('Notifications'));

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('NotificationPopover', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDefaultMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Trigger button ────────────────────────────────────────────────────────
    it('renders the bell trigger button', () => {
        renderPopover();
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    it('shows the unread badge when unreadCount > 0', () => {
        renderPopover();
        expect(document.querySelector('.notification-badge')).toBeInTheDocument();
    });

    it('hides the badge when unreadCount is 0', () => {
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: mockGrouped,
            unreadCount: 0,
        });
        renderPopover();
        expect(document.querySelector('.notification-badge')).not.toBeInTheDocument();
    });

    // ── Popover content ───────────────────────────────────────────────────────
    it('opens popover on bell click and shows "Notifications" heading', () => {
        renderPopover();
        openPopover();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('renders grouped date labels', () => {
        renderPopover();
        openPopover();
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('Older')).toBeInTheDocument();
    });

    it('renders notification messages via getMessage', () => {
        renderPopover();
        openPopover();
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
        expect(screen.getByText('Notification 2')).toBeInTheDocument();
    });

    it('shows "No notifications" when groupedNotifications is empty', () => {
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: [],
            unreadCount: 0,
        });
        renderPopover();
        openPopover();
        expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    // ── Delete All ────────────────────────────────────────────────────────────
    it('shows Delete All button only on the first group', () => {
        renderPopover();
        openPopover();
        expect(screen.getAllByText('Delete All')).toHaveLength(1);
    });

    it('calls deleteAll with visible notifications when Delete All is clicked', async () => {
        renderPopover();
        openPopover();
        fireEvent.click(screen.getByText('Delete All'));
        await waitFor(() => expect(mockDeleteAll).toHaveBeenCalledWith(mockNotifications.map(n => n)));
    });

    it('closes the popover after Delete All completes', async () => {
        renderPopover();
        openPopover();
        expect(screen.getByText('Notifications')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Delete All'));

        await waitFor(() =>
            expect(screen.queryByText('Notifications')).not.toBeInTheDocument(),
        );
    });

    it('calls refetch after a 1s delay following Delete All', async () => {
        vi.useFakeTimers();

        renderPopover();
        openPopover();

        const deleteAllButton = screen.getByText('Delete All');

        // act(async) flushes Promise microtasks so the async handler runs to completion
        // (deleteAll resolves -> setIsOpen(false) -> setTimeout scheduled) without
        // relying on setTimeout-based polling like waitFor does.
        await act(async () => {
            fireEvent.click(deleteAllButton);
        });

        expect(mockDeleteAll).toHaveBeenCalled();
        expect(mockRefetch).not.toHaveBeenCalled();

        // Advance fake clock to trigger the 1s setTimeout
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(mockRefetch).toHaveBeenCalled();
    });

    // ── Single delete ─────────────────────────────────────────────────────────
    it('calls deleteNotification with the full notification item when trash button is clicked', async () => {
        renderPopover();
        openPopover();

        const trashButtons = document.querySelectorAll('.notification-item-delete-btn');
        fireEvent.click(trashButtons[0]!);
        await waitFor(() => expect(mockDeleteNotification).toHaveBeenCalledWith(feed1));
    });

    it('does not trigger notification click when trash button is clicked', async () => {
        renderPopover();
        openPopover();

        const trashButtons = document.querySelectorAll('.notification-item-delete-btn');
        fireEvent.click(trashButtons[0]!);
        await waitFor(() => expect(mockDeleteNotification).toHaveBeenCalled());
        expect(mockMutateAsync).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // ── Notification click: mark as read ──────────────────────────────────────
    it('calls updateNotification when an unread notification is clicked', async () => {
        renderPopover();
        openPopover();

        const items = document.querySelectorAll('.notification-item');
        fireEvent.click(items[0]!);
        await waitFor(() =>
            expect(mockMutateAsync).toHaveBeenCalledWith({ ids: ['1'], userId: 'user-1' })
        );
    });

    it('does not call updateNotification when a read notification is clicked', async () => {
        const readFeed = makeFeed('r1', {
            status: 'read',
            action: {
                ...makeFeed('r1').action,
                additionalInfo: { contentURL: '/course/abc' },
            },
        });
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: [{ group: 'Today', items: [readFeed] }],
            unreadCount: 0,
        });
        vi.mocked(notificationHooks.useNotificationRead).mockReturnValue({
            notifications: [readFeed],
            refetch: mockRefetch,
            isLoading: false,
            error: null,
        });
        vi.mocked(notificationHooks.useNotificationDelete).mockReturnValue({
            deleteNotification: mockDeleteNotification,
            deleteAll: mockDeleteAll,
            filterDeleted: vi.fn((n: NotificationFeed[]) => n),
            deletedIds: new Set(),
        });

        renderPopover();
        openPopover();

        const items = document.querySelectorAll('.notification-item');
        fireEvent.click(items[0]!);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
        expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    // ── Notification click: navigation ────────────────────────────────────────
    it('navigates to /profile for certificateUpdate action type', async () => {
        const certFeed = makeFeed('cert1', {
            action: {
                ...makeFeed('cert1').action,
                type: 'certificateUpdate',
            },
        });
        vi.mocked(notificationHooks.useNotificationRead).mockReturnValue({
            notifications: [certFeed],
            refetch: mockRefetch,
            isLoading: false,
            error: null,
        });
        vi.mocked(notificationHooks.useNotificationDelete).mockReturnValue({
            deleteNotification: mockDeleteNotification,
            deleteAll: mockDeleteAll,
            filterDeleted: vi.fn((n: NotificationFeed[]) => n),
            deletedIds: new Set(),
        });
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: [{ group: 'Today', items: [certFeed] }],
            unreadCount: 1,
        });

        renderPopover();
        openPopover();

        await waitFor(() => expect(document.querySelector('.notification-item')).toBeInTheDocument());

        const items = document.querySelectorAll('.notification-item');
        fireEvent.click(items[0]!);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/profile'));
    });

    it('navigates to contentURL when present', async () => {
        const contentFeed = makeFeed('c1', {
            action: {
                ...makeFeed('c1').action,
                additionalInfo: { contentURL: '/course/123' },
            },
        });
        vi.mocked(notificationHooks.useNotificationRead).mockReturnValue({
            notifications: [contentFeed],
            refetch: mockRefetch,
            isLoading: false,
            error: null,
        });
        vi.mocked(notificationHooks.useNotificationDelete).mockReturnValue({
            deleteNotification: mockDeleteNotification,
            deleteAll: mockDeleteAll,
            filterDeleted: vi.fn((n: NotificationFeed[]) => n),
            deletedIds: new Set(),
        });
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: [{ group: 'Today', items: [contentFeed] }],
            unreadCount: 1,
        });

        renderPopover();
        openPopover();

        await waitFor(() => expect(document.querySelector('.notification-item')).toBeInTheDocument());

        const items = document.querySelectorAll('.notification-item');
        fireEvent.click(items[0]!);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/course/123'));
    });

    it('falls back to deepLink when contentURL is absent', async () => {
        const deepFeed = makeFeed('d1', {
            action: {
                ...makeFeed('d1').action,
                additionalInfo: { deepLink: '/deep/link/path' },
            },
        });
        vi.mocked(notificationHooks.useNotificationRead).mockReturnValue({
            notifications: [deepFeed],
            refetch: mockRefetch,
            isLoading: false,
            error: null,
        });
        vi.mocked(notificationHooks.useNotificationDelete).mockReturnValue({
            deleteNotification: mockDeleteNotification,
            deleteAll: mockDeleteAll,
            filterDeleted: vi.fn((n: NotificationFeed[]) => n),
            deletedIds: new Set(),
        });
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: [{ group: 'Today', items: [deepFeed] }],
            unreadCount: 1,
        });

        renderPopover();
        openPopover();

        await waitFor(() => expect(document.querySelector('.notification-item')).toBeInTheDocument());

        const items = document.querySelectorAll('.notification-item');
        fireEvent.click(items[0]!);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/deep/link/path'));
    });

    it('does not navigate when no url is available', async () => {
        const noUrlFeed = makeFeed('n1', {
            action: {
                ...makeFeed('n1').action,
                additionalInfo: {},
            },
        });
        vi.mocked(notificationHooks.useNotificationRead).mockReturnValue({
            notifications: [noUrlFeed],
            refetch: mockRefetch,
            isLoading: false,
            error: null,
        });
        vi.mocked(notificationHooks.useNotificationDelete).mockReturnValue({
            deleteNotification: mockDeleteNotification,
            deleteAll: mockDeleteAll,
            filterDeleted: vi.fn((n: NotificationFeed[]) => n),
            deletedIds: new Set(),
        });
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: [{ group: 'Today', items: [noUrlFeed] }],
            unreadCount: 1,
        });

        renderPopover();
        openPopover();

        await waitFor(() => expect(document.querySelector('.notification-item')).toBeInTheDocument());

        const items = document.querySelectorAll('.notification-item');
        fireEvent.click(items[0]!);
        await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('closes the popover after a notification is clicked', async () => {
        const contentFeed = makeFeed('c2', {
            action: {
                ...makeFeed('c2').action,
                additionalInfo: { contentURL: '/course/456' },
            },
        });
        vi.mocked(notificationHooks.useNotificationRead).mockReturnValue({
            notifications: [contentFeed],
            refetch: mockRefetch,
            isLoading: false,
            error: null,
        });
        vi.mocked(notificationHooks.useNotificationDelete).mockReturnValue({
            deleteNotification: mockDeleteNotification,
            deleteAll: mockDeleteAll,
            filterDeleted: vi.fn((n: NotificationFeed[]) => n),
            deletedIds: new Set(),
        });
        vi.mocked(notificationHooks.useNotificationGrouping).mockReturnValue({
            groupedNotifications: [{ group: 'Today', items: [contentFeed] }],
            unreadCount: 1,
        });

        renderPopover();
        openPopover();
        expect(screen.getByText('Notifications')).toBeInTheDocument();

        await waitFor(() => expect(document.querySelector('.notification-item')).toBeInTheDocument());

        const items = document.querySelectorAll('.notification-item');
        fireEvent.click(items[0]!);

        await waitFor(() =>
            expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
        );
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPopover } from './NotificationPopover';
import * as useNotificationModule from '@/hooks/useNotification';
import type { GroupedNotification } from '@/types/notificationTypes';

const makeFeed = (id: string, title: string, createdOn: string) => ({
    id,
    userId: 'user-1',
    category: 'group',
    priority: 1,
    status: 'unread' as const,
    createdOn,
    updatedOn: null,
    expireOn: null,
    updatedBy: null,
    createdBy: 'creator-1',
    version: null,
    action: {
        createdBy: { name: 'Creator', id: 'creator-1', type: 'user' },
        additionalInfo: {},
        type: 'group-activity-added',
        category: 'group',
        template: { ver: '4.3.0', data: JSON.stringify({ title }), type: 'JSON' },
    },
});

const mockGrouped: GroupedNotification[] = [
    {
        group: 'Today',
        items: [
            makeFeed('1', 'Course assigned to group', '2026-02-20T09:30:00Z'),
            makeFeed('2', 'Assignment added to module', '2026-02-20T08:35:00Z'),
        ],
    },
    {
        group: 'Older',
        items: [
            makeFeed('3', 'You were added to a group', '2026-01-13T09:18:56Z'),
        ],
    },
];

const mockHook = {
    groupedNotifications: mockGrouped,
    notifications: mockGrouped.flatMap(g => g.items),
    unreadCount: 3,
    isLoading: false,
    error: null,
    getTitle: (item: { action: { template: { data: string } } }) => {
        try { return JSON.parse(item.action.template.data).title; } catch { return ''; }
    },
    deleteNotification: vi.fn(),
    deleteAll: vi.fn(),
};

beforeEach(() => {
    vi.spyOn(useNotificationModule, 'useNotification').mockReturnValue(mockHook);
});

describe('NotificationPopover', () => {
    it('renders the bell trigger button', () => {
        render(<NotificationPopover />);
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    it('shows the unread badge when unreadCount > 0', () => {
        render(<NotificationPopover />);
        expect(document.querySelector('.notification-badge')).toBeInTheDocument();
    });

    it('hides the badge when there are no unread notifications', () => {
        vi.spyOn(useNotificationModule, 'useNotification').mockReturnValue({
            ...mockHook,
            unreadCount: 0,
        });
        render(<NotificationPopover />);
        expect(document.querySelector('.notification-badge')).not.toBeInTheDocument();
    });

    it('opens popover and shows grouped notifications', () => {
        render(<NotificationPopover />);
        fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('Older')).toBeInTheDocument();
        expect(screen.getByText('Course assigned to group')).toBeInTheDocument();
    });

    it('shows Delete All button only on first group', () => {
        render(<NotificationPopover />);
        fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
        const deleteAllButtons = screen.getAllByText('Delete All');
        expect(deleteAllButtons).toHaveLength(1);
    });

    it('calls deleteAll when Delete All is clicked', () => {
        render(<NotificationPopover />);
        fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
        fireEvent.click(screen.getByText('Delete All'));
        expect(mockHook.deleteAll).toHaveBeenCalled();
    });

    it('calls deleteNotification with correct id when trash button is clicked', () => {
        render(<NotificationPopover />);
        fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
        const trashButtons = screen.getAllByRole('button').filter(
            btn => btn.classList.contains('notification-item-delete-btn')
        );
        fireEvent.click(trashButtons[0]);
        expect(mockHook.deleteNotification).toHaveBeenCalledWith('1');
    });

    it('shows empty state when there are no notifications', () => {
        vi.spyOn(useNotificationModule, 'useNotification').mockReturnValue({
            ...mockHook,
            groupedNotifications: [],
            unreadCount: 0,
        });
        render(<NotificationPopover />);
        fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
        expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
});

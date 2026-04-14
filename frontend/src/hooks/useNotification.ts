import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation, UseMutationResult } from '@tanstack/react-query';
import { ApiResponse } from '../lib/http-client';
import { notificationService, getDateGroup, parseTemplateMessage } from '../services/NotificationService';
import { NotificationFeed, NotificationDateGroup, GroupedNotification } from '../types/notificationTypes';
import { useAuthInfo } from './useAuthInfo';

export interface UseNotificationReadReturn {
    notifications: NotificationFeed[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export const useNotificationRead = (): UseNotificationReadReturn => {
    const { data: authInfo } = useAuthInfo();
    const userId = authInfo?.uid ?? null;

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['notificationFeed', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID not available');

            const response = await notificationService.notificationsRead(userId);
            return response.data.feeds;
        },
        enabled: !!userId,
        retry: 1,
    });

    return {
        notifications: data ?? [],
        isLoading,
        error: error as Error | null,
        refetch,
    };
};

export const useNotificationUpdate = (): UseMutationResult<
    ApiResponse<unknown>,
    Error,
    { ids: string[]; userId: string }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ids, userId }: { ids: string[]; userId: string }) =>
            notificationService.notificationsUpdate(ids, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationFeed'] });
        },
    });
};

export const useNotificationDelete = () => {
    const queryClient = useQueryClient();
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

    const { mutateAsync: deleteApi } = useMutation({
        mutationFn: ({ ids, userId, category }: { ids: string[]; userId: string; category: string }) =>
            notificationService.notificationsDelete(ids, userId, category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationFeed'] });
        },
    });

    const deleteNotification = useCallback(async (notification: NotificationFeed): Promise<void> => {
        setDeletedIds(prev => new Set(prev).add(notification.id));
        await deleteApi({
            ids: [notification.id],
            userId: notification.userId,
            category: notification.action.category,
        });
    }, [deleteApi]);

    const deleteAll = useCallback(async (notifications: NotificationFeed[]): Promise<void> => {
        setDeletedIds(new Set(notifications.map(n => n.id)));

        // Group by (userId, action.category) → one API call per group
        const groups = new Map<string, { ids: string[]; userId: string; category: string }>();
        for (const n of notifications) {
            const key = `${n.userId}::${n.action.category}`;
            if (!groups.has(key)) {
                groups.set(key, { ids: [], userId: n.userId, category: n.action.category });
            }
            groups.get(key)!.ids.push(n.id);
        }

        await Promise.all([...groups.values()].map(g => deleteApi(g)));
    }, [deleteApi]);

    const filterDeleted = useCallback((notifications: NotificationFeed[]) => {
        return notifications.filter(n => !deletedIds.has(n.id));
    }, [deletedIds]);

    return {
        deleteNotification,
        deleteAll,
        filterDeleted,
        deletedIds,
    };
};

export const useNotificationGrouping = (notifications: NotificationFeed[]) => {
    const groupedNotifications: GroupedNotification[] = (['Today', 'Yesterday', 'Older'] as NotificationDateGroup[])
        .map(group => ({
            group,
            items: notifications.filter(n => getDateGroup(n.createdOn) === group),
        }))
        .filter(g => g.items.length > 0);

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    return {
        groupedNotifications,
        unreadCount,
    };
};

export const useNotificationMessage = () => {
    const getMessage = useCallback((feed: NotificationFeed): string => {
        return parseTemplateMessage(feed.action.template.data);
    }, []);

    return { getMessage };
};

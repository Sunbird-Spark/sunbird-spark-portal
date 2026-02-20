import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation, UseMutationResult } from '@tanstack/react-query';
import { ApiResponse } from '../lib/http-client';
import dayjs from 'dayjs';
import { notificationService } from '../services/NotificationService';
import { NotificationFeed, NotificationDateGroup, GroupedNotification } from '../types/notificationTypes';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const NOTIFICATION_QUERY_KEY = 'notificationFeed';

export interface UseNotificationReadReturn {
    notifications: NotificationFeed[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export const useNotificationRead = (): UseNotificationReadReturn => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: [NOTIFICATION_QUERY_KEY],
        queryFn: async () => {
            const userId = userAuthInfoService.getUserId() ??
                (await userAuthInfoService.getAuthInfo())?.uid;

            if (!userId) throw new Error('User ID not available');

            const response = await notificationService.notificationsRead(userId);
            return response.data.feeds;
        },
        retry: 1,
    });

    return {
        notifications: data ?? [],
        isLoading,
        error: error as Error | null,
        refetch,
    };
};

function getDateGroup(createdOn: string): NotificationDateGroup {
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');
    const date = dayjs(createdOn).startOf('day');

    if (date.isSame(today)) return 'Today';
    if (date.isSame(yesterday)) return 'Yesterday';
    return 'Older';
}

function parseTemplateMessage(templateData: string): string {
    try {
        const parsed = JSON.parse(templateData);
        return parsed.description ?? parsed.title ?? templateData;
    } catch {
        return templateData;
    }
}

export interface UseNotificationReturn {
    notifications: NotificationFeed[];
    groupedNotifications: GroupedNotification[];
    unreadCount: number;
    isLoading: boolean;
    error: Error | null;
    getMessage: (feed: NotificationFeed) => string;
    deleteNotification: (id: string) => void;
    deleteAll: () => void;
}

export const useNotificationUpdate = (): UseMutationResult<
    ApiResponse<unknown>,
    Error,
    { ids: string[]; userId: string }
> => {
    return useMutation({
        mutationFn: ({ ids, userId }: { ids: string[]; userId: string }) =>
            notificationService.notificationsUpdate(ids, userId),
    });
};

export const useNotificationDelete = (): UseMutationResult<
    ApiResponse<unknown>,
    Error,
    { ids: string[]; userId: string; category: string }
> => {
    return useMutation({
        mutationFn: ({ ids, userId, category }: { ids: string[]; userId: string; category: string }) =>
            notificationService.notificationsDelete(ids, userId, category),
    });
};

export const useNotification = (): UseNotificationReturn => {
    const queryClient = useQueryClient();
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const { notifications: allNotifications, isLoading, error } = useNotificationRead();
    const notifications = allNotifications.filter(n => !deletedIds.has(n.id));

    const groupedNotifications: GroupedNotification[] = (['Today', 'Yesterday', 'Older'] as NotificationDateGroup[])
        .map(group => ({
            group,
            items: notifications.filter(n => getDateGroup(n.createdOn) === group),
        }))
        .filter(g => g.items.length > 0);

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    const getMessage = useCallback((feed: NotificationFeed): string => {
        return parseTemplateMessage(feed.action.template.data);
    }, []);

    const deleteNotification = useCallback((id: string) => {
        setDeletedIds(prev => new Set(prev).add(id));
    }, []);

    const deleteAll = useCallback(() => {
        const currentIds = (queryClient.getQueryData<NotificationFeed[]>([NOTIFICATION_QUERY_KEY]) ?? [])
            .map(n => n.id);
        setDeletedIds(new Set(currentIds));
    }, [queryClient]);

    return {
        notifications,
        groupedNotifications,
        unreadCount,
        isLoading,
        error: error as Error | null,
        getMessage,
        deleteNotification,
        deleteAll,
    };
};

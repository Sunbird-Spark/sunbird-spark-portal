import { getClient, ApiResponse } from '../lib/http-client';
import { NotificationFeedResponse, NotificationUpdateRequest, NotificationDeleteRequest, NotificationDateGroup } from '../types/notificationTypes';
import dayjs from 'dayjs';

export function getDateGroup(createdOn: string): NotificationDateGroup {
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');
    const date = dayjs(createdOn).startOf('day');

    if (date.isSame(today)) return 'Today';
    if (date.isSame(yesterday)) return 'Yesterday';
    return 'Older';
}

export function parseTemplateMessage(templateData: string): string {
    try {
        const parsed = JSON.parse(templateData);
        return parsed.description ?? parsed.title ?? templateData;
    } catch {
        return templateData;
    }
}

export class NotificationService {
    async notificationsRead(userId: string): Promise<ApiResponse<NotificationFeedResponse>> {
        return getClient().get<NotificationFeedResponse>(
            `/notification/v1/feed/read/${userId}`
        );
    }

    async notificationsUpdate(ids: string[], userId: string): Promise<ApiResponse<unknown>> {
        const body: NotificationUpdateRequest = {
            request: { ids, userId },
        };
        return getClient().patch<unknown>(`/notification/v1/feed/update`, body);
    }

    async notificationsDelete(ids: string[], userId: string, category: string): Promise<ApiResponse<unknown>> {
        const body: NotificationDeleteRequest = {
            request: { ids, userId, category },
        };
        return getClient().post<unknown>(`/notification/v1/feed/delete`, body);
    }
}

export const notificationService = new NotificationService();

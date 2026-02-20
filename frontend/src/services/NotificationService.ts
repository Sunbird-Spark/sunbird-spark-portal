import { getClient, ApiResponse } from '../lib/http-client';
import { NotificationFeedResponse, NotificationUpdateRequest, NotificationDeleteRequest } from '../types/notificationTypes';

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

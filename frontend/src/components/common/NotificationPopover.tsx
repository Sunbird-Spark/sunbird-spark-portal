import * as Popover from "@radix-ui/react-popover";
import { FiBell, FiTrash2 } from "react-icons/fi";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    useNotificationRead,
    useNotificationDelete,
    useNotificationGrouping,
    useNotificationMessage,
    useNotificationUpdate
} from "@/hooks/useNotification";
import { NotificationFeed } from "@/types/notificationTypes";
import dayjs from "dayjs";

export const NotificationPopover = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications: allNotifications, refetch } = useNotificationRead();
    const { deleteNotification, deleteAll, filterDeleted } = useNotificationDelete();
    const { getMessage } = useNotificationMessage();
    const { mutateAsync: updateNotification } = useNotificationUpdate();
    const navigate = useNavigate();

    const notifications = filterDeleted(allNotifications);
    const { groupedNotifications, unreadCount } = useNotificationGrouping(notifications);
    const hasNotifications = groupedNotifications.length > 0;

    const formatTimestamp = (timestamp: string) => {
        return dayjs(timestamp).format('ddd, DD MMMM, hh:mm a');
    };

    // ── Notification click ──────────────────────────────────────────────────
    const handleNotificationClick = useCallback(async (item: NotificationFeed) => {
        if (item.status === 'unread') {
            try {
                await updateNotification({ ids: [item.id], userId: item.userId });
                // onSuccess in useNotificationUpdate already refetches the list
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
                // skip update, proceed to navigate
            }
        }

        setIsOpen(false);

        if (item.action.type === 'certificateUpdate') {
            navigate('/profile');
        } else {
            const url = item.action.additionalInfo.contentURL ?? item.action.additionalInfo.deepLink;
            if (url) navigate(url);
        }
    }, [updateNotification, navigate]);

    // ── Single delete ───────────────────────────────────────────────────────
    const handleDeleteClick = useCallback(async (e: React.MouseEvent, item: NotificationFeed) => {
        e.stopPropagation();
        try {
            await deleteNotification(item);
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    }, [deleteNotification]);

    // ── Clear all ───────────────────────────────────────────────────────────
    const handleDeleteAll = useCallback(async () => {
        try {
            await deleteAll(notifications);
        } catch (err) {
            console.error('Failed to delete all notifications:', err);
        }
        setIsOpen(false);
        setTimeout(() => refetch(), 1000);
    }, [deleteAll, notifications, refetch]);

    return (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
                <button className="profile-action-btn relative" aria-label="Notifications">
                    <FiBell className="profile-action-icon" aria-hidden="true" />
                    {unreadCount > 0 && (
                        <span className="notification-badge"></span>
                    )}
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    collisionPadding={8}
                    className="notification-popover-content"
                >
                    <Popover.Arrow className="notification-popover-arrow" width={24} height={18} />
                    <div className="notification-popover-header">
                        <h3 className="notification-popover-title">Notifications</h3>
                    </div>
                    <div className="notification-list">
                        {!hasNotifications ? (
                            <div className="notification-empty">
                                No notifications
                            </div>
                        ) : (
                            groupedNotifications.map((g, index) => (
                                <div key={g.group}>
                                    <div className="notification-group-label-wrapper">
                                        <span className="notification-group-label">{g.group}</span>
                                        {index === 0 && (
                                            <button onClick={handleDeleteAll} className="notification-delete-all-btn">
                                                Delete All
                                            </button>
                                        )}
                                    </div>
                                    {g.items.map(item => (
                                        <div
                                            key={item.id}
                                            className="notification-item cursor-pointer"
                                            onClick={() => handleNotificationClick(item)}
                                        >
                                            <div className="notification-item-body">
                                                <p className="notification-item-message">{getMessage(item)}</p>
                                                <p className="notification-item-timestamp">{formatTimestamp(item.createdOn)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, item)}
                                                className="notification-item-delete-btn"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

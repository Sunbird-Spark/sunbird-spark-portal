import * as Popover from "@radix-ui/react-popover";
import { FiBell, FiTrash2 } from "react-icons/fi";
import { useNotification } from "@/hooks/useNotification";
import dayjs from "dayjs";

export const NotificationPopover = () => {
    const { groupedNotifications, unreadCount, getMessage, deleteNotification, deleteAll } = useNotification();
    const hasNotifications = groupedNotifications.length > 0;

    const formatTimestamp = (timestamp: string) => {
        return dayjs(timestamp).format('ddd, DD MMMM, hh:mm a');
    };

    return (
        <Popover.Root>
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
                                            <button onClick={deleteAll} className="notification-delete-all-btn">
                                                Delete All
                                            </button>
                                        )}
                                    </div>
                                    {g.items.map(item => (
                                        <div key={item.id} className="notification-item">
                                            <div className="notification-item-body">
                                                <p className="notification-item-message">{getMessage(item)}</p>
                                                <p className="notification-item-timestamp">{formatTimestamp(item.createdOn)}</p>
                                            </div>
                                            <button
                                                onClick={() => deleteNotification(item.id)}
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

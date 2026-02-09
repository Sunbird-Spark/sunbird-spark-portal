import { FiBell, FiX, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/popover";

interface Notification {
  id: string;
  message: string;
  date: string;
}

interface NotificationPopoverProps {
  notifications: Notification[];
  onDelete: (id: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
}

export const NotificationPopover = ({
  notifications,
  onDelete,
  isOpen,
  onOpenChange,
  isMobile = false,
}: NotificationPopoverProps) => {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <FiBell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span
              className={`absolute -top-1 -right-1 ${isMobile ? "w-4 h-4 text-[0.625rem]" : "w-5 h-5 text-xs"
                } bg-destructive text-destructive-foreground rounded-full flex items-center justify-center`}
            >
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={`${isMobile ? "w-80 p-0" : "w-96 p-0"
          } bg-muted/95 border-border shadow-lg`}
      >
        <div className={isMobile ? "p-3" : "p-4"}>
          {!isMobile && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {notifications.length} New Notification(s)
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onOpenChange?.(false)}
              >
                <FiX className="w-4 h-4" />
              </Button>
            </div>
          )}
          {isMobile && (
            <h3 className="font-semibold text-foreground text-sm mb-3">
              {notifications.length} New Notification(s)
            </h3>
          )}
          <div
            className={`space-y-${isMobile ? "2" : "3"} max-h-${isMobile ? "64" : "80"
              } overflow-y-auto`}
          >
            {notifications.length === 0 ? (
              <p
                className={`text-muted-foreground ${isMobile ? "text-xs py-3" : "text-sm py-4"
                  } text-center`}
              >
                No new notifications
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-card ${isMobile ? "p-3" : "p-4"
                    } rounded-lg border border-border`}
                >
                  <p
                    className={`${isMobile ? "text-xs" : "text-xs"
                      } text-muted-foreground mb-1`}
                  >
                    {notification.date}
                  </p>
                  <p
                    className={`${isMobile ? "text-xs" : "text-sm"
                      } text-foreground`}
                  >
                    {notification.message}
                  </p>
                  <div className={`flex justify-end ${isMobile ? "mt-1" : "mt-2"}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${isMobile ? "h-6 w-6" : "h-8 w-8"
                        } text-destructive hover:text-destructive hover:bg-destructive/10`}
                      onClick={() => onDelete(notification.id)}
                    >
                      <FiTrash2 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

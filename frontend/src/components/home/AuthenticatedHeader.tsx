import { useState } from "react";
import { FiSearch, FiBell, FiChevronDown, FiTrash2 } from "react-icons/fi";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import * as Popover from "@radix-ui/react-popover";
import { useAppI18n, LanguageCode } from "@/hooks/useAppI18n";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchModal from "@/components/common/SearchModal";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";

interface Notification {
    id: string;
    message: string;
    timestamp: string;
    group: "Today" | "Yesterday" | "Older";
}

const initialNotifications: Notification[] = [
    { id: "1", message: "New course has been assigned to group 1 by the book reviewer.", timestamp: "Sun, 08 February, 09:30 am", group: "Today" },
    { id: "2", message: "An assignment has been added to course module 1.", timestamp: "Sun, 08 February, 08:35 am", group: "Today" },
    { id: "3", message: "New course has been assigned to group 1 by the book reviewer.", timestamp: "Sat, 07 February, 16:30 pm", group: "Yesterday" },
    { id: "4", message: "An assignment has been added to course module 1.", timestamp: "Sat, 07 February, 10:30 am", group: "Yesterday" },
    { id: "5", message: "An assignment has been added to course module 1.", timestamp: "Fri, 06 February, 11:45 am", group: "Older" },
];

interface AuthenticatedHeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const AuthenticatedHeader = ({ isSidebarOpen, onToggleSidebar }: AuthenticatedHeaderProps) => {
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const handleDeleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleDeleteAll = () => {
        setNotifications([]);
    };

    const groups: Array<"Today" | "Yesterday" | "Older"> = ["Today", "Yesterday", "Older"];

    return (
        <header className={`profile-header ${isMobile ? 'mobile' : ''}`}>
            <div className="profile-header-container">
                {/* Left: Sunbird Logo + Sidebar Toggle */}
                <div className={`profile-logo-container ${!isMobile && isSidebarOpen ? 'w-[13.25rem]' : 'w-auto'} ${isMobile ? 'pl-0' : 'pl-[1.875rem]'} transition-all duration-300`}>
                    {!isMobile && (
                        <div className="w-full h-full flex items-center">
                            <img
                                src={sunbirdLogo}
                                alt="Sunbird"
                                className="h-[2.4375rem] w-auto"
                                style={{ height: '2.4375rem' }}
                            />
                        </div>
                    )}
                    {/* Sidebar Toggle - Mobile */}
                    {isMobile && (
                        <button
                            onClick={onToggleSidebar}
                            className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors p-1"
                            aria-label="Open Menu"
                        >
                            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M1 1H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M1 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M1 13H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Right: Search + Notifications + Language */}
                <div className="profile-header-actions">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="profile-action-btn"
                        aria-label="Search"
                    >
                        <FiSearch className="profile-action-icon" aria-hidden="true" />
                    </button>

                    {/* Notifications */}
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className="profile-action-btn relative" aria-label="Notifications">
                                <FiBell className="profile-action-icon" aria-hidden="true" />
                                {notifications.length > 0 && (
                                    <span className="notification-badge"></span>
                                )}
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                        <Popover.Content
                            side="bottom"
                            align="end"
                            sideOffset={8}
                            className="notification-popover-content"
                        >
                            <Popover.Arrow className="notification-popover-arrow" width={24} height={18} />
                            <div className="notification-popover-header">
                                <h3 className="notification-popover-title">Notifications</h3>
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="notification-empty">
                                        No notifications
                                    </div>
                                ) : (
                                    groups.map((group, index) => {
                                        const items = notifications.filter(n => n.group === group);
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={group}>
                                                <div className="notification-group-label-wrapper">
                                                    <span className="notification-group-label">{group}</span>
                                                    {index === 0 && notifications.length > 0 && (
                                                        <button onClick={handleDeleteAll} className="notification-delete-all-btn">
                                                            Delete All
                                                        </button>
                                                    )}
                                                </div>
                                                {items.map(item => (
                                                    <div key={item.id} className="notification-item">
                                                        <div className="notification-item-body">
                                                            <p className="notification-item-message">{item.message}</p>
                                                            <p className="notification-item-timestamp">{item.timestamp}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteNotification(item.id)}
                                                            className="notification-item-delete-btn"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>

                    {/* Language Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="profile-lang-btn">
                                <img src={translationIcon} alt="Language" className="profile-action-icon" />
                                <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="profile-dropdown-content w-40">
                            {languages.map((lng) => (
                                <DropdownMenuItem
                                    key={lng.code}
                                    className={`profile-dropdown-item ${currentCode === lng.code ? 'active' : ''}`}
                                    onSelect={() => changeLanguage(lng.code as LanguageCode)}
                                >
                                    <span>{lng.label}</span>
                                    {currentCode === lng.code && (
                                        <div className="profile-dropdown-indicator" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    );
};

export default AuthenticatedHeader;

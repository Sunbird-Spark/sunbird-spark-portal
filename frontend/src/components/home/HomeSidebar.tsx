import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUser, FiLogOut, FiEdit, FiUsers, FiBarChart2, FiPieChart } from "react-icons/fi";
import { GoHomeFill } from "react-icons/go";
import SidebarCloseButton from "@/components/common/SidebarCloseButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/usePermission";
import type { Feature } from "@/services/PermissionService";
import { useAppI18n } from "@/hooks/useAppI18n";
import { clearForceSyncUsed } from "@/services/forceSyncStorage";
import {
    ExploreIcon,
    HelpSupportIcon,
    HelpSupportIconFill,
    MyLearningIcon,
    MyLearningIconFill,
    WorkspaceIconFill,
    ProfileIconFill,
    UserReportIconFill,
    UsersIconFill,
    BarChartIconFill,
} from "./HomeSidebarIcons";

interface HomeSidebarProps {
    activeNav: string;
    onNavChange: (nav: string) => void;
    collapsed?: boolean;
    onToggle?: () => void;
}

const NAV_ITEM_DEFS: { id: string; labelKey: string; icon: React.ElementType; path: string; feature?: Feature }[] = [
    { id: "home", labelKey: "sidebar.home", icon: FiHome, path: "/home" },
    { id: "learning", labelKey: "sidebar.myLearning", icon: MyLearningIcon, path: "/my-learning" },
    { id: "explore", labelKey: "sidebar.explore", icon: ExploreIcon, path: "/explore" },
    { id: "workspace", labelKey: "sidebar.workspace", icon: FiEdit, path: "/workspace", feature: "view_workspace" },
    { id: "profile", labelKey: "sidebar.profile", icon: FiUser, path: "/profile" },
    { id: "user-report", labelKey: "sidebar.userReport", icon: FiPieChart, path: "/reports/user/me" },
];

const BOTTOM_NAV_DEFS = [
    { id: "help", labelKey: "sidebar.helpAndSupport", icon: HelpSupportIcon, path: "/help-support" },
    { id: "logout", labelKey: "sidebar.logout", icon: FiLogOut, path: "/portal/logout" },
];

const FILLED_ICONS: Record<string, React.ElementType | undefined> = {
    home: GoHomeFill,
    learning: MyLearningIconFill,
    profile: ProfileIconFill,
    workspace: WorkspaceIconFill,
    "user-report": UserReportIconFill,
    "user-management": UsersIconFill,
    "admin-reports": BarChartIconFill,
    help: HelpSupportIconFill,
};

const HomeSidebar = ({ activeNav, onNavChange, collapsed = false, onToggle }: HomeSidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const { isAuthenticated, isLoading, hasAnyRole, canAccessFeature } = usePermissions();
    const { t } = useAppI18n();

    const mainNavItems = NAV_ITEM_DEFS.map(item => ({ ...item, label: t(item.labelKey) }));
    const bottomNavItems = BOTTOM_NAV_DEFS.map(item => ({ ...item, label: t(item.labelKey) }));
    const isAdmin = hasAnyRole(['ORG_ADMIN']);

    if (isLoading || !isAuthenticated || location.pathname === "/") {
        return null;
    }

    const dynamicMainNavItems = [
        ...mainNavItems,
        ...(isAdmin
            ? [
                { id: "user-management", labelKey: "sidebar.userManagement", label: t("sidebar.userManagement"), icon: FiUsers, path: "/user-management" },
                { id: "admin-reports", labelKey: "sidebar.adminReports", label: t("sidebar.adminReports"), icon: FiBarChart2, path: "/reports/platform" },
              ]
            : []),
    ];

    const handleNavClick = (item: typeof mainNavItems[0]) => {
        onNavChange(item.id);
        if (item.id === "logout") {
            clearForceSyncUsed();
            window.location.href = item.path;
            return;
        }
        if (location.pathname !== item.path) {
            navigate(item.path);
        }
    };

    const renderNavList = (items: typeof mainNavItems) => (
        <ul className="space-y-1">
            {items.map((item) => {
                const isActive = activeNav === item.id;
                const FilledIcon = FILLED_ICONS[item.id];
                const Icon = isActive && FilledIcon ? FilledIcon : item.icon;

                const listItem = (
                    <li>
                        <button
                            onClick={() => handleNavClick(item)}
                            className={`
                                w-full flex items-center transition-all
                                ${collapsed ? 'justify-center px-2 py-4' : 'gap-3 px-6 py-4'}
                                ${isActive
                                    ? "text-sunbird-brick font-normal shadow-sunbird-sm"
                                    : "text-sunbird-obsidian font-normal hover:bg-gray-50 hover:shadow-sunbird-sm"
                                }
                            `}
                            title={collapsed ? item.label : undefined}
                            data-edataid={`nav-${item.id}`}
                            data-pageid="sidebar"
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-sunbird-brick" : "text-sunbird-ginger"}`} />
                            {!collapsed && <span className="text-[1.125rem] whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                        </button>
                    </li>
                );

                if (item.feature && !canAccessFeature(item.feature)) return null;

                return (
                    <React.Fragment key={item.id}>
                        {listItem}
                    </React.Fragment>
                );
            })}
        </ul>
    );

    return (
        <aside
            data-testid="home-sidebar"
            className={`
                bg-white flex flex-col shrink-0 z-20 relative h-full md:h-[calc(100vh-4.5rem)] transition-all duration-300
                 ${collapsed ? 'w-[5rem]' : 'w-full md:w-[15.125rem]'}
            `}
            style={{
                boxShadow: 'var(--sunbird-shadow-md)'
            }}
        >
            <nav className="flex flex-col justify-between h-full pt-[1.875rem] pb-4">
                {/* Main Nav (Top) */}
                {renderNavList(dynamicMainNavItems)}

                {/* Bottom Nav (Bottom) */}
                {renderNavList(bottomNavItems)}
            </nav>

            {!isMobile && onToggle && (
                <SidebarCloseButton
                    onClick={onToggle}
                    collapsed={collapsed}
                />
            )}
        </aside>
    );
};

export default HomeSidebar;

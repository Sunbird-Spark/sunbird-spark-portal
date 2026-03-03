import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUser, FiLogOut, FiEdit, FiUsers, FiBarChart2, FiPieChart } from "react-icons/fi";
import { GoHomeFill } from "react-icons/go";
import SidebarCloseButton from "@/components/common/SidebarCloseButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/usePermission";
import type { Feature } from "@/services/PermissionService";
import { useAppI18n } from "@/hooks/useAppI18n";
interface HomeSidebarProps {
    activeNav: string;
    onNavChange: (nav: string) => void;
    collapsed?: boolean;
    onToggle?: () => void;
}

// Custom Explore icon matching the design
const ExploreIcon = ({ className }: { className?: string }) => (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M11.1424 6.85705C13.0359 6.85705 14.5709 5.32205 14.5709 3.42852C14.5709 1.535 13.0359 0 11.1424 0C9.24887 0 7.71387 1.535 7.71387 3.42852C7.71387 5.32205 9.24887 6.85705 11.1424 6.85705Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M9.42844 3.42911C9.42844 2.48626 10.1956 1.71484 11.1427 1.71484C12.0898 1.71484 12.857 2.48626 12.857 3.42911H9.42844ZM5.99992 3.42911C5.99992 2.82911 6.10278 2.25484 6.2922 1.71484H0.857131C0.383738 1.71484 0 2.10055 0 2.57197C0 3.0434 0.383738 3.42911 0.857131 3.42911H5.99992ZM6.68819 6.0005C7.0859 6.6862 7.63875 7.27762 8.29874 7.71476H0.857131C0.383738 7.71476 0 7.32905 0 6.85763C0 6.38621 0.383738 6.0005 0.857131 6.0005H6.68819ZM0.857131 10.2862C0.383738 10.2862 0 10.6719 0 11.1433C0 11.6147 0.383738 12.0004 0.857131 12.0004H12.857C13.3301 12.0004 13.7141 11.6147 13.7141 11.1433C13.7141 10.6719 13.3301 10.2862 12.857 10.2862H0.857131Z" fill="currentColor" />
    </svg>
);

// Custom Help and Support icon matching the design
const HelpSupportIcon = ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M14.75 7.75C14.75 4.45038 14.75 2.80012 13.7262 1.7755C12.7025 0.749997 11.0487 0.75 7.75 0.75C4.45125 0.75 2.79754 0.749997 1.77379 1.7755C0.750038 2.80012 0.75 4.45038 0.75 7.75V13C0.75 13.8251 0.750034 14.2373 1.00378 14.4936C1.26628 14.75 1.6775 14.75 2.5 14.75H7.75C11.0487 14.75 12.7025 14.75 13.7262 13.7245C14.75 12.6999 14.75 11.0496 14.75 7.75Z" className="stroke-sunbird-ginger" strokeWidth="1.5" />
        <path d="M5.125 6H10.375" className="stroke-sunbird-ginger" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.125 9.5H7.75" className="stroke-sunbird-ginger" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Custom My Learning icon matching the design
const MyLearningIcon = ({ className }: { className?: string }) => (
    <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M2.41667 11.5833H5.75C7.13333 11.5833 8.25 12.7025 8.25 14.0833V5.75C8.25 3.39333 8.25 2.21416 7.51666 1.4825C6.78333 0.749998 5.60833 0.75 3.25 0.75H2.41667C1.63333 0.75 1.2417 0.749999 0.991699 0.994166C0.750033 1.23833 0.75 1.63083 0.75 2.41667V9.91667C0.75 10.7025 0.750033 11.095 0.991699 11.3392C1.2417 11.5833 1.63333 11.5833 2.41667 11.5833Z" className="stroke-sunbird-ginger" strokeWidth="1.5" />
        <path d="M14.0833 11.5833H10.75C9.36667 11.5833 8.25 12.7025 8.25 14.0833V5.75C8.25 3.39333 8.25 2.21416 8.98334 1.4825C9.71667 0.749998 10.8917 0.75 13.25 0.75H14.0833C14.8667 0.75 15.2583 0.749999 15.5083 0.994166C15.75 1.23833 15.75 1.63083 15.75 2.41667V9.91667C15.75 10.7025 15.75 11.095 15.5083 11.3392C15.2583 11.5833 14.8667 11.5833 14.0833 11.5833Z" className="stroke-sunbird-ginger" strokeWidth="1.5" />
    </svg>
);

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
                let Icon = item.icon;

                // Conditional Icon Logic
                if (item.id === "home" && isActive) {
                    Icon = GoHomeFill;
                }

                const listItem = (
                    <li>
                        <button
                            onClick={() => handleNavClick(item)}
                            className={`
                                w-full flex items-center transition-colors
                                ${collapsed ? 'justify-center px-2 py-4' : 'gap-3 px-6 py-4'}
                                ${isActive
                                    ? "text-sunbird-brick font-normal"
                                    : "text-sunbird-obsidian font-normal hover:bg-gray-50"
                                }
                            `}
                            title={collapsed ? item.label : undefined}
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
                ${collapsed ? 'w-[5rem]' : 'w-[15.125rem]'}
            `}
            style={{
                boxShadow: '0.125rem 0.125rem 1.25rem 0 rgba(0, 0, 0, 0.09)'
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
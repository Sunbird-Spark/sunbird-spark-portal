import { useState } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { useAppI18n, LanguageCode } from "@/hooks/useAppI18n";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchModal from "@/components/common/SearchModal";
import { NotificationPopover } from "@/components/common/NotificationPopover";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";

interface AuthenticatedHeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const AuthenticatedHeader = ({ isSidebarOpen, onToggleSidebar }: AuthenticatedHeaderProps) => {
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <header className={`profile-header ${isMobile ? 'mobile' : ''}`}>
            <div className="profile-header-container">
                {/* Left: Sunbird Logo + Sidebar Toggle */}
                <div className={`profile-logo-container ${!isMobile && isSidebarOpen ? 'w-[13.25rem]' : 'w-auto'} ${isMobile ? 'pl-0' : 'pl-[1.875rem]'} transition-all duration-300`}>
                    {!isMobile && (
                        <div className="w-full h-full flex items-center">
                            <img
                                src={sunbirdLogo}
                                alt={t("onboarding.altSunbird")}
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
                            aria-label={t("homeComponents.openMenu")}
                            data-edataid="mobile-sidebar-toggle"
                            data-pageid="header"
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
                        aria-label={t("header.search")}
                        data-edataid="search-btn"
                        data-edatatype="CLICK"
                    >
                        <FiSearch className="profile-action-icon" aria-hidden="true" />
                    </button>

                    {/* Notifications */}
                    <NotificationPopover />

                    {/* Language Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="profile-lang-btn" data-edataid="language-dropdown-btn" data-edatatype="CLICK">
                                <img src={translationIcon} alt={t("changeLanguage")} className="profile-action-icon" />
                                <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="profile-dropdown-content w-40">
                            {languages.map((lng) => (
                                <DropdownMenuItem
                                    key={lng.code}
                                    className={`profile-dropdown-item ${currentCode === lng.code ? 'active' : ''}`}
                                    onSelect={() => changeLanguage(lng.code as LanguageCode)}
                                    data-edataid={`lang-select-${lng.code}`}
                                    data-edatatype="CLICK"
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

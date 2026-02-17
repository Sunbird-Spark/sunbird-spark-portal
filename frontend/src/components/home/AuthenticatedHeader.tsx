import { FiSearch, FiBell, FiChevronDown } from "react-icons/fi";
import { Input } from "@/components/common/Input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { useNavigate } from "react-router-dom";
import { useAppI18n, LanguageCode } from "@/hooks/useAppI18n";
import { useIsMobile } from "@/hooks/use-mobile";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";

interface AuthenticatedHeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const AuthenticatedHeader = ({ isSidebarOpen, onToggleSidebar }: AuthenticatedHeaderProps) => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();

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
                    {isMobile ? (
                        <button
                            onClick={() => navigate('/search')}
                            className="profile-search-btn-mobile"
                            aria-label="Search"
                        >
                            <FiSearch className="h-5 w-5" />
                        </button>
                    ) : (
                        <div
                            className="profile-search-container"
                            onClick={() => navigate('/search')}
                        >
                            <Input
                                placeholder={t("header.search")}
                                readOnly
                                className="pl-4 pr-10 bg-white border-border focus:border-sunbird-ginger focus:ring-sunbird-ginger/20 rounded-[0.5625rem] h-[2.875rem] text-base cursor-pointer placeholder:text-sunbird-obsidian pointer-events-none"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-brick hover:text-sunbird-brick/80">
                                <FiSearch className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Notifications */}
                    <button className="profile-action-btn" aria-label="Notifications">
                        <FiBell className="profile-action-icon" aria-hidden="true" />
                    </button>

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
        </header>
    );
};

export default AuthenticatedHeader;

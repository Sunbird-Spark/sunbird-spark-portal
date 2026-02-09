import { useState, useEffect } from "react";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMenu, FiChevronDown, FiChevronLeft, FiUser, FiLogOut } from "react-icons/fi";
import { Input } from "@/components/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/sheet";
import PageLoader from "@/components/PageLoader";
import Footer from "@/components/Footer";
import { useAppI18n } from "@/hooks/useAppI18n";
import { LanguageConfig } from "@/configs/languages";
import HomeSidebar from "@/components/HomeSidebar";
import ProfileCard from "@/components/profile/ProfileCard"
import PersonalInformation from "@/components/profile/PersonalInformation"
import ProfileLearningList from "@/components/profile/ProfileLearningList"
import ProfileStatsCards from "@/components/profile/ProfileStatsCards";
import { useIsMobile } from "@/hooks/use-mobile";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";
import "./profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();
    const [isLoading, setIsLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("profile");
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const handleLanguageChange = (lang: LanguageConfig) => changeLanguage(lang.code);

    if (isLoading) {
        return <PageLoader message="Loading your profile..." />;
    }

    return (
        <div className="profile-container">
            {/* Top Header */}
            <header className={`profile-header ${isMobile ? 'mobile' : ''}`}>
                <div className="profile-header-container">
                    {/* Left: Sunbird Logo + Align with Sidebar */}
                    <div className={`profile-logo-container ${!isMobile && isSidebarOpen ? 'w-[13.25rem]' : 'w-auto'} ${isMobile ? 'pl-0' : 'pl-[1.875rem]'}`}>
                        {!isMobile && isSidebarOpen && (
                            <div className="w-full">
                                <img
                                    src={sunbirdLogo}
                                    alt="Sunbird"
                                    className="h-[2.4375rem] w-auto"
                                    style={{ height: '2.4375rem' }}
                                />
                            </div>
                        )}
                        {/* Sidebar Toggle */}
                        {isMobile ? (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="sidebar-toggle-btn"
                                aria-label="Open Menu"
                            >
                                <FiMenu className="w-5 h-3.5" />
                            </button>
                        ) : (
                            !isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="sidebar-toggle-btn"
                                >
                                    <FiMenu className="w-5 h-3.5" />
                                </button>
                            )
                        )}
                    </div>

                    {/* Right: Search + Language */}
                    <div className="profile-header-actions">
                        {isMobile ? (
                            <button
                                onClick={() => navigate('/search')}
                                className="profile-search-btn-mobile"
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
                                    className="pl-4 pr-10 bg-white border-border focus:border-sunbird-ginger focus:ring-sunbird-ginger/20 rounded-[0.5625rem] h-[2.875rem] text-base cursor-pointer placeholder:text-[#222222] pointer-events-none"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-ginger hover:text-sunbird-brick">
                                    <FiSearch className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {/* Notifications */}
                        <button className="profile-action-btn">
                            <FiBell className="profile-action-icon" />
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
                                        onClick={() => changeLanguage(lng.code as any)}
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

            <div className="flex flex-1 relative transition-all overflow-hidden">
                {/* Sidebar - Mobile */}
                {isMobile ? (
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <HomeSidebar
                                activeNav={activeNav}
                                onNavChange={(nav) => {
                                    setActiveNav(nav);
                                    setIsSidebarOpen(false);
                                }}
                            />
                        </SheetContent>
                    </Sheet>
                ) : (
                    /* Sidebar - Desktop */
                    <div className="relative shrink-0">
                        {isSidebarOpen && (
                            <>
                                <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} />
                                <div className="absolute -right-3 top-2 z-20">
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="w-6 h-6 bg-sunbird-gray-100 rounded-full flex items-center justify-center shadow-sm text-sunbird-brick hover:opacity-80 transition-opacity"
                                    >
                                        <FiChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Main Content Area */}
                <main className="profile-main-content">
                    <div className="profile-content-wrapper">
                        {/* Top Section: Profile Card + Personal Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-[23.3125rem_1fr] gap-6 mb-8">
                            {/* Left: Profile Card */}
                            <ProfileCard />

                            {/* Right: Personal Information */}
                            <PersonalInformation />
                        </div>

                        {/* Stats Cards Section */}
                        <ProfileStatsCards />

                        {/* My Learning Section */}
                        <ProfileLearningList />
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Profile;

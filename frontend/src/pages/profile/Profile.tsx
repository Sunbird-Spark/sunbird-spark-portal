import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMenu, FiChevronDown } from "react-icons/fi";
import { Input } from "@/components/common/Input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import { useAppI18n, LanguageCode } from "@/hooks/useAppI18n";
import HomeSidebar from "@/components/home/HomeSidebar";
import ProfileCard from "@/components/profile/ProfileCard";
import PersonalInformation from "@/components/profile/PersonalInformation";
import ProfileLearningList from "@/components/profile/ProfileLearningList";
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
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

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

            <div className="flex flex-1 relative transition-all">
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
                    <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
                        {isSidebarOpen && (
                            <>
                                <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} />
                                <div className="absolute -right-3 top-2 z-20">
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="w-6 h-6 bg-[#EFEFEF] rounded-full flex items-center justify-center shadow-sm text-sunbird-brick hover:opacity-80 transition-opacity"
                                    >
                                        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
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

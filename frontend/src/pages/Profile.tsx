import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMenu, FiChevronDown, FiChevronLeft } from "react-icons/fi";
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

    const handleLanguageChange = (lang: { code: string; label: string }) => changeLanguage(lang.code);

    if (isLoading) {
        return <PageLoader message="Loading your profile..." />;
    }

    return (
        <div className="profile-container">
            {/* Top Header */}
            <header className={isMobile ? "bg-white border-b border-gray-100 px-4 py-3 shadow-[0_0.125rem_0.625rem_rgba(0,0,0,0.05)] z-20 sticky top-0" : "bg-white border-b border-gray-100 px-6 py-4 shadow-[0_0.875rem_0.875rem_rgba(0,0,0,0.05)] z-10 sticky top-0 lg:pr-[6.25rem]"}>
                <div className="flex items-center justify-between">
                    {/* Left: Sunbird Logo + Align with Sidebar */}
                    <div
                        className={`flex items-center transition-all ${!isMobile && isSidebarOpen ? 'w-[13.25rem]' : 'w-auto'} ${isMobile ? 'pl-0' : 'pl-[1.875rem]'}`}
                    >
                        {isMobile ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="text-sunbird-ginger hover:text-sunbird-brick transition-colors p-2 -ml-2"
                                    aria-label="Open Menu"
                                >
                                    <FiMenu className="w-6 h-6" />
                                </button>
                                <h1 className="text-lg font-semibold text-sunbird-obsidian">Profile</h1>
                            </div>
                        ) : (
                            isSidebarOpen ? (
                                <img src={sunbirdLogo} alt="Sunbird" className="w-auto" style={{ height: '2.4375rem' }} />
                            ) : (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors p-1"
                                >
                                    <FiMenu className="w-5 h-3.5" />
                                </button>
                            )
                        )}
                    </div>

                    {/* Right: Search + Language */}
                    <div className="flex items-center gap-4 flex-1 justify-end lg:justify-start">
                        {isMobile ? (
                            <button
                                onClick={() => navigate('/search')}
                                className="p-2 text-sunbird-brick"
                            >
                                <FiSearch className="h-5 w-5" />
                            </button>
                        ) : (
                            <div
                                className="relative w-full max-w-[25rem] cursor-pointer"
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
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <FiBell className="w-5 h-5 text-sunbird-brick" />
                        </button>

                        {/* Language Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <img src={translationIcon} alt="Language" className="w-5 h-5" />
                                    <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-gray-200">
                                {languages.map((lang) => (
                                    <DropdownMenuItem
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang)}
                                        className={currentCode === lang.code ? "bg-sunbird-ivory" : ""}
                                    >
                                        <span className="mr-2">{lang.label}</span>
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
                    <div className="p-4 md:p-6 lg:p-8 transition-all lg:pr-[6.25rem] lg:pl-[1.625rem]">
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

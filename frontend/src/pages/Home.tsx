import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMenu, FiChevronDown } from "react-icons/fi";
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
import HomeStatsCards from "@/components/HomeStatsCards";
import HomeContinueLearning from "@/components/HomeContinueLearning";
import HomeInProgressGrid from "@/components/HomeInProgressGrid";
import HomeRecommendedSection from "@/components/HomeRecommendedSection";
import { useIsMobile } from "@/hooks/use-mobile";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();
    const [isLoading, setIsLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("home");
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); // Open by default on desktop, closed on mobile

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <PageLoader message="Loading your dashboard..." />;
    }

    return (
        <div className="home-container">
            {/* Top Header */}
            <header
                className={isMobile ? "home-header-mobile" : "home-header"}
            >
                <div className="flex items-center justify-between">
                    {/* Left: Sunbird Logo + Align with Sidebar */}
                    <div
                        className={`flex items-center transition-all ${!isMobile && isSidebarOpen ? 'w-[212px]' : 'w-auto'} ${isMobile ? 'pl-0' : 'pl-[30px]'}`}
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
                                <h1 className="text-lg font-semibold text-sunbird-obsidian">Home</h1>
                            </div>
                        ) : (
                            isSidebarOpen ? (
                                <img src={sunbirdLogo} alt="Sunbird" className="w-auto" style={{ height: '39px' }} />
                            ) : (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors p-1"
                                >
                                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M1 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M1 13H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )
                        )}
                    </div>

                    {/* Right: Search + Language */}
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                        {/* Search Bar */}
                        {isMobile ? (
                            <button
                                onClick={() => navigate('/search')}
                                className="text-sunbird-brick hover:text-sunbird-brick p-2"
                            >
                                <FiSearch className="w-5 h-5" />
                            </button>
                        ) : (
                            <div
                                className="home-search-container"
                                onClick={() => navigate('/search')}
                            >
                                <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sunbird-brick w-4 h-4 cursor-pointer" />
                                <Input
                                    type="text"
                                    placeholder={t("header.search")}
                                    className="home-search-input"
                                    readOnly
                                />
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
                                    <img src={translationIcon} alt="Translate" className="w-5 h-5" />
                                    <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-[150px] p-2 bg-white border-gray-100 z-50">
                                {languages.map((lang) => (
                                    <DropdownMenuItem
                                        key={lang.code}
                                        onSelect={() => changeLanguage(lang.code)}
                                        className={`cursor-pointer p-2 rounded-md ${currentCode === lang.code ? "bg-sunbird-brick/10 text-sunbird-brick font-semibold" : ""}`}
                                    >
                                        {lang.label}
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
                        <SheetContent side="left" className="w-[280px] pt-10 px-0 pb-0">
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
                <main className="home-main-content">
                    <div className="home-content-wrapper">
                        {/* Welcome Section */}
                        <div className="mb-6 md:mb-8">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Hi John Deo</h2>
                            <p className="text-gray-500 text-sm">Welcome to a learning experience made just for you.</p>
                        </div>

                        {/* Stats Cards */}
                        <HomeStatsCards />

                        {/* Continue Learning + Performance */}
                        <div className="home-continue-section">
                            <h3 className="text-lg font-semibold text-sunbird-obsidian mb-4">Continue from where you left</h3>
                            <div className="home-continue-grid">
                                <div className="w-full lg:w-[65%]">
                                    <HomeContinueLearning />
                                </div>
                            </div>
                        </div>

                        {/* In Progress Contents */}
                        <HomeInProgressGrid />

                        {/* Recommended Contents */}
                        <HomeRecommendedSection />
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};


export default Home;

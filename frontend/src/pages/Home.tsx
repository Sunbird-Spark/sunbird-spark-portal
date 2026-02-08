import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMenu } from "react-icons/fi";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
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
import HomePerformanceChart from "@/components/HomePerformanceChart";
import HomeInProgressGrid from "@/components/HomeInProgressGrid";
import HomeRecommendedSection from "@/components/HomeRecommendedSection";
import { useIsMobile } from "@/hooks/use-mobile";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";

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
        <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
            {/* Top Header */}
            <header
                className={`bg-white border-b border-gray-100 z-30 sticky top-0 transition-all ${isMobile ? "px-4 py-3 shadow-sm" : "px-6 py-4 shadow-sm lg:pr-[100px]"
                    }`}
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
                                    className="text-home-ginger hover:text-home-brick transition-colors p-2 -ml-2"
                                >
                                    <FiMenu className="w-6 h-6" />
                                </button>
                                <h1 className="text-lg font-semibold text-gray-900">Home</h1>
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
                                className="text-sunbird-ginger hover:text-sunbird-brick p-2"
                            >
                                <FiSearch className="w-5 h-5" />
                            </button>
                        ) : (
                            <div
                                className="relative w-full md:w-[400px] cursor-pointer"
                                onClick={() => navigate('/search')}
                            >
                                <Input
                                    placeholder="Search for content"
                                    readOnly
                                    className="pl-4 pr-10 bg-white border-border focus:border-sunbird-ginger focus:ring-sunbird-ginger/20 rounded-[0.5625rem] h-[2.875rem] text-base cursor-pointer placeholder:text-[#222222]"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-ginger hover:text-sunbird-brick">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7.53333 14.0667C11.1416 14.0667 14.0667 11.1416 14.0667 7.53333C14.0667 3.92507 11.1416 1 7.53333 1C3.92507 1 1 3.92507 1 7.53333C1 11.1416 3.92507 14.0667 7.53333 14.0667Z" stroke="#A85236" strokeWidth="2" />
                                        <path d="M15.0012 15.0002L12.2012 12.2002" stroke="#A85236" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Bell Icon */}
                        <button className="text-[#A85236] hover:text-sunbird-brick transition-colors">
                            <FiBell className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        {/* Language Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1 text-sunbird-brick hover:bg-gray-50">
                                    <img src={translationIcon} alt="Language" className="w-5 h-5 md:w-6 md:h-6" />
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="hidden md:block">
                                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-gray-200">
                                {languages.map((lang) => (
                                    <DropdownMenuItem
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={currentCode === lang.code ? "bg-home-ivory" : ""}
                                    >
                                        <span className="mr-2 text-sm">{lang.label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Sidebar - Mobile */}
                {isMobile ? (
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetContent side="left" className="p-0">
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
                                        className="w-6 h-6 bg-[#EFEFEF] rounded-full flex items-center justify-center shadow-sm text-[#A85236] hover:opacity-80 transition-opacity"
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
                <main className="flex-1 bg-home-ivory relative">
                    <div
                        className={`p-4 md:p-6 lg:p-8 transition-all ${!isMobile ? 'lg:pr-[100px] lg:pl-[26px]' : ''}`}
                    >
                        {/* Welcome Section */}
                        <div className="mb-6 md:mb-8">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Hi John Deo</h2>
                            <p className="text-gray-500 text-sm">Welcome to a learning experience made just for you.</p>
                        </div>

                        {/* Stats Cards */}
                        <HomeStatsCards />

                        {/* Continue Learning + Performance */}
                        <div className="mb-8 md:mb-12">
                            <h3 className="text-lg font-semibold text-[#222222] mb-4">Continue from where you left</h3>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-[65%]">
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

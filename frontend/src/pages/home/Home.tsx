import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/home/Header";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import { useAppI18n, LanguageCode } from "@/hooks/useAppI18n";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeStatsCards from "@/components/home/HomeStatsCards";
import HomeContinueLearning from "@/components/home/HomeContinueLearning";
import HomeInProgressGrid from "@/components/home/HomeInProgressGrid";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
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
        return <PageLoader message="Loading your dashboard..." />;
    }

    return (
        <div className="home-container">
            {/* Top Header */}
            <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />

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
                        <HomeSidebar
                            activeNav={activeNav}
                            onNavChange={setActiveNav}
                            collapsed={!isSidebarOpen}
                            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    </div>
                )}

                {/* Main Content Area */}
                <main className="home-main-content">
                    <div className="home-content-wrapper">
                        {/* Welcome Section */}
                        <div className="mb-6 md:mb-8">
                            <h2 className="home-welcome-title">Hi John Deo</h2>
                            <p className="home-welcome-subtitle">Welcome to a learning experience made just for you.</p>
                        </div>

                        {/* Stats Cards */}
                        <HomeStatsCards />

                        {/* Continue Learning + Performance */}
                        <div className="home-continue-section">
                            <h3 className="home-continue-section-title">Continue from where you left</h3>
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

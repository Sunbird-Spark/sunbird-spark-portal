import { useState } from "react";
import { useUserRead } from "@/hooks/useUserRead";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import Header from "@/components/home/Header";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeDashboardContent from "@/components/home/HomeDashboardContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";

import "./home.css";

const Home = () => {
    const isMobile = useIsMobile();
    const { data: userReadData, isLoading: userLoading, error, refetch } = useUserRead();
    const userProfile = userReadData?.data?.response;
    const { 
        data: enrolledCollections, 
        isLoading: enrollmentsLoading, 
        error: enrollmentsError 
    } = useUserEnrolledCollections();
    const enrolledCount = enrolledCollections?.data?.courses?.length ?? 0;
    const [activeNav, setActiveNav] = useState("home");
    const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen, toggleSidebar } = useSidebarState(!isMobile);

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
                            <h2 className="home-welcome-title">
                                Hi {[userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || 'there'}
                            </h2>
                            <p className="home-welcome-subtitle">
                                {enrolledCount === 0
                                    ? "Your exciting learning journey starts here. Dive in!"
                                    : "Welcome to a learning experience made just for you."}
                            </p>
                        </div>

                        <HomeDashboardContent
                            loading={userLoading || enrollmentsLoading}
                            error={error?.message || enrollmentsError?.message}
                            enrolledCount={enrolledCount}
                            onRetry={refetch}
                        />
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};


export default Home;

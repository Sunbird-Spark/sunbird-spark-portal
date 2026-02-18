import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/home/Header";
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
import { useSidebarState } from "@/hooks/useSidebarState";
import { useUserRead } from "@/hooks/useUserRead";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";
import "./profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();
    const [activeNav, setActiveNav] = useState("profile");
    const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen, toggleSidebar } = useSidebarState(!isMobile);

    const { data: userResponse, isLoading, isError } = useUserRead();
    const userData = userResponse?.data?.response;

    return (
        <div className="profile-container">
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
                <main className="profile-main-content">
                    {isLoading ? (
                        <PageLoader message="Loading your profile..." fullPage={false} />
                    ) : isError || !userData ? (
                        <PageLoader message="Error loading profile..." fullPage={false} />
                    ) : (
                        <div className="profile-content-wrapper">
                            {/* Top Section: Profile Card + Personal Information */}
                            <div className="grid grid-cols-1 lg:grid-cols-[19rem_1fr] gap-6 mb-8">
                                {/* Left: Profile Card */}
                                <ProfileCard user={userData} />

                                {/* Right: Personal Information */}
                                <PersonalInformation user={userData} />
                            </div>

                            {/* Stats Cards Section */}
                            <ProfileStatsCards />

                            {/* My Learning Section */}
                            <ProfileLearningList />
                        </div>
                    )}
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Profile;

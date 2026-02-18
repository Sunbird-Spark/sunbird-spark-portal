import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import PageLoader from "@/components/common/PageLoader";
import Header from "@/components/home/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useHelpFaqData } from "@/hooks/useFaqData";
import { useSystemSetting } from "@/hooks/useSystemSetting";

import SidebarCloseButton from "../../components/common/SidebarCloseButton";
import {
    buildHelpCategories,
} from "../../services/HelpSupportService";

import "../profile/profile.css";

const HelpSupport = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [activeNav, setActiveNav] = useState("help");
    const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen, toggleSidebar } = useSidebarState(!isMobile);

    const { data: appNameSetting } = useSystemSetting("sunbird");
    const appName = appNameSetting?.data?.response?.value || appNameSetting?.data?.value || " ";

    const { categories: allCategories, loading, error, refetch } = useHelpFaqData();

    const categories = useMemo(
        () => buildHelpCategories(allCategories).map(cat => ({
            ...cat,
            title: cat.title.replace(/{{APP_NAME}}/g, appName),
            description: cat.description.replace(/{{APP_NAME}}/g, appName)
        })),
        [allCategories, appName]
    );


    return (
        <div className="profile-container">
            <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />

            <div className="flex flex-1 relative transition-all">
                {isMobile ? (
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetContent side="left" className="w-[17.5rem] pt-[2.5rem] px-0 pb-0">
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
                    <div className="relative shrink-0 sticky top-[4.5rem] self-start z-[20]">
                        <HomeSidebar
                            activeNav={activeNav}
                            onNavChange={setActiveNav}
                            collapsed={!isSidebarOpen}
                            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        />
                    </div>
                )}

                <main className="profile-main-content">
                    <div className="profile-content-wrapper">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-[2rem]">
                            <h1 className="font-['Rubik'] font-medium text-[1.5rem] leading-[100%] tracking-[0%] text-foreground">
                                How can we assist you today?
                            </h1>
                            <button className="w-[9.375rem] h-[2.25rem] bg-sunbird-brick text-sunbird-base-white text-sm font-medium font-['Rubik'] pl-[0.9375rem] pr-[0.875rem] py-[0.625rem] rounded-[0.625rem] hover:opacity-90 transition-opacity flex items-center justify-center">
                                Report an Issue
                            </button>
                        </div>

                        {loading ? (
                            <PageLoader message="Loading..." fullPage={false} />
                        ) : error ? (
                            <PageLoader
                                message="Loading..."
                                error={error?.message || "Failed to load FAQ data. Please try again."}
                                onRetry={refetch}
                                fullPage={false}
                            />
                        ) : (
                            categories.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.25rem] mb-[2.5rem] pt-[1.25rem]">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.slug}
                                            onClick={() => navigate(`/help-support/${cat.slug}`)}
                                            className="bg-sunbird-base-white rounded-[0.625rem] overflow-hidden flex flex-col shadow-[0.125rem_0.125rem_1.25rem_rgba(0,0,0,0.09)] hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="w-[2rem] h-[0.75rem] bg-sunbird-ginger ml-[1.875rem]" />
                                            <div className="px-[1.25rem] pb-[1.25rem] pt-[1.5rem] flex flex-col flex-1">
                                                <h3 className="font-['Rubik'] font-medium text-[1.125rem] leading-[100%] tracking-[0%] text-foreground mb-[0.5rem]">{cat.title}</h3>
                                                <p className="text-base text-foreground font-['Rubik'] leading-relaxed mb-[1rem]">
                                                    {cat.description}
                                                </p>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className="font-['Rubik'] font-normal text-[0.875rem] leading-[1.625rem] tracking-[0%] text-sunbird-gray-75">{cat.faqCount} FAQs</span>
                                                    <FaArrowRightLong className="w-[1.25rem] h-[1.25rem] text-sunbird-brick" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}


                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default HelpSupport;

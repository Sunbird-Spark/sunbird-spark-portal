import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
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
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
import MyLearningCourses from "@/components/my-learning/MyLearningCourses";
import MyLearningHoursSpent from "@/components/my-learning/MyLearningHoursSpent";
import MyLearningUpcomingClasses from "@/components/my-learning/MyLearningUpcomingClasses";
import { useIsMobile } from "@/hooks/use-mobile";

// Custom language icon matching design
const LanguageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="2" y="16" fontSize="11" fontWeight="600" fill="currentColor">A</text>
    <text x="12" y="16" fontSize="9" fontWeight="500" fill="currentColor">あ</text>
  </svg>
);

const MyLearning = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t, languages, currentCode, changeLanguage } = useAppI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("learning");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);



  if (isLoading) {
    return <PageLoader message="Loading your learning..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        {!isMobile && (
          <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} />
        )}

        {/* Sidebar - Mobile Sheet */}
        {isMobile && (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[220px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <HomeSidebar activeNav={activeNav} onNavChange={(nav) => {
                setActiveNav(nav);
                setIsSidebarOpen(false);
              }} />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-white p-6 pb-20 min-w-0">
          {/* Courses and Hours/Classes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Left Column - Courses (2 cols) */}
            <div className="lg:col-span-2 h-full">
              <MyLearningCourses />
            </div>
            
            {/* Right Column - Hours Spent + Upcoming Classes */}
            <div className="space-y-6">
              <MyLearningHoursSpent />
              <MyLearningUpcomingClasses />
            </div>
          </div>

          {/* Recommended Contents */}
          <HomeRecommendedSection />
        </main>
      </div>

      {/* Footer - Full Width */}
      <Footer />
    </div>
  );
};

export default MyLearning;
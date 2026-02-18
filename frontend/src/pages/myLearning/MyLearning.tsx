import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/home/Header";
import { FiSearch, FiBell, FiMenu, FiChevronDown, FiChevronLeft } from "react-icons/fi";
import { Input } from "@/components/common/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import { useAppI18n, LanguageCode } from "@/hooks/useAppI18n";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
import MyLearningCourses from "@/components/myLearning/MyLearningCourses";
import MyLearningProgress from "@/components/myLearning/MyLearningProgress";
import MyLearningUpcomingBatches from "@/components/myLearning/MyLearningUpcomingBatches";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";
import "./mylearning.css";

const MyLearning = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t, languages, currentCode, changeLanguage } = useAppI18n();
  const [activeNav, setActiveNav] = useState("learning");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const { data, isLoading, error } = useUserEnrolledCollections();
  const courses = data?.data?.courses || [];

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Calculate metrics
  const totalCourses = courses.length;
  const lessonsVisited = courses.reduce((acc, course) => acc + (course.progress || 0), 0);
  const totalLessons = courses.reduce((acc, course) => acc + (course.leafNodesCount || 0), 0);
  const contentsCompleted = courses.filter(course => course.completionPercentage === 100).length;
  
  // Filter upcoming batches: startDate > today
  // Note: This intentionally filters out courses that have already started, even if they are in progress.
  // "Upcoming" strictly means batches with a start date in the future.
  const today = dayjs().startOf('day');

  const upcomingBatches = courses.filter(
    (course: { batch?: { startDate?: string | Date } }) => {
      if (course.batch && course.batch.startDate) {
        return dayjs(course.batch.startDate).isAfter(today);
      }
      return false;
    }
  );

  if (isLoading) {
    return <PageLoader message="Loading your learning..." />;
  }

  if (error) {
    return (
      <div className="page-container">
          <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />
          <div className="flex flex-1 relative transition-all">
             <div className="flex-1 flex items-center justify-center h-[calc(100vh-5rem)]">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-4">Failed to load your learning progress. Please try again later.</p>
                     <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-sunbird-brick text-white rounded-md hover:opacity-90 transition-opacity"
                    >
                        Retry
                    </button>
                </div>
             </div>
          </div>
          <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Header */}
      <header className={`page-header ${isMobile ? 'mobile' : ''}`}>
        <div className="page-header-container">
          {/* Left: Sunbird Logo + Align with Sidebar */}
          <div className={`page-logo-container ${!isMobile && isSidebarOpen ? 'w-[13.25rem]' : 'w-auto'} ${isMobile ? 'pl-0' : 'pl-[1.875rem]'}`}>
            {!isMobile && isSidebarOpen && (
              <div className="w-full">
                <img
                  src={sunbirdLogo}
                  alt="Sunbird"
                  className="page-logo-img"
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
          <div className="page-header-actions">
            {isMobile ? (
              <button
                onClick={() => navigate('/search')}
                className="page-search-btn-mobile"
                aria-label="Search"
              >
                <FiSearch className="h-5 w-5" />
              </button>
            ) : (
              <div
                className="page-search-container"
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
            <button className="page-action-btn" aria-label="Notifications">
              <FiBell className="page-action-icon" aria-hidden="true" />
            </button>

            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="page-lang-btn">
                  <img src={translationIcon} alt="Language" className="page-action-icon" />
                  <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="page-dropdown-content w-40">
                {languages.map((lng) => (
                  <DropdownMenuItem
                    key={lng.code}
                    className={`page-dropdown-item ${currentCode === lng.code ? 'active' : ''}`}
                    onSelect={() => changeLanguage(lng.code as LanguageCode)}
                  >
                    <span>{lng.label}</span>
                    {currentCode === lng.code && (
                      <div className="page-dropdown-indicator" />
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
            <SheetContent side="left" className="w-[17.5rem] pt-10 pl-0 pr-0 pb-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main Navigation</SheetDescription>
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
                    className="w-6 h-6 bg-sunbird-gray-ef rounded-full flex items-center justify-center shadow-sm text-sunbird-brick hover:opacity-80 transition-opacity"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <main className="page-main-content">
          <div className="page-content-wrapper">
            {/* Courses and Hours/Classes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {/* Left Column - Courses (2 cols) */}
              <div className="lg:col-span-2 h-full">
                <MyLearningCourses courses={courses} />
              </div>
              
              {/* Right Column - Hours Spent + Upcoming Batches */}
              <div className="space-y-6">
                <MyLearningProgress 
                  lessonsVisited={lessonsVisited}
                  totalLessons={totalLessons}
                  contentsCompleted={contentsCompleted}
                  totalContents={totalCourses}
                />
                {/* Upcoming Batches - New Design */}
                <MyLearningUpcomingBatches upcomingBatches={upcomingBatches} />
              </div>
            </div>

            {/* Recommended Contents */}
            <HomeRecommendedSection 
              creatorIds={Array.from(new Set(courses.map(c => c.batch?.createdBy).filter((id): id is string => !!id)))}
            />
          </div>
        </main>
      </div>

      {/* Footer - Full Width */}
      <Footer />
    </div>
  );
};

export default MyLearning;
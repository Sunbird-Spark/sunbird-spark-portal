import dayjs from "dayjs";
import { useState } from "react";
import Header from "@/components/home/Header";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
import MyLearningCourses from "@/components/myLearning/MyLearningCourses";
import MyLearningProgress from "@/components/myLearning/MyLearningProgress";
import MyLearningUpcomingBatches from "@/components/myLearning/MyLearningUpcomingBatches";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAppI18n } from "@/hooks/useAppI18n";
import useImpression from "@/hooks/useImpression";

import "./mylearning.css";

const MyLearning = () => {
  const { t } = useAppI18n();
  const isMobile = useIsMobile();
  const [activeNav, setActiveNav] = useState("learning");
  const { isOpen: isSidebarOpen, toggleSidebar, setSidebarOpen: setIsSidebarOpen } = useSidebarState(false);

  useImpression({ type: 'view', pageid: 'my-learning' });

  const { data, isLoading, error } = useUserEnrolledCollections();
  const courses = data?.data?.courses || [];

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
    return <PageLoader message={t('myLearning.loading')} />;
  }

  if (error) {
    return (
      <div className="page-container">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        <div className="flex flex-1 relative transition-all">
          <div className="flex-1 flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">{t('somethingWentWrong')}</h2>
              <p className="text-gray-600 mb-4">{t('myLearning.errorLoading')}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-sunbird-brick text-white rounded-md hover:opacity-90 transition-opacity"
              >
                {t('retry')}
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
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

      <div className="flex flex-1 relative transition-all">
        {/* Sidebar - Mobile */}
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[17.5rem] pt-10 pl-0 pr-0 pb-0">
              <SheetTitle className="sr-only">{t('navigationMenu')}</SheetTitle>
              <SheetDescription className="sr-only">{t('myLearning.mainNavigation')}</SheetDescription>
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
              onToggle={toggleSidebar}
            />
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
              enrolledCourseIds={courses.map(c => c.courseId)}
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import { useAppI18n } from "@/hooks/useAppI18n";
import HomeSidebar from "@/components/home/HomeSidebar";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
import MyLearningCourses from "@/components/my-learning/MyLearningCourses";
import MyLearningHoursSpent from "@/components/my-learning/MyLearningHoursSpent";
import MyLearningUpcomingBatches from "@/components/my-learning/MyLearningUpcomingBatches";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMyLearning } from "@/hooks/useMyLearning";

// Custom language icon matching design
const LanguageIcon = () => (
  <svg width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="2" y="16" fontSize="11" fontWeight="600" fill="currentColor">A</text>
    <text x="12" y="16" fontSize="9" fontWeight="500" fill="currentColor">あ</text>
  </svg>
);

const MyLearning = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // const { t } = useAppI18n(); // t is not used currently
  const [activeNav, setActiveNav] = useState("learning");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data, isLoading } = useMyLearning();
  const courses = data?.data?.courses || [];

  // Calculate metrics
  const totalCourses = courses.length;
  const lessonsVisited = courses.reduce((acc, course) => acc + (course.progress || 0), 0);
  const totalLessons = courses.reduce((acc, course) => acc + (course.leafNodesCount || 0), 0);
  const contentsCompleted = courses.filter(course => course.completionPercentage === 100).length;
  
  // Filter upcoming batches: startDate > today
  // Ensuring we handle dates correctly. Assuming batch.startDate is "YYYY-MM-DD" or ISO string.
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalized to start of day

  const upcomingBatches = courses.filter(course => {
    if (course.batch && course.batch.startDate) {
      const startDate = new Date(course.batch.startDate);
      // Check if valid date and in future
      return !isNaN(startDate.getTime()) && startDate > today;
    }
    return false;
  });

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
            <SheetContent side="left" className="p-0 w-[13.75rem]">
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
              <MyLearningCourses courses={courses} />
            </div>
            
            {/* Right Column - Hours Spent + Upcoming Batches */}
            <div className="space-y-6">
              <MyLearningHoursSpent 
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
          <HomeRecommendedSection />
        </main>
      </div>

      {/* Footer - Full Width */}
      <Footer />
    </div>
  );
};

export default MyLearning;
import dayjs from "dayjs";
import PageLoader from "@/components/common/PageLoader";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
import MyLearningCourses from "@/components/myLearning/MyLearningCourses";
import MyLearningProgress from "@/components/myLearning/MyLearningProgress";
import MyLearningUpcomingBatches from "@/components/myLearning/MyLearningUpcomingBatches";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { useAppI18n } from "@/hooks/useAppI18n";

import "./mylearning.css";

const MyLearning = () => {
  const { t } = useAppI18n();

  const { data, isLoading, error } = useUserEnrolledCollections();
  const courses = data?.data?.courses || [];

  // Calculate metrics
  const totalCourses = courses.length;
  const lessonsVisited = courses.reduce((acc, course) => acc + (course.progress || 0), 0);
  const totalLessons = courses.reduce((acc, course) => acc + (course.leafNodesCount || 0), 0);
  const contentsCompleted = courses.filter(course => course.completionPercentage === 100).length;

  const upcomingBatches = courses.filter(course => {
    if (course.completionPercentage > 0) return false;
    if (course.batch?.startDate) {
      return dayjs(course.batch.startDate).isAfter(dayjs(), 'day');
    }
    return false;
  });

  if (isLoading) {
    return <PageLoader message={t('myLearning.loading')} />;
  }

  if (error) {
    return (
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
    );
  }

  return (
    <main className="page-main-content">
      <div className="page-content-wrapper">
        {/* Courses and Hours/Classes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 lg:h-[calc(100vh-8rem)]">
          {/* Left Column - Courses (2 cols) */}
          <div className="lg:col-span-2 h-full min-h-0">
            <MyLearningCourses courses={courses} />
          </div>

          {/* Right Column - Hours Spent + Upcoming Batches */}
          <div className="space-y-6 h-full min-h-0 overflow-y-auto">
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
  );
};

export default MyLearning;

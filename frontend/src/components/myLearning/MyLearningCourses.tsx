import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { TrackableCollection } from "@/types/TrackableCollections";
import TrackableCollectionCard from "../content/TrackableCollectionCard";
import { useAppI18n } from "@/hooks/useAppI18n";


const COURSES_PER_PAGE = 9;

type TabType = "active" | "completed" | "upcoming";

interface MyLearningCoursesProps {
  courses?: TrackableCollection[];
}

const MyLearningCourses = ({ courses = [] }: MyLearningCoursesProps) => {
  const { t } = useAppI18n();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [visibleCount, setVisibleCount] = useState(COURSES_PER_PAGE);

  const tabs: { id: TabType; label: string }[] = [
    { id: "active", label: t('status.active') + ' ' + t('courses') },
    { id: "completed", label: t('status.completed') },
    { id: "upcoming", label: t('status.upcoming') },
  ];

  const isCompleted = (c: TrackableCollection) => c.status === 2 || c.completionPercentage >= 100;

  const getFilteredCourses = () => {
    switch (activeTab) {
      case "active":
        return courses.filter(c => {
          if (isCompleted(c)) return false;
          if (c.batch?.startDate && dayjs(c.batch.startDate).isAfter(dayjs(), 'day')) return false;
          return true;
        });
      case "completed":
        return courses.filter(c => isCompleted(c));
      case "upcoming":
        return courses.filter(c => {
          if (c.status !== 0 || c.completionPercentage > 0) return false;
          if (c.batch?.startDate) {
            return dayjs(c.batch.startDate).isAfter(dayjs(), 'day');
          }
          return false;
        });
      default:
        return courses;
    }
  };

  const allFilteredCourses = getFilteredCourses();
  const currentCourses = allFilteredCourses.slice(0, visibleCount);
  const hasMore = visibleCount < allFilteredCourses.length;

  // Reset visible count when tab changes
  useEffect(() => {
    setVisibleCount(COURSES_PER_PAGE);
  }, [activeTab]);

  return (
    <div className="bg-white rounded-2xl p-6 h-full flex flex-col shadow-sunbird-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity w-fit shrink-0">
        <h3 className="text-[1.375rem] font-bold text-sunbird-obsidian font-rubik">{t('courses')}</h3>
        <FiChevronDown className="text-sunbird-obsidian w-[1.25rem] h-[1.25rem] mt-1" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pl-6 pr-6 py-2.5 rounded-full text-[0.875rem] font-medium font-rubik transition-all ${
              activeTab === tab.id
                ? "mylearning-tab-active"
                : "mylearning-tab-inactive"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Course List — scrollable */}
      <div className="overflow-y-auto flex-1 pr-1 space-y-6">
        {currentCourses.length > 0 ? (
          <>
            {currentCourses.map((course, index) => (
              <TrackableCollectionCard 
                key={course.courseId || index} 
                course={course} 
                index={index}
              />
            ))}
            
            {/* Show More Button */}
            {hasMore && (
              <div className="flex justify-center py-6 mt-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + COURSES_PER_PAGE)}
                  className="bg-white border border-sunbird-brick text-sunbird-brick pl-8 pr-8 py-2.5 rounded-full text-[0.875rem] font-medium hover:bg-sunbird-brick hover:text-white transition-all shadow-sm font-rubik min-w-fit"
                >
                  {t('profileLearning.viewMoreCourses')}
                </button>
              </div>
            )}
            
            {/* End of List Message */}
            {!hasMore && allFilteredCourses.length > COURSES_PER_PAGE && (
              <div className="text-center py-4 text-gray-500 text-[0.875rem] font-rubik">
                No more courses to show
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-gray-500 font-rubik">
            No courses found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearningCourses;
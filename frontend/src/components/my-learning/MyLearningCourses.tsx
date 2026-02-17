import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Course } from "@/types/courseTypes";

const ChevronDownIcon = () => (
  <svg width="0.625rem" height="0.375rem" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="#CC8545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DEFAULT_THUMBNAIL = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop";

type TabType = "active" | "completed" | "upcoming";

const tabs: { id: TabType; label: string }[] = [
  { id: "active", label: "Active Courses" },
  { id: "completed", label: "Completed" },
  { id: "upcoming", label: "Upcoming" },
];

interface MyLearningCoursesProps {
  courses?: Course[];
}

const MyLearningCourses = ({ courses = [] }: MyLearningCoursesProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [visibleCount, setVisibleCount] = useState(9);
  const observerTarget = useRef<HTMLDivElement>(null);

  const getFilteredCourses = () => {
    switch (activeTab) {
      case "active":
        return courses.filter(c => c.completionPercentage < 100);
      case "completed":
        return courses.filter(c => c.completionPercentage === 100);
      default:
        return courses;
    }
  };

  const allFilteredCourses = getFilteredCourses();
  const currentCourses = allFilteredCourses.slice(0, visibleCount);
  const hasMore = visibleCount < allFilteredCourses.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries?.[0]?.isIntersecting && hasMore) {
          setVisibleCount(prev => prev + 9);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore]);

  // Reset visible count when tab changes
  useEffect(() => {
    setVisibleCount(9);
  }, [activeTab]);

  return (
    <div className="bg-white rounded-2xl p-6 h-full shadow-[0px_2px_12px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-[1.375rem] font-bold text-[#222222] font-['Rubik']">Courses</h3>
        <ChevronDownIcon />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-full text-[0.875rem] font-medium font-['Rubik'] transition-all ${
              activeTab === tab.id
                ? "bg-[#A85236] text-white shadow-md shadow-[#A85236]/20"
                : "bg-transparent border border-[#E5E7EB] text-[#6B7280] hover:border-[#A85236] hover:text-[#A85236]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Course List */}
      <div className="space-y-6">
        {currentCourses.length > 0 ? (
          <>
            {currentCourses.map((course, index) => (
              <Link
                key={course.courseId || index}
                to={`/content/${course.courseId}`}
                className="block"
              >
                <div
                  className="flex gap-6 p-6 bg-white rounded-2xl border border-[#F3F4F6] hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <img
                    src={course.content?.appIcon || DEFAULT_THUMBNAIL}
                    alt={course.courseName}
                    className="w-[7.5rem] h-[7.5rem] rounded-2xl object-cover flex-shrink-0 shadow-sm"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-[1.125rem] leading-[1.4] text-[#222222] line-clamp-2 mb-6 font-['Rubik']">
                      {course.courseName}
                    </h4>
                    <p className="text-[1rem] font-normal text-[#222222] mb-3 font-['Rubik']">
                      Completed : <span className="font-medium">{course.completionPercentage}%</span>
                    </p>
                    {/* Progress Bar */}
                    <div className="h-2 bg-[#F4F4F4] rounded-[10px] max-w-[22.5rem]">
                      <div
                        className="h-full bg-[#A85236] rounded-[10px] transition-all"
                        style={{ width: `${course.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Scroll Loader Sentinel */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A85236]"></div>
              </div>
            )}
            
            {/* End of List Message */}
            {!hasMore && allFilteredCourses.length > 9 && (
              <div className="text-center py-4 text-gray-500 text-[0.875rem]">
                No more courses to show
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">
            No courses found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearningCourses;
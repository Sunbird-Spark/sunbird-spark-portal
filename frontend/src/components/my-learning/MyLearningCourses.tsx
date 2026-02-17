import { useState, useEffect } from "react";
import { Course } from "@/types/courseTypes";
import TrackableCollectionCard from "../content/TrackableCollectionCard";

const ChevronDownIcon = () => (
  <svg width="0.625rem" height="0.375rem" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="#CC8545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const COURSES_PER_PAGE = 9;

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
  const [visibleCount, setVisibleCount] = useState(COURSES_PER_PAGE);

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

  // Reset visible count when tab changes
  useEffect(() => {
    setVisibleCount(COURSES_PER_PAGE);
  }, [activeTab]);

  return (
    <div className="bg-white rounded-2xl p-6 h-full shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.03)]">
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
            className={`pl-6 pr-6 py-2.5 rounded-full text-[0.875rem] font-medium font-['Rubik'] transition-all ${
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
                  className="bg-white border border-[#A85236] text-[#A85236] pl-8 pr-8 py-2.5 rounded-full text-[0.875rem] font-medium hover:bg-[#A85236] hover:text-white transition-all shadow-sm font-['Rubik']"
                >
                  View more courses
                </button>
              </div>
            )}
            
            {/* End of List Message */}
            {!hasMore && allFilteredCourses.length > COURSES_PER_PAGE && (
              <div className="text-center py-4 text-[#6B7280] text-[0.875rem] font-['Rubik']">
                No more courses to show
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-[#6B7280] font-['Rubik']">
            No courses found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearningCourses;
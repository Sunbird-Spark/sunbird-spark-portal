import { useState } from "react";
import { Link } from "react-router-dom";
import { Course } from "@/types/courseTypes";

const ChevronDownIcon = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="#CC8545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DEFAULT_THUMBNAIL = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop";

type TabType = "active" | "completed" | "upcoming" | "paused";

const tabs: { id: TabType; label: string }[] = [
  { id: "active", label: "Active Courses" },
  { id: "completed", label: "Completed" },
  { id: "upcoming", label: "Upcoming" },
  { id: "paused", label: "Paused" },
];

interface MyLearningCoursesProps {
  courses?: Course[];
}

const MyLearningCourses = ({ courses = [] }: MyLearningCoursesProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const filteredCourses = courses.filter(course => {
    if (activeTab === "active") return course.completionPercentage < 100 && course.completionPercentage > 0;
    if (activeTab === "completed") return course.completionPercentage === 100;
    if (activeTab === "upcoming") return course.completionPercentage === 0; // Assuming 0% is upcoming/not started logic for now
    return false;
  });

  // Fallback to show all if no filtering logic matches perfectly or for specific tabs for now
  const displayCourses = activeTab === "paused" ? [] : (filteredCourses.length > 0 ? filteredCourses : (activeTab === "active" ? courses : [])); 
  // Actually, let's refine the filter.
  // The sample data has status 0, 1, 2.
  // Let's just render the passed courses for now if the filter is empty, or better:
  // Active: < 100%
  // Completed: = 100%
  // Upcoming: (maybe based on startDate > today?)
  
  // Revised filter logic:
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

  const currentCourses = getFilteredCourses();

  return (
    <div className="bg-white rounded-2xl p-6 h-full shadow-[0px_2px_12px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-[22px] font-bold text-[#222222] font-['Rubik']">Courses</h3>
        <ChevronDownIcon />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-full text-[14px] font-medium font-['Rubik'] transition-all ${
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
          currentCourses.map((course, index) => (
            <div
              key={course.courseId || index}
              className="flex gap-6 p-6 bg-white rounded-2xl border border-[#F3F4F6] hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <img
                src={course.content?.appIcon || DEFAULT_THUMBNAIL}
                alt={course.courseName}
                className="w-[120px] h-[120px] rounded-2xl object-cover flex-shrink-0 shadow-sm"
              />

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-bold text-[18px] leading-[1.4] text-[#222222] line-clamp-2 mb-6 font-['Rubik']">
                  {course.courseName}
                </h4>
                <p className="text-[16px] font-normal text-[#222222] mb-3 font-['Rubik']">
                  Completed : <span className="font-medium">{course.completionPercentage}%</span>
                </p>
                {/* Progress Bar */}
                <div className="h-2 bg-[#F4F4F4] rounded-[10px] max-w-[360px]">
                  <div
                    className="h-full bg-[#A85236] rounded-[10px] transition-all"
                    style={{ width: `${course.completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            No courses found in this category.
          </div>
        )}
      </div>

      {/* View More Link */}
      <div className="text-center mt-8">
        <Link
          to="/courses"
          className="text-[15px] font-semibold font-['Rubik'] text-[#A85236] hover:text-[#8a4329] transition-colors"
        >
          View More Courses
        </Link>
      </div>
    </div>
  );
};

export default MyLearningCourses;
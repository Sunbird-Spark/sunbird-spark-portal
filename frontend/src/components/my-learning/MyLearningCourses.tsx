import { useState } from "react";
import { Link } from "react-router-dom";

const ChevronDownIcon = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="#CC8545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const coursesData = [
  {
    id: "1",
    title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
    progress: 30,
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    title: "Data Engineering Foundations",
    progress: 70,
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
    progress: 30,
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    title: "Data Engineering Foundations",
    progress: 70,
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop",
  },
];

type TabType = "active" | "completed" | "upcoming" | "paused";

const tabs: { id: TabType; label: string }[] = [
  { id: "active", label: "Active Courses" },
  { id: "completed", label: "Completed" },
  { id: "upcoming", label: "Upcoming" },
  { id: "paused", label: "Paused" },
];

const MyLearningCourses = () => {
  const [activeTab, setActiveTab] = useState<TabType>("active");

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
        {coursesData.map((course) => (
          <div
            key={course.id}
            className="flex gap-6 p-6 bg-white rounded-2xl border border-[#F3F4F6] hover:shadow-md transition-shadow"
          >
            {/* Thumbnail */}
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-[120px] h-[120px] rounded-2xl object-cover flex-shrink-0 shadow-sm"
            />

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="font-bold text-[18px] leading-[1.4] text-[#222222] line-clamp-2 mb-6 font-['Rubik']">
                {course.title}
              </h4>
              <p className="text-[16px] font-normal text-[#222222] mb-3 font-['Rubik']">
                Completed : <span className="font-medium">{course.progress}%</span>
              </p>
              {/* Progress Bar */}
              <div className="h-2 bg-[#F4F4F4] rounded-[10px] max-w-[360px]">
                <div
                  className="h-full bg-[#A85236] rounded-[10px] transition-all"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
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
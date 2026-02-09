import { useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiDownload, FiEye } from "react-icons/fi";


type FilterType = "all" | "ongoing" | "completed";

interface CourseItem {
    id: string;
    title: string;
    dueDate: string;
    progress: number;
    status: "ongoing" | "completed";
    thumbnail: string;
}

const coursesData: CourseItem[] = [
    {
        id: "1",
        title: "The AI Engineer Course 2026: \n Complete AI Engineer Bootcamp",
        dueDate: "20th Feb",
        progress: 30,
        status: "ongoing",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop",
    },
    {
        id: "2",
        title: "Data Engineering Foundations",
        dueDate: "10th Feb",
        progress: 50,
        status: "ongoing",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop",
    },
    {
        id: "3",
        title: "Business Decisions and Analytics",
        dueDate: "31st Jan",
        progress: 100,
        status: "completed",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop",
    },
    {
        id: "4",
        title: "The AI Engineer Course 2026: \n Complete AI Engineer Bootcamp",
        dueDate: "20th Feb",
        progress: 30,
        status: "ongoing",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop",
    },
    {
        id: "5",
        title: "Data Engineering Foundations",
        dueDate: "10th Feb",
        progress: 50,
        status: "ongoing",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop",
    },
    {
        id: "6",
        title: "Business Decisions and Analytics",
        dueDate: "31st Jan",
        progress: 100,
        status: "completed",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop",
    },
];

// Progress Ring Component
const ProgressRing = ({ progress }: { progress: number }) => {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg width="26" height="26" viewBox="0 0 26 26" className="transform -rotate-90">
            {/* Background circle */}
            <circle
                cx="13"
                cy="13"
                r={radius}
                fill="none"
                stroke="#F0CE94"
                strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
                cx="13"
                cy="13"
                r={radius}
                fill="none"
                stroke="#A85236"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
            />
        </svg>
    );
};

const ProfileLearningList = () => {
    const [filter, setFilter] = useState<FilterType>("all");

    const filteredCourses = coursesData.filter((course) => {
        if (filter === "all") return true;
        return course.status === filter;
    });

    return (
        <div className="bg-white rounded-[1.25rem] p-6">
            {/* Header with Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 relative">
                <div className="flex items-center">
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-[0.3125rem] h-5 bg-[#CC8545]" />
                    <h2 className="text-[1.375rem] font-medium text-foreground ml-2">
                        My Learning
                    </h2>
                </div>

                <div className="flex items-center gap-2 pr-2">
                    <span className="text-sm font-medium text-foreground">Filter :</span>
                    <div className="relative flex items-center">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterType)}
                            className="text-sm text-foreground border-none bg-transparent focus:outline-none cursor-pointer appearance-none pr-5 font-medium"
                        >
                            <option value="all">All</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                        <FiChevronDown className="absolute right-0 pointer-events-none text-sunbird-brick w-4 h-4" />

                    </div>
                </div>
            </div>

            {/* Course List */}
            <div className="space-y-3">
                {filteredCourses.map((course) => (
                    <div
                        key={course.id}
                        className="profile-learning-item"
                    >
                        {/* 1. Thumbnail + Details */}
                        <div className="profile-learning-info">
                            <div className="w-[4.375rem] flex-shrink-0">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-[4.375rem] h-[4.375rem] rounded-xl object-cover"
                                />
                            </div>
                            <div className="profile-learning-details">
                                <h4 className="profile-learning-title">
                                    {course.title}
                                </h4>
                                <p className="profile-learning-meta">
                                    Due Date : {course.dueDate}
                                </p>
                            </div>
                        </div>

                        {/* 2. Progress Ring + Percentage */}
                        <div className="profile-learning-stats">
                            <ProgressRing progress={course.progress} />
                            <span className="text-[1rem] font-medium text-[#222222] w-10">
                                {course.progress}%
                            </span>
                        </div>

                        {/* 3. Status Badge */}
                        <div className="profile-learning-status">
                            <div
                                className={`px-4 md:px-5 py-1.5 rounded-full border ${course.status === "completed"
                                    ? "bg-[#E6F3EA] border-[#B2DDBF] text-[#2D6A4F]"
                                    : "bg-[#FFF8EB] border-[#FCE6BD] text-[#826404]"
                                    }`}
                            >
                                <span className="text-sm font-medium">
                                    {course.status === "completed" ? "Completed" : "Ongoing"}
                                </span>
                            </div>
                        </div>

                        {/* 4. Certificate Action */}
                        <div className="profile-learning-actions">
                            <button
                                className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#A85236] hover:opacity-80 transition-opacity"
                            >
                                {course.status === "completed" ? (
                                    <>
                                        <FiDownload className="w-3.5 h-3.5" />
                                        <span>Download Certificate</span>
                                    </>
                                ) : (
                                    <>
                                        <FiEye className="w-3.5 h-3.5" />
                                        <span>Preview Certificate</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View More Link */}
            <div className="text-center mt-6">
                <Link
                    to="/my-learning"
                    className="text-sm font-medium text-[#A85236] hover:opacity-80 transition-opacity"
                >
                    View More Courses
                </Link>
            </div>
        </div>
    );
};

export default ProfileLearningList;
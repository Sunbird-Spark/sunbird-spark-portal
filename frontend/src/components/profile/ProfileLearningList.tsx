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
                stroke="hsl(var(--sunbird-progress-bg))"
                strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
                cx="13"
                cy="13"
                r={radius}
                fill="none"
                stroke="hsl(var(--sunbird-brick))"
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
        <div className="learning-list-card">
            {/* Header with Filter */}
            <div className="learning-header">
                <div className="learning-title-wrapper">
                    <div className="learning-title-accent" />
                    <h2 className="learning-title">
                        My Learning
                    </h2>
                </div>

                <div className="learning-filter-container">
                    <span className="learning-filter-label">Filter :</span>
                    <div className="learning-filter-select-wrapper">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterType)}
                            className="learning-filter-select"
                        >
                            <option value="all">All</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                        <FiChevronDown className="learning-filter-chevron" />
                    </div>
                </div>
            </div>

            {/* Course List */}
            <div className="learning-list-container">
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

                        {/* 2 & 3: Stats and Status grouped for mobile */}
                        <div className="profile-learning-stats-badge-row">
                            {/* Progress Ring + Percentage */}
                            <div className="profile-learning-stats">
                                <ProgressRing progress={course.progress} />
                                <span className="text-[1rem] font-normal text-sunbird-obsidian w-10 leading-none tracking-normal">
                                    {course.progress}%
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div className="profile-learning-status">
                                <div
                                    className={`px-4 md:px-5 py-1.5 rounded-full border ${course.status === "completed"
                                        ? "bg-sunbird-status-completed-bg border-sunbird-status-completed-border text-sunbird-status-completed-text"
                                        : "bg-sunbird-status-ongoing-bg border-sunbird-status-ongoing-border text-sunbird-status-ongoing-text"
                                        }`}
                                >
                                    <span className="text-[0.875rem] font-medium leading-[1.125rem]">
                                        {course.status === "completed" ? "Completed" : "Ongoing"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-learning-actions">
                            <button
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                {course.status === "completed" ? (
                                    <>
                                        <FiDownload className="w-[1.125rem] h-[1.125rem] text-sunbird-ginger" />
                                        <span className="font-rubik font-medium text-[0.875rem] leading-none tracking-normal text-sunbird-brick text-center whitespace-nowrap">
                                            Download Certificate
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <FiEye className="w-[1.125rem] h-[1.125rem] text-sunbird-ginger" />
                                        <span className="font-rubik font-medium text-[0.875rem] leading-none tracking-normal text-sunbird-brick text-center whitespace-nowrap">
                                            Preview Certificate
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View More Link */}
            <div className="learning-view-more-container">
                <Link
                    to="/my-learning"
                    className="learning-view-more-link"
                >
                    View More Courses
                </Link>
            </div>
        </div>
    );
};

export default ProfileLearningList;
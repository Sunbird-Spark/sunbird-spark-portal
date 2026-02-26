import { useState } from "react";
import { FiChevronDown, FiDownload } from "react-icons/fi";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { TrackableCollection } from "@/types/TrackableCollections";
import PageLoader from "@/components/common/PageLoader";
import { ProgressRing } from "./ProfileIcons";
import { useCertificateDownload } from "@/hooks/useCertificateDownload";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";

type FilterType = "all" | "ongoing" | "completed";

const VIEW_LIMIT = 6;

const getCompletionStatus = (status: number): "ongoing" | "completed" =>
    status === 2 ? "completed" : "ongoing";



interface CourseRowProps {
    course: TrackableCollection;
    downloadCertificate: (courseId: string, batchId: string, courseName: string, issuedCertificates?: any[], completedOn?: number) => Promise<void>;
    hasCertificate: (courseId: string, batchId?: string, courseName?: string, issuedCertificates?: any[]) => boolean;
    downloadingCourseId: string | null;
}

const CourseRow = ({ course, downloadCertificate, hasCertificate, downloadingCourseId }: CourseRowProps) => {
    const status = getCompletionStatus(course.status);
    const progress = course.completionPercentage ?? 0;
    const thumbnail = course.courseLogoUrl || course.content?.appIcon;
    const title = course.courseName || course.content?.name || "Untitled Course";

    const isDownloading = downloadingCourseId === course.courseId;

    return (
        <div className="profile-learning-item">
            {/* 1. Thumbnail + Details */}
            <div className="profile-learning-info">
                <div className="w-[4.375rem] flex-shrink-0">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt={title}
                            className="w-[4.375rem] h-[4.375rem] rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-[4.375rem] h-[4.375rem] rounded-xl bg-black flex-shrink-0" />
                    )}
                </div>
                <div className="profile-learning-details">
                    <h4 className="profile-learning-title">{title}</h4>
                </div>
            </div>

            {/* 2 & 3: Stats and Status grouped for mobile */}
            <div className="profile-learning-stats-badge-row">
                {/* Progress Ring + Percentage */}
                <div className="profile-learning-stats">
                    <ProgressRing progress={progress} />
                    <span className="text-[1rem] font-normal text-sunbird-obsidian w-10 leading-none tracking-normal">
                        {progress}%
                    </span>
                </div>

                {/* Status Badge */}
                <div className="profile-learning-status">
                    <div
                        className={`px-4 md:px-5 py-1.5 rounded-full border ${status === "completed"
                            ? "bg-sunbird-status-completed-bg border-sunbird-status-completed-border text-sunbird-status-completed-text"
                            : "bg-sunbird-status-ongoing-bg border-sunbird-status-ongoing-border text-sunbird-status-ongoing-text"
                            }`}
                    >
                        <span className="text-[0.875rem] font-medium leading-[1.125rem]">
                            {status === "completed" ? "Completed" : "Ongoing"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="profile-learning-actions">
                {status === "completed" && hasCertificate(course.courseId, course.batchId, title, course.issuedCertificates) ? (
                    <button
                        className={`flex items-center gap-2 transition-opacity ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                        disabled={isDownloading}
                        onClick={() => downloadCertificate(course.courseId, course.batchId, title, course.issuedCertificates, course.completedOn)}
                    >
                        {isDownloading ? (
                            <div className="w-[1.125rem] h-[1.125rem] border-2 border-sunbird-ginger border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FiDownload className="w-[1.125rem] h-[1.125rem] text-sunbird-ginger" />
                        )}
                        <span className="font-rubik font-medium text-[0.875rem] leading-none tracking-normal text-sunbird-brick text-center whitespace-nowrap">
                            {isDownloading ? "Downloading..." : "Download Certificate"}
                        </span>
                    </button>
                ) : status === "completed" ? (
                    <span className="font-rubik font-medium text-[0.875rem] leading-none tracking-normal text-sunbird-gray-75 text-center whitespace-nowrap">
                        No certificate
                    </span>
                ) : null}
            </div>
        </div>
    );
};

const ProfileLearningList = () => {
    const [filter, setFilter] = useState<FilterType>("all");
    const [showAll, setShowAll] = useState(false);

    const { data, isLoading, isError, refetch } = useUserEnrolledCollections();
    const courses = data?.data?.courses ?? [];

    const { downloadCertificate, hasCertificate, downloadingCourseId } = useCertificateDownload();

    const filteredCourses = courses.filter((course) => {
        if (filter === "all") return true;
        return getCompletionStatus(course.status) === filter;
    });

    const hasMore = filteredCourses.length > VIEW_LIMIT;
    const visibleCourses = hasMore && !showAll
        ? filteredCourses.slice(0, VIEW_LIMIT)
        : filteredCourses;

    return (
        <div className="learning-list-card">
            {/* Header with Filter */}
            <div className="learning-header">
                <div className="learning-title-wrapper">
                    <div className="learning-title-accent" />
                    <h2 className="learning-title">My Learning</h2>
                </div>

                <div className="learning-filter-container">
                    <span className="learning-filter-label">Filter :</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-normal text-foreground hover:bg-gray-50 transition-colors min-w-[8rem] justify-between"
                                aria-label="Filter courses by status"
                            >
                                <span className="capitalize">{filter}</span>
                                <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[8.75rem] bg-white z-50">
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-sunbird-ginger/10 hover:text-sunbird-ginger"
                                onClick={() => {
                                    setFilter("all");
                                    setShowAll(false);
                                }}
                            >
                                All
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-sunbird-ginger/10 hover:text-sunbird-ginger"
                                onClick={() => {
                                    setFilter("ongoing");
                                    setShowAll(false);
                                }}
                            >
                                Ongoing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-sunbird-ginger/10 hover:text-sunbird-ginger"
                                onClick={() => {
                                    setFilter("completed");
                                    setShowAll(false);
                                }}
                            >
                                Completed
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Course List */}
            <div className="learning-list-container">
                {isLoading ? (
                    <PageLoader message="Loading your courses..." fullPage={false} />
                ) : isError ? (
                    <PageLoader
                        error="Failed to load courses. Please try again."
                        onRetry={() => refetch()}
                        fullPage={false}
                    />
                ) : filteredCourses.length === 0 ? (
                    <div className="flex flex-1 min-h-[200px] items-center justify-center">
                        <p className="text-sunbird-gray-75 text-sm">
                            {filter === "all"
                                ? "No courses enrolled yet."
                                : `No ${filter} courses found.`}
                        </p>
                    </div>
                ) : (
                    visibleCourses.map((course, index) => (
                        <CourseRow
                            key={`${course.batchId || "course"}-${index}`}
                            course={course}
                            downloadCertificate={downloadCertificate}
                            hasCertificate={hasCertificate}
                            downloadingCourseId={downloadingCourseId}
                        />
                    ))
                )}
            </div>

            {/* View More / View Less */}
            {!isLoading && !isError && hasMore && (
                <div className="learning-view-more-container">
                    <button
                        onClick={() => setShowAll((prev) => !prev)}
                        className="learning-view-more-link"
                    >
                        {showAll ? "View Less" : "View More Courses"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileLearningList;

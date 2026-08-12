import { Link, useLocation } from "react-router-dom";
import { FiDownload } from "react-icons/fi";
import { TrackableCollection, IssuedCertificate } from "@/types/TrackableCollections";
import { ProgressRing } from "./ProfileIcons";
import { getPlaceholderImage } from "@/utils/getPlaceholderImage";
import { getContentDetailPath } from "@/utils/getContentDetailPath";
import { getCompletionStatus } from "./profileLearningStatus";

export interface CourseRowProps {
    course: TrackableCollection;
    downloadCertificate: (courseId: string, batchId: string, courseName: string, issuedCertificates?: IssuedCertificate[], completedOn?: number) => Promise<void>;
    hasCertificate: (courseId: string, batchId?: string, courseName?: string, issuedCertificates?: IssuedCertificate[]) => boolean;
    downloadingCourseId: string | null;
    t: (key: string) => string;
}

const CourseRow = ({ course, downloadCertificate, hasCertificate, downloadingCourseId, t }: CourseRowProps) => {
    const location = useLocation();
    const status = getCompletionStatus(course.status, course.completionPercentage ?? 0);
    const progress = course.completionPercentage ?? 0;
    const thumbnail = course.content?.posterImage || course.content?.appIcon || course.courseLogoUrl || getPlaceholderImage(course.courseId);
    const title = course.courseName || course.content?.name || t('profileLearning.untitledCourse');

    const isDownloading = downloadingCourseId === course.courseId;

    return (
        <div className="profile-learning-item relative">
            <Link
                to={getContentDetailPath(course.courseId, course.content?.primaryCategory)}
                state={{ from: location.pathname + location.search }}
                className="absolute inset-0"
                aria-label={title}
                data-edataid="profile-learning-card-click"
                data-objectid={course.courseId}
                data-objecttype="Collection"
            />
            {/* 1. Thumbnail + Details */}
            <div className="profile-learning-info">
                <div className="w-[4.375rem] flex-shrink-0">
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-[4.375rem] h-[4.375rem] rounded-xl object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getPlaceholderImage(course.courseId);
                        }}
                    />
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
                        className={`px-4 md:px-5 py-1.5 rounded-pill border ${status === "completed"
                                ? "bg-sunbird-status-completed-bg border-sunbird-status-completed-border text-sunbird-status-completed-text"
                                : status === "ongoing"
                                    ? "bg-[hsl(var(--sunbird-status-ongoing-bg))] border-[hsl(var(--sunbird-status-ongoing-border))] text-[hsl(var(--sunbird-brown-dark))]"
                                    : "bg-gray-100 border-gray-300 text-gray-500"
                            }`}
                    >
                        <span className="text-[0.875rem] font-medium leading-[1.125rem]">
                            {status === "completed"
                                ? t('status.completed')
                                : status === "ongoing"
                                    ? t('status.ongoing')
                                    : t('status.notStarted')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="profile-learning-actions relative z-10">
                {status === "completed" && hasCertificate(course.courseId, course.batchId, title, course.issuedCertificates) ? (
                    <button
                        className={`flex items-center gap-2 transition-opacity min-w-fit ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                        disabled={isDownloading}
                        onClick={() => { downloadCertificate(course.courseId, course.batchId, title, course.issuedCertificates, course.completedOn); }}
                    >
                        {isDownloading ? (
                            <div className="w-[1.125rem] h-[1.125rem] border-2 border-sunbird-theme-accent-muted border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FiDownload className="w-[1.125rem] h-[1.125rem] text-sunbird-theme-accent-muted" />
                        )}
                        <span className="font-rubik font-medium text-[0.875rem] leading-none tracking-normal text-sunbird-theme-accent text-center whitespace-nowrap">
                            {isDownloading ? t('profileLearning.downloading') : t('common.downloadCertificate')}
                        </span>
                    </button>
                ) : status === "completed" ? (
                    <span className="font-rubik font-medium text-[0.875rem] leading-none tracking-normal text-sunbird-gray-75 text-center whitespace-nowrap">
                        {t('profileLearning.noCertificate')}
                    </span>
                ) : null}
            </div>
        </div>
    );
};

export default CourseRow;

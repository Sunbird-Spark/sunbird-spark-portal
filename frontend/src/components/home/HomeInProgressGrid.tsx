import { Link } from "react-router-dom";
import { useUserEnrolledCollections } from "../../hooks/useUserEnrolledCollections";
import type { TrackableCollection } from "../../types/TrackableCollections";
import { useAppI18n } from '@/hooks/useAppI18n';

const HomeInProgressGrid = () => {
    const { t } = useAppI18n();
    const { data, isLoading } = useUserEnrolledCollections();

    if (isLoading) {
        return (
            <section className="mb-8">
                <h3 className="home-section-title-large mb-4">{t('homeComponents.inProgress')}</h3>
                <div className="text-center py-8 text-sunbird-gray-77">{t('loading')}</div>
            </section>
        );
    }

    const inProgressCourses: TrackableCollection[] = (data?.data?.courses ?? [])
        .filter((course: TrackableCollection) => course.completionPercentage < 100);

    if (inProgressCourses.length === 0) {
        return (
            <section className="mb-8">
                <h3 className="home-section-title-large mb-4">{t('homeComponents.inProgress')}</h3>
                <div className="text-center py-8 text-sunbird-gray-77">{t('homeComponents.noCoursesInProgress')}</div>
            </section>
        );
    }

    return (
        <section className="mb-8">
            <h3 className="home-section-title-large mb-4">{t('homeComponents.inProgress')}</h3>

            <div className="home-inprogress-grid">
                {inProgressCourses.map((course: TrackableCollection) => (
                    <Link
                        key={course.courseId || course.contentId}
                        to={
                            course.lastReadContentId
                                ? `/collection/${course.collectionId}/batch/${course.batchId}/content/${course.lastReadContentId}`
                                : `/collection/${course.collectionId}/batch/${course.batchId}`
                        }
                        className="home-inprogress-card no-underline"
                    >
                        {/* Content */}
                        <div className="home-inprogress-content">
                            <div>
                                <div className="flex-1 min-w-0">
                                    <span className="home-inprogress-badge">
                                        {course.content?.primaryCategory || "Course"}
                                    </span>
                                    <h4 className="home-inprogress-card-title">
                                        {course.courseName || course.content?.name || "Untitled Course"}
                                    </h4>

                                </div>
                            </div>
                            <div className="home-inprogress-progress-container">
                                <div className="home-inprogress-progress-bar-wrapper">
                                    <div className="home-inprogress-progress-bar-bg">
                                        <div
                                            className="home-inprogress-progress-bar-fill"
                                            style={{ width: `${course.completionPercentage}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="home-inprogress-progress-text">{course.completionPercentage}%</span>
                            </div>
                        </div>
                        {/* Thumbnail */}
                        <div className="home-inprogress-thumbnail">
                            {course.courseLogoUrl || course.content?.appIcon ? (
                                <img
                                    src={course.courseLogoUrl || course.content?.appIcon}
                                    alt={course.courseName || "Untitled Course"}
                                    className="home-inprogress-thumbnail-img"
                                />
                            ) : (
                                <div className="home-inprogress-thumbnail-placeholder" />
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default HomeInProgressGrid;

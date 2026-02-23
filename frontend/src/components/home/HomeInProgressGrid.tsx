import { Link } from "react-router-dom";
import { useUserEnrolledCollections } from "../../hooks/useUserEnrolledCollections";
import type { TrackableCollection } from "../../types/TrackableCollections";

const HomeInProgressGrid = () => {
    const { data, isLoading } = useUserEnrolledCollections();

    if (isLoading) {
        return (
            <section className="mb-8">
                <h3 className="home-section-title-large mb-4">In Progress</h3>
                <div className="text-center py-8 text-sunbird-gray-77">Loading...</div>
            </section>
        );
    }

    const inProgressCourses: TrackableCollection[] = (data?.data?.courses ?? [])
        .filter((course: TrackableCollection) => course.completionPercentage < 100);

    if (inProgressCourses.length === 0) {
        return (
            <section className="mb-8">
                <h3 className="home-section-title-large mb-4">In Progress</h3>
                <div className="text-center py-8 text-sunbird-gray-77">No courses in progress</div>
            </section>
        );
    }

    return (
        <section className="mb-8">
            <h3 className="home-section-title-large mb-4">In Progress</h3>

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
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                            <div>
                                <div className="flex-1 min-w-0">
                                    <span className="home-inprogress-badge">
                                        {course.content?.primaryCategory || "Course"}
                                    </span>
                                    <h4 className="home-inprogress-card-title">
                                        {course.courseName || course.content?.name || "Untitled Course"}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-auto">
                                        <div className="flex-1">
                                            <div className="w-21 h-1.5 bg-sunbird-gray-f1 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-sunbird-brick rounded-full"
                                                    style={{ width: `${course.completionPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[0.625rem] font-medium text-sunbird-gray-77 shrink-0">{course.completionPercentage}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Thumbnail */}
                        <div className="w-[5.5rem] h-[5.5rem] rounded-2xl overflow-hidden shrink-0">
                            {course.courseLogoUrl || course.content?.appIcon ? (
                                <img
                                    src={course.courseLogoUrl || course.content?.appIcon}
                                    alt={course.courseName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-black" />
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default HomeInProgressGrid;

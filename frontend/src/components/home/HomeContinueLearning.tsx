import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { useCollection } from "@/hooks/useCollection";
import type { TrackableCollection } from "@/types/TrackableCollections";

// Circular progress component
const CircularProgress = ({ progress }: { progress: number }) => {
    const size = 24;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle (non-completed) */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className="stroke-sunbird-ginger/40"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle (completed) */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className="stroke-sunbird-brick"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
            />
        </svg>
    );
};

const HomeContinueLearning = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useUserEnrolledCollections();

    const lastAccessedCourse: TrackableCollection | undefined = (data?.data?.courses ?? [])
        .filter((c: TrackableCollection) => c.completionPercentage < 100 && c.lastContentAccessTime)
        .sort((a: TrackableCollection, b: TrackableCollection) =>
            (b.lastContentAccessTime ?? 0) - (a.lastContentAccessTime ?? 0)
        )[0];

    const { data: collectionData } = useCollection(lastAccessedCourse?.collectionId);

    if (isLoading || !lastAccessedCourse) return null;

    // Determine the content ID to navigate to
    const contentId = lastAccessedCourse.lastReadContentId
        ?? collectionData?.modules[0]?.lessons[0]?.id;

    const continueTo = `/collection/${lastAccessedCourse.collectionId}/batch/${lastAccessedCourse.batchId}/content/${contentId}`;

    const thumbnail = lastAccessedCourse.courseLogoUrl || lastAccessedCourse.content?.appIcon;
    const title = lastAccessedCourse.courseName || lastAccessedCourse.content?.name || "Untitled Course";

    return (
        <div className="home-continue-learning-card">
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Thumbnail */}
                <div className="home-continue-learning-thumbnail">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-black" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h4 className="home-continue-learning-title">
                            {title}
                        </h4>

                        {/* Progress */}
                        <div className="flex items-center gap-2 pt-4 lg:pt-5">
                            <CircularProgress progress={lastAccessedCourse.completionPercentage} />
                            <span className="text-sm text-muted-foreground">
                                Completed : {lastAccessedCourse.completionPercentage}%
                            </span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-6 lg:mt-0">
                        <Button
                            onClick={() => navigate(continueTo)}
                            className="home-continue-learning-btn group"
                        >
                            Continue Learning
                            <FiArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeContinueLearning;

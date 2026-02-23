import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { useQuery } from "@tanstack/react-query";
import { CollectionService } from "@/services/collection/CollectionService";
import type { TrackableCollection } from "@/types/TrackableCollections";
import type { HierarchyContentNode } from "@/types/collectionTypes";

const collectionService = new CollectionService();

// Helper function to get the first leaf content ID from hierarchy
const getFirstContentId = (node: HierarchyContentNode | undefined): string | null => {
    if (!node) return null;
    
    // If this node has no children, it's a leaf node
    if (!node.children || node.children.length === 0) {
        return node.identifier;
    }
    
    // Recursively search children for the first leaf node
    for (const child of node.children) {
        const firstId = getFirstContentId(child);
        if (firstId) return firstId;
    }
    
    return null;
};

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

    // Fetch hierarchy only if we need to find the first content
    const shouldFetchHierarchy = lastAccessedCourse && !lastAccessedCourse.lastReadContentId;
    const { data: hierarchyData } = useQuery({
        queryKey: ['course-hierarchy', lastAccessedCourse?.collectionId],
        queryFn: async () => {
            if (!lastAccessedCourse?.collectionId) return null;
            return collectionService.getHierarchy(lastAccessedCourse.collectionId);
        },
        enabled: shouldFetchHierarchy,
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading || !lastAccessedCourse) return null;

    // Determine the content ID to navigate to
    let contentId = lastAccessedCourse.lastReadContentId;
    if (!contentId && hierarchyData?.data?.content) {
        const firstContentId = getFirstContentId(hierarchyData.data.content);
        if (firstContentId) {
            contentId = firstContentId;
        }
    }

    const continueTo = contentId
        ? `/collection/${lastAccessedCourse.collectionId}/batch/${lastAccessedCourse.batchId}/content/${contentId}`
        : `/collection/${lastAccessedCourse.collectionId}/batch/${lastAccessedCourse.batchId}`;

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

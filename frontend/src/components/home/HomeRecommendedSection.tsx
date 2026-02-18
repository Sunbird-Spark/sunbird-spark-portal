import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import CollectionCard from "../content/CollectionCard";
import ResourceCard from "../content/ResourceCard";
import { useContentSearch } from "@/hooks/useContent";

interface HomeRecommendedSectionProps {
    creatorIds?: string[];
    enrolledCourseIds?: string[];
}

const HomeRecommendedSection = ({ creatorIds = [], enrolledCourseIds = [] }: HomeRecommendedSectionProps) => {
    const { data, isLoading } = useContentSearch({
        request: {
            filters: {
                status: ["Live"],
                objectType: ["Content"]
            },
            sort_by: {
                lastUpdatedOn: "desc"
            },
            limit: 10
        },
        enabled: true
    });

    // Filter out collections unless they are specific types we want to show
    // For now, we want to show Resources (PDF, Video, etc.) and avoid nested collections
    const recommendedItems = (data?.data?.content || [])
        .filter((item: any) => !enrolledCourseIds.includes(item.identifier))
        .slice(0, 3);

    if (!isLoading && recommendedItems.length === 0) {
        return (
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="home-section-title-large">Recommended Contents</h3>
                </div>
                <div className="text-gray-500 text-sm py-4">
                    No recommendations available based on your current courses.
                </div>
            </section>
        );
    }

    return (
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="home-section-title-large">Recommended Contents</h3>
                <Link to="/explore" className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors">
                    <FiArrowRight className="w-5 h-5 stroke-[0.1875rem]" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                {isLoading ? (
                     // Skeleton loading state
                     Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-[17.5rem]"></div>
                     ))
                ) : (
                    recommendedItems.map((item: any) => {
                        const isResource = item.mimeType !== "application/vnd.ekstep.content-collection";
                        
                        if (isResource) {
                            return <ResourceCard key={item.identifier} item={item} />;
                        }
                        
                        return <CollectionCard key={item.identifier} item={item} />;
                    })
                )}
            </div>
        </section>
    );
};

export default HomeRecommendedSection;


import { useState, useEffect, useRef } from "react";
import { useAppI18n } from "../hooks/useAppI18n";
import { FilterState } from "../pages/Explore";
import { searchContent } from "../services/ContentService";
import { Content } from "../types/content";
import { FiSearch } from "react-icons/fi";
import { CourseCard, ContentCourse } from "./common/CourseCard";
import { ResourceCard, ResourceItem } from "./common/ResourceCard";

// Components
import EmptyState from "../components/workspace/EmptyState";

// Exporting ContentType for filters if needed, or remove if unused elsewhere
export type ContentType = "Course" | "Collection" | "Resource" | "TV Series" | "Textbook" | "LessonPlan" | "Video" | "ExplanationContent" | "PracticeQuestionSet" | "PDF" | "Epub";

interface ExploreGridProps {
    filters: FilterState;
    query: string;
    sortBy: any;
}

const ExploreGrid = ({ filters, query, sortBy }: ExploreGridProps) => {
    const { t } = useAppI18n();
    // Using a union type or intersection for display items
    const [displayItems, setDisplayItems] = useState<(ContentCourse | ResourceItem)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    
    // Use refs for pagination to avoid closure staleness in scroll handler
    const offsetRef = useRef(0);
    const isFetchingRef = useRef(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const limit = 9;

    const fetchContent = async () => {
        if (isFetchingRef.current) return;
        
        isFetchingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const currentOffset = offsetRef.current;
            const currentSortBy = sortBy; 
            const currentQuery = query;
            const currentFilters = filters;
            
            // Build filters object
            const activeFilters: any = {};
            
            if (currentFilters.contentTypes.length > 0) {
                 activeFilters.contentType = currentFilters.contentTypes;
            }
            
            if (currentFilters.categories.length > 0) {
                 activeFilters.se_subjects = currentFilters.categories;
            }
             
            if(currentFilters.collections.length > 0) {
                activeFilters.primaryCategory = currentFilters.collections;
            }
            
            const data = await searchContent(limit, currentOffset, currentQuery, currentSortBy, activeFilters);
            const newContent = data.content || [];
            
            if (newContent.length < limit) {
                setHasMore(false);
            }

            const newItems: (ContentCourse | ResourceItem)[] = newContent.map((content: Content, index: number) => {
                const placeholderImages = [
                    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=250&fit=crop",
                ];
                
                // Determine type based on mimeType or contentType
                let type = content.contentType;
                if (content.mimeType === 'application/pdf') {
                    type = 'PDF';
                } else if (content.mimeType === 'application/epub+zip') {
                    type = 'Epub';
                } else if (content.mimeType && (content.mimeType.startsWith('video/') || content.mimeType === 'application/x-mpegURL')) {
                    type = 'Video';
                }

                // If it's one of the Resource types, map to ResourceItem
                if (['PDF', 'Epub', 'Video'].includes(type)) {
                    return {
                        id: content.identifier,
                        title: content.name,
                        type: type,
                        image: content.appIcon || placeholderImages[index % placeholderImages.length],
                        heightClass: "h-[24.5rem]" // Maintain consistent height with CourseCard
                    } as ResourceItem;
                }
                
                // Otherwise map to ContentCourse
                return {
                    id: content.identifier,
                    title: content.name,
                    type: type || "Course",
                    image: content.appIcon || placeholderImages[index % placeholderImages.length] || "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
                    rating: 4.5,
                    learners: "9k",
                    lessons: content.leafNodesCount || 10,
                } as ContentCourse;
            });

            setDisplayItems(prev => currentOffset === 0 ? newItems : [...prev, ...newItems]);
            offsetRef.current = currentOffset + newContent.length;
            setError(null);
        } catch (err) {
            console.error('Failed to fetch content:', err);
            setError('Failed to load courses');
            setHasMore(false);
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    };

    // Initial load and query change reset
    useEffect(() => {
        offsetRef.current = 0;
        setDisplayItems([]);
        setHasMore(true);
        fetchContent();
    }, [query, filters, sortBy]);

    // Infinite scroll observer
    useEffect(() => {
        if (!hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries && entries[0] && entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
                    fetchContent();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, isLoading, query, filters, sortBy]);
 

    return (
        <div className="flex flex-col pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                {displayItems.map((item) => {
                     if (['PDF', 'Epub', 'Video'].includes(item.type)) {
                         return <ResourceCard key={item.id} item={item as ResourceItem} />;
                     }
                     return <CourseCard key={item.id} course={item as ContentCourse} />;
                })}
                
                {!isLoading && displayItems.length === 0 && !error && (
                     <div className="col-span-full">
                        <EmptyState
                            title="No content found"
                            description=""
                            icon={FiSearch}
                        />
                    </div>
                )}
            </div>
            
            {/* Sentinel for infinite scroll */}
            <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mt-6">
                 {isLoading && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sunbird-brick"></div>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {!hasMore && !isLoading && displayItems.length > 0 && (
                    <p className="text-muted-foreground text-sm">No more content to show</p>
                )}
            </div>
        </div>
    );
};

export default ExploreGrid;

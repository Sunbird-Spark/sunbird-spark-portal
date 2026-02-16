
import { useState, useEffect, useRef } from "react";
import { useAppI18n } from "../hooks/useAppI18n";
import { FilterState } from "../pages/Explore";
import { ContentService } from "../services/ContentService";
import { FiSearch } from "react-icons/fi";
import CollectionCard from "./content/CollectionCard";
import ResourceCard from "./content/ResourceCard";
import { ContentSearchItem } from "@/types/workspaceTypes";

// Components
import EmptyState from "../components/workspace/EmptyState";

interface ExploreGridProps {
    filters: FilterState;
    query: string;
    sortBy: any;
}

const ExploreGrid = ({ filters, query, sortBy }: ExploreGridProps) => {
    const { t } = useAppI18n();
    const [displayItems, setDisplayItems] = useState<ContentSearchItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    
    const offsetRef = useRef(0);
    const isFetchingRef = useRef(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const limit = 9;
    const contentService = new ContentService();

    const fetchContent = async (isNewQuery = false) => {
        if (!isNewQuery && isFetchingRef.current) return;
        
        isFetchingRef.current = true;
        const requestId = ++requestIdRef.current;
        
        setIsLoading(true);
        setError(null);

        try {
            const currentOffset = isNewQuery ? 0 : offsetRef.current;
            
            // Build filters object
            const activeFilters: any = {
                objectType: 'Content'
            };
            
            if (filters.contentTypes.length > 0) {
                 activeFilters.contentType = filters.contentTypes;
            }
            
            if (filters.categories.length > 0) {
                 activeFilters.se_subjects = filters.categories;
            }
             
            if(filters.collections.length > 0) {
                activeFilters.primaryCategory = filters.collections;
            }
            
            const response = await contentService.contentSearch({
                limit,
                offset: currentOffset,
                query,
                sort_by: sortBy,
                filters: activeFilters
            });
            
            if (requestId !== requestIdRef.current) return;

            const newContent = response.data?.content || [];
            
            if (newContent.length < limit) {
                setHasMore(false);
            }

            setDisplayItems(prev => currentOffset === 0 ? newContent : [...prev, ...newContent]);
            offsetRef.current = currentOffset + newContent.length;
            setError(null);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            console.error('Failed to fetch content:', err);
            setError('Failed to load content');
            setHasMore(false);
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
                isFetchingRef.current = false;
            }
        }
    };

    // Initial load and query change reset
    useEffect(() => {
        offsetRef.current = 0;
        setDisplayItems([]);
        setHasMore(true);
        fetchContent(true);
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
                    const isResource = ['application/pdf', 'application/epub+zip'].includes(item.mimeType || '') || 
                                     (item.mimeType && (item.mimeType.startsWith('video/') || item.mimeType === 'application/x-mpegURL'));
                    
                    if (isResource) {
                        return <ResourceCard key={item.identifier} item={item} />;
                    }
                    
                    return <CollectionCard key={item.identifier} item={item} />;
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

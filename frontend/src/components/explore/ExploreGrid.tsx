
import { useState, useEffect, useRef } from "react";
import { useAppI18n } from "../../hooks/useAppI18n";
import { FilterState } from "../../pages/Explore";
import { useContentSearch } from "../../hooks/useContent";
import { FiSearch } from "react-icons/fi";
import CollectionCard from "../content/CollectionCard";
import ResourceCard from "../content/ResourceCard";
import { ContentSearchItem } from "@/types/workspaceTypes";

// Components
import EmptyState from "../workspace/EmptyState";

interface ExploreGridProps {
    filters: FilterState;
    query: string;
    sortBy: any;
}

const ExploreGrid = ({ filters, query, sortBy }: ExploreGridProps) => {
    const { t } = useAppI18n();
    const [displayItems, setDisplayItems] = useState<ContentSearchItem[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const observerTarget = useRef<HTMLDivElement>(null);
    const limit = 9;

    // Reset when search parameters change
    useEffect(() => {
        setOffset(0);
        setDisplayItems([]);
        setHasMore(true);
    }, [query, filters, sortBy]);

    // Build active filters
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

    const { data, isLoading: isQueryLoading, error: queryError } = useContentSearch({
        request: {
            limit,
            offset,
            query,
            sort_by: sortBy,
            filters: activeFilters
        }
    });

    // Update display items when data arrives
    useEffect(() => {
        if (data?.data?.content) {
            const newContent = data.data.content;
            if (newContent.length < limit) {
                setHasMore(false);
            }
            
            if (offset === 0) {
                setDisplayItems(newContent);
            } else {
                setDisplayItems(prev => {
                    // Filter out duplicates just in case
                    const existingIds = new Set(prev.map(item => item.identifier));
                    const uniqueNewItems = newContent.filter(item => !existingIds.has(item.identifier));
                    return [...prev, ...uniqueNewItems];
                });
            }
        }
    }, [data, offset]);

    // Error handling
    useEffect(() => {
        if (queryError) {
            setError(queryError.message || 'Failed to load content');
            setHasMore(false);
        } else {
            setError(null);
        }
    }, [queryError]);

    // Infinite scroll observer
    useEffect(() => {
        if (!hasMore || isQueryLoading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries?.[0]?.isIntersecting && hasMore && !isQueryLoading && displayItems.length > 0) {
                    setOffset(prev => prev + limit);
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
    }, [hasMore, isQueryLoading, displayItems.length]);

    const isLoading = isQueryLoading && offset === 0;
    const isFetchingMore = isQueryLoading && offset > 0;

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
                 {(isLoading || isFetchingMore) && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sunbird-brick"></div>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {!hasMore && !(isLoading || isFetchingMore) && displayItems.length > 0 && (
                    <p className="text-muted-foreground text-sm">No more content to show</p>
                )}
            </div>
        </div>
    );
};

export default ExploreGrid;

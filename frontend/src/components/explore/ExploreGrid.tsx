import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAppI18n } from "../../hooks/useAppI18n";
import { FilterState } from "../../pages/Explore";
import { useContentSearch } from "../../hooks/useContent";
import { FiSearch } from "react-icons/fi";
import CollectionCard from "../content/CollectionCard";
import ResourceCard from "../content/ResourceCard";
import { ContentSearchItem } from "@/types/workspaceTypes";
import PageLoader from "../common/PageLoader";

// Components
import EmptyState from "../workspace/EmptyState";

const COLLECTION_MIME_TYPE = "application/vnd.ekstep.content-collection";

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
    
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);
    const limit = 9;

    // Build active filters — memoized to prevent infinite re-renders
    const activeFilters = useMemo(() => {
        return {
            objectType: ['Content', 'QuestionSet'],
            ...Object.fromEntries(
                Object.entries(filters).filter(([, values]) => values.length > 0)
            ),
        };
    }, [filters]);

    // Reset when search parameters change
    useEffect(() => {
        setOffset(0);
        setDisplayItems([]);
        setHasMore(true);
    }, [query, activeFilters, sortBy]);

    const { data, isLoading: isQueryLoading, error: queryError } = useContentSearch({
        request: {
            limit,
            offset,
            query,
            sort_by: sortBy,
            filters: activeFilters
        }
    });

    // Refs so the IntersectionObserver callback always reads the latest state
    // without needing the observer to be recreated on every state change.
    const hasMoreRef = useRef(hasMore);
    const isQueryLoadingRef = useRef(isQueryLoading);
    const displayItemsLengthRef = useRef(displayItems.length);
    hasMoreRef.current = hasMore;
    isQueryLoadingRef.current = isQueryLoading;
    displayItemsLengthRef.current = displayItems.length;

    // Update display items when data arrives
    useEffect(() => {
        if (data?.data?.content || data?.data?.QuestionSet) {
            const newContent = [
                ...(data.data?.content ?? []),
                ...(data.data?.QuestionSet ?? []),
            ];
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

    // Callback ref for the scroll sentinel. Using a callback ref (instead of
    // useRef + useEffect[]) ensures the observer is attached as soon as the
    // element actually mounts — which only happens after the initial load
    // completes (the PageLoader early-return means the sentinel div is absent
    // from the DOM during the first render, so a one-time useEffect would
    // never observe it).
    const observerTarget = useCallback((node: HTMLDivElement | null) => {
        if (observerInstanceRef.current) {
            observerInstanceRef.current.disconnect();
            observerInstanceRef.current = null;
        }
        if (node) {
            const observer = new IntersectionObserver(
                entries => {
                    if (
                        entries?.[0]?.isIntersecting &&
                        hasMoreRef.current &&
                        !isQueryLoadingRef.current &&
                        displayItemsLengthRef.current > 0
                    ) {
                        setOffset(prev => prev + limit);
                    }
                },
                { threshold: 0.1 }
            );
            observer.observe(node);
            observerInstanceRef.current = observer;
        }
    }, []);

    const isLoading = isQueryLoading && offset === 0;
    const isFetchingMore = isQueryLoading && offset > 0;

    // Show PageLoader for initial load
    if (isLoading) {
        return (
            <div className="flex flex-col pb-8">
                <PageLoader message={t("loading")} fullPage={false} />
            </div>
        );
    }

    // Show PageLoader for error state
    if (error && offset === 0) {
        return (
            <div className="flex flex-col pb-8">
                <PageLoader 
                    error={error} 
                    onRetry={() => window.location.reload()}
                    fullPage={false} 
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                {displayItems.map((item) => {
                    return item.mimeType === COLLECTION_MIME_TYPE ? (
                        <CollectionCard key={item.identifier} item={item} />
                    ) : (
                        <ResourceCard key={item.identifier} item={item} />
                    );
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
                 {isFetchingMore && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sunbird-brick"></div>
                )}
                {!hasMore && !isFetchingMore && displayItems.length > 0 && (
                    <p className="text-muted-foreground text-sm">No more content to show</p>
                )}
            </div>
        </div>
    );
};

export default ExploreGrid;

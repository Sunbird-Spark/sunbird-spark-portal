import { useRef, useEffect } from "react";
import { FiUpload, FiUsers, FiLoader, FiAlertCircle } from "react-icons/fi";
import CreateOptions from "@/components/workspace/CreateOptions";
import WorkspaceContentCard from "@/components/workspace/WorkspaceContentCard";
import WorkspaceContentList from "@/components/workspace/WorkspaceContentList";
import EmptyState from "@/components/workspace/EmptyState";
import { Button } from "@/components/common/Button";
import { type WorkspaceItem, type UserRole } from "@/types/workspaceTypes";

export interface LockedContentMap {
  [contentId: string]: { creatorName: string };
}

interface WorkspacePageContentProps {
  showCreateModal: boolean;
  activeView: string;
  filteredItems: WorkspaceItem[];
  viewMode: 'grid' | 'list';
  t: (key: string) => string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isError: boolean;
  error: Error | null;
  userRole: UserRole;
  lockedContentMap?: LockedContentMap;
  onLoadMore: () => void;
  onRetry: () => void;
  onCreateOption: (optionId: string) => void;
  onCreateClick: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export default function WorkspacePageContent({
  showCreateModal,
  activeView,
  filteredItems,
  viewMode,
  t,
  isLoading,
  isLoadingMore,
  hasMore,
  isError,
  error,
  onLoadMore,
  onRetry,
  onCreateOption,
  onCreateClick,
  onEdit,
  onDelete,
  onView,
  userRole,
  lockedContentMap = {},
}: WorkspacePageContentProps) {
  if (showCreateModal || activeView === 'create') {
    return (
      <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-border">
        <CreateOptions onOptionSelect={onCreateOption} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FiAlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold font-rubik mb-2">{t('somethingWentWrong')}</h3>
        <p className="text-sm text-muted-foreground font-rubik mb-4 max-w-md">
          {error?.message ?? t('failedToLoadContent')}
        </p>
        <Button
          variant="outline"
          onClick={onRetry}
          className="font-rubik rounded-xl"
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  // Loading state (initial load for a tab)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <FiLoader className="w-6 h-6 animate-spin text-sunbird-brick mr-3" />
        <span className="text-sm text-muted-foreground font-rubik">{t('loadingContent')}</span>
      </div>
    );
  }

  const pageTitleMap: Record<string, { title: string; desc: string }> = {
    'pending-review': { title: "No contents to review", desc: "There are no contents pending your review at this time." },
    'my-published': { title: "No published contents", desc: "You have not published any contents yet." },
    'uploads': { title: "No uploads yet", desc: "Upload PDF, video, or other content files to get started." },
    'collaborations': { title: "No collaborations", desc: "Content shared with you will appear here." },
  };

  // Empty state
  if (filteredItems.length === 0) {
    if (pageTitleMap[activeView]) {
      const { title, desc } = pageTitleMap[activeView];
      return (
        <EmptyState
          title={title}
          description={desc}
          variant="default"
          {...(activeView === 'uploads' ? { 
            actionLabel: t('uploadContent'),
            onAction: () => onCreateOption('upload-pdf'),
            icon: FiUpload
          } : activeView === 'collaborations' ? {
            icon: FiUsers
          } : {})}
        />
      );
    }
    return (
      <EmptyState
        title={t('createFirst')}
        description={t('createFirst')}
        actionLabel={t('createContent')}
        onAction={onCreateClick}
        variant="default"
      />
    );
  }

  // Content listing + infinite scroll
  return (
    <div>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map(item => (
            <WorkspaceContentCard
              key={item.id}
              item={item}
              lockInfo={lockedContentMap[item.id]}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      ) : (
        <WorkspaceContentList
          items={filteredItems}
          lockedContentMap={lockedContentMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      )}

      {/* Infinite scroll sentinel */}
      <InfiniteScrollSentinel
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
        t={t}
      />
    </div>
  );
}

/**
 * Invisible sentinel element that triggers `onLoadMore` when scrolled into view.
 * Uses IntersectionObserver with a 200px root margin so the next page starts
 * loading before the user actually reaches the bottom.
 */
function InfiniteScrollSentinel({
  hasMore,
  isLoadingMore,
  onLoadMore,
  t,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  t: (key: string) => string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (!hasMore && !isLoadingMore) return null;

  return (
    <div ref={sentinelRef} className="flex justify-center py-8">
      {isLoadingMore && (
        <div className="flex items-center gap-2">
          <FiLoader className="w-5 h-5 animate-spin text-sunbird-brick" />
          <span className="text-sm text-muted-foreground font-rubik">{t('loadingMore')}</span>
        </div>
      )}
    </div>
  );
}

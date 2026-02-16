import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import { type WorkspaceView, type UserRole, type ViewMode, type SortOption, type ContentTypeFilter } from "@/types/workspaceTypes";
import WorkspaceToolbar from "@/components/workspace/WorkspaceToolbar";
import { type WorkspaceItem } from "@/types/workspaceTypes";
import { useContentSearch } from "@/hooks/useContent";
import { mapContentToWorkspaceItem } from "@/services/workspace";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppI18n } from "@/hooks/useAppI18n";
import WorkspacePageHeader from "./WorkspacePageHeader";
import WorkspacePageContent from "./WorkspacePageContent";
import CreateContentModal from "./CreateContentModal";
import "../home/home.css";
import "./workspace.css";

/** Option IDs that should open the generic (upload) editor */
const GENERIC_EDITOR_OPTIONS = ['upload-pdf', 'upload-video', 'upload-youtube'];

const WorkspacePage = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useAppI18n();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("workspace");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [userRole, setUserRole] = useState<UserRole>('creator');
  const [activeView, setActiveView] = useState<WorkspaceView>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy] = useState<SortOption>('updated');
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const showContent = !['create', 'uploads', 'collaborations'].includes(activeView);
  const { data: searchData, isLoading, refetch } = useContentSearch({
    request: showContent
      ? { sort_by: sortBy === 'updated' ? { lastUpdatedOn: 'desc' } : sortBy === 'created' ? { createdOn: 'desc' } : { name: 'asc' } }
      : undefined,
    enabled: showContent,
  });

  const items: WorkspaceItem[] = useMemo(() => {
    if (!searchData?.data) return [];
    const content = searchData.data.content ?? [];
    const questionSets = searchData.data.QuestionSet ?? [];
    return [...content, ...questionSets].map(mapContentToWorkspaceItem);
  }, [searchData]);

  const counts = useMemo(() => {
    const review = items.filter((i) => i.status === 'review').length;
    return {
      all: items.length,
      drafts: items.filter((i) => i.status === 'draft').length,
      review,
      published: items.filter((i) => i.status === 'published').length,
      pendingReview: review,
    };
  }, [items]);

  // Reset view when role changes
  useEffect(() => {
    const nextView: WorkspaceView = userRole === 'creator' ? 'all' : 'pending-review';
    setActiveView((prev) => (prev === nextView ? prev : nextView));
  }, [userRole]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    // Apply view-specific filters
    if (activeView === 'drafts') filtered = filtered.filter(i => i.status === 'draft');
    else if (activeView === 'review' || activeView === 'pending-review') filtered = filtered.filter(i => i.status === 'review');
    else if (activeView === 'published' || activeView === 'my-published') filtered = filtered.filter(i => i.status === 'published');
    else if (activeView === 'all') { /* show all */ }
    
    // Apply type filter
    if (typeFilter !== 'all') filtered = filtered.filter(i => i.type === typeFilter);
    
    // Apply sorting (sort a copy so we don't mutate filtered)
    const toTime = (s: string | null) => (s ? new Date(s).getTime() : 0);
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'updated': return toTime(b.updatedAt) - toTime(a.updatedAt);
        case 'created': return toTime(b.createdAt) - toTime(a.createdAt);
        case 'title': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
  }, [items, activeView, typeFilter, sortBy]);

  const handleCreateOption = (optionId: string) => {
    setShowCreateModal(false);

    if (GENERIC_EDITOR_OPTIONS.includes(optionId)) {
      // Navigate to the generic editor for upload content types
      navigate('/workspace/content/edit/generic');
      return;
    }

    toast({
      title: "Starting Editor",
      description: `Launching ${optionId.replace('-', ' ')} editor...`
    });
  };

  const handleEdit = (_id: string) => {
    toast({ title: "Edit Content", description: "Opening content editor..." });
  };

  const handleDelete = (_id: string) => {
    toast({ 
      title: "Content Deleted", 
      description: "The content has been removed.", 
      variant: "destructive" 
    });
    void refetch();
  };

  const handleView = (_id: string) => {
    toast({ title: "Preview", description: "Opening content preview..." });
  };

  const handleSubmitReview = (_id: string) => {
    toast({ 
      title: "Submitted for Review", 
      description: "Your content has been submitted for review." 
    });
    void refetch();
  };

  const handleCreateClick = () => setShowCreateModal(true);

  const navigationProps = {
    activeView,
    onViewChange: setActiveView,
    userRole,
    onRoleChange: setUserRole,
    counts,
    viewMode,
    onViewModeChange: setViewMode,
    typeFilter,
    onTypeFilterChange: setTypeFilter,
    contentCount: !['create', 'uploads', 'collaborations'].includes(activeView) ? filteredItems.length : undefined,
    onCreateClick: handleCreateClick,
  };

  if (showContent && isLoading) return <PageLoader message={t('loading')} />;

  return (
    <div className="workspace-container">
      <WorkspacePageHeader
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        onMenuOpen={() => setIsSidebarOpen(true)}
      />

      <div className="flex flex-1 relative transition-all">
        {/* Sidebar - Mobile (same as Home/Profile) */}
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <HomeSidebar
                activeNav={activeNav}
                onNavChange={(nav) => {
                  setActiveNav(nav);
                  setIsSidebarOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        ) : (
          /* Sidebar - Desktop (same as Home/Profile) */
          <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
            {isSidebarOpen && (
              <>
                <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} />
                <div className="absolute -right-3 top-2 z-20">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-6 h-6 bg-sunbird-gray-ef rounded-full flex items-center justify-center shadow-sm text-sunbird-brick hover:opacity-80 transition-opacity"
                  >
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="workspace-main-content">
            <div className="workspace-content-wrapper">
              <WorkspaceToolbar {...navigationProps} />
              <WorkspacePageContent
                showCreateModal={showCreateModal}
                activeView={activeView}
                filteredItems={filteredItems}
                viewMode={viewMode}
                t={t}
                onCreateOption={handleCreateOption}
                onCreateClick={handleCreateClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onSubmitReview={handleSubmitReview}
              />
            </div>
          </main>
          <CreateContentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onOptionSelect={handleCreateOption} />
        </div>
      </div>

      {/* Footer - full width below sidebar + content (same as Home/Profile) */}
      <Footer />
    </div>
  );
};

export default WorkspacePage;

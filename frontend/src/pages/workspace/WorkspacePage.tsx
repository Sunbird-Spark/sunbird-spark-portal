import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import { type WorkspaceView, type UserRole, type ViewMode, type SortOption, type ContentTypeFilter } from "@/types/workspaceTypes";
import WorkspaceToolbar from "@/components/workspace/WorkspaceToolbar";
import { type WorkspaceItem } from "@/types/workspaceTypes";
import { useContentSearch } from "@/hooks/useContent";
import { mapContentToWorkspaceItem } from "@/services/workspace";
import { ContentService } from "@/services/ContentService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { useUserRead } from "@/hooks/useUserRead";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppI18n } from "@/hooks/useAppI18n";
import WorkspacePageHeader from "./WorkspacePageHeader";
import WorkspacePageContent from "./WorkspacePageContent";
import CreateContentModal from "./CreateContentModal";
import ContentNameDialog from "./ContentNameDialog";
import "../home/home.css";
import "./workspace.css";

// Resource editor option IDs that should trigger the content editor
const RESOURCE_EDITOR_OPTIONS = ['interactive', 'quiz', 'story'];

const RESOURCE_EDITOR_OPTION_LABELS: Record<string, string> = {
  interactive: 'Interactive Activity',
  quiz: 'Quiz & Assessment',
  story: 'Story & Game',
};

const contentService = new ContentService();

const WorkspacePage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: userData } = useUserRead();
  const { toast } = useToast();
  const { t } = useAppI18n();
  const [activeNav, setActiveNav] = useState("workspace");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [userRole, setUserRole] = useState<UserRole>('creator');
  const [activeView, setActiveView] = useState<WorkspaceView>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy] = useState<SortOption>('updated');
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const showContent = !['create', 'uploads', 'collaborations'].includes(activeView);
  const { data: searchData, isLoading, isError, error, refetch } = useContentSearch({
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

  useEffect(() => {
    const nextView: WorkspaceView = userRole === 'creator' ? 'all' : 'pending-review';
    setActiveView((prev) => (prev === nextView ? prev : nextView));
  }, [userRole]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];
    if (activeView === 'drafts') filtered = filtered.filter(i => i.status === 'draft');
    else if (activeView === 'review' || activeView === 'pending-review') filtered = filtered.filter(i => i.status === 'review');
    else if (activeView === 'published' || activeView === 'my-published') filtered = filtered.filter(i => i.status === 'published');
    else if (activeView === 'all') { /* show all */ }
    
    // Apply type filter
    if (typeFilter !== 'all') filtered = filtered.filter(i => i.type === typeFilter);
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
    if (RESOURCE_EDITOR_OPTIONS.includes(optionId)) {
      setShowCreateModal(false);
      setSelectedOption(optionId);
      setShowNameDialog(true);
    } else {
      setShowCreateModal(false);
      toast({
        title: "Starting Editor",
        description: `Launching ${optionId.replace('-', ' ')} editor...`
      });
    }
  };

  const handleContentNameSubmit = async (name: string) => {
    setIsCreating(true);
    try {
      const first = userData?.data?.response?.firstName?.trim();
      const last = userData?.data?.response?.lastName?.trim();
      const creator = first || last ? [first, last].filter(Boolean).join(" ") : "anonymous";
      const response = await contentService.contentCreate(name, {
        createdBy: userAuthInfoService.getUserId() || '', creator,
        mimeType: 'application/vnd.ekstep.ecml-archive', contentType: 'Resource', primaryCategory: 'Learning Resource',
      });
      const contentId = response.data?.identifier || response.data?.content_id;
      if (contentId) {
        setShowNameDialog(false);
        setSelectedOption(null);
        navigate(`/edit/content-editor/${contentId}`);
      } else {
        console.error("Content creation response missing identifier:", response);
        toast({ title: "Error", description: "Unexpected server response. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to create content:', error);
      toast({ title: "Error", description: "Failed to create content. Please try again.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
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

  return (
    <div className="workspace-container">
      <WorkspacePageHeader
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        onMenuOpen={() => setIsSidebarOpen(true)}
      />

      <div className="flex flex-1 relative transition-all">
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
        <div className="flex-1 flex flex-col min-w-0">
          <main className="workspace-main-content">
            <div className="workspace-content-wrapper">
              <WorkspaceToolbar {...navigationProps} />
              {showContent && isLoading && (
                <PageLoader message={t('loading')} fullPage={false} />
              )}
              {showContent && isError && error && (
                <PageLoader
                  error={error.message}
                  onRetry={() => refetch()}
                  fullPage={false}
                />
              )}
              {(!showContent || (!isLoading && !isError)) && (
                <WorkspacePageContent showCreateModal={showCreateModal}
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
              )}
            </div>
          </main>
          <CreateContentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onOptionSelect={handleCreateOption} />
          <ContentNameDialog
            open={showNameDialog}
            onClose={() => { setShowNameDialog(false); setSelectedOption(null); }}
            onSubmit={handleContentNameSubmit}
            isLoading={isCreating}
            optionTitle={selectedOption ? RESOURCE_EDITOR_OPTION_LABELS[selectedOption] : undefined}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WorkspacePage;

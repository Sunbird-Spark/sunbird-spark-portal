import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import { type WorkspaceView, type UserRole, type ViewMode, type SortOption, type ContentTypeFilter } from "@/types/workspaceTypes";
import WorkspaceToolbar from "@/components/workspace/WorkspaceToolbar";
import { ContentService } from "@/services/ContentService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { useUserRead } from "@/hooks/useUserRead";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useWorkspace } from "@/hooks/useWorkspace";
import Header from "@/components/home/Header";
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
  const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen } = useSidebarState(!isMobile);
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
  const userId = userAuthInfoService.getUserId();

  const {
    contents,
    counts,
    totalCount,
    isLoading,
    isLoadingMore,
    isCountsLoading,
    error,
    hasMore,
    loadMore,
    refetchCounts,
    refetchAll,
  } = useWorkspace({
    userId,
    activeTab: activeView,
    sortBy,
    typeFilter,
    userRole,
    enabled: showContent,
  });

  // Reset view when role changes
  useEffect(() => {
    const nextView: WorkspaceView = userRole === 'creator' ? 'all' : 'pending-review';
    setActiveView((prev) => (prev === nextView ? prev : nextView));
  }, [userRole]);

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
    refetchAll();
  };

  const handleView = (_id: string) => {
    toast({ title: "Preview", description: "Opening content preview..." });
  };

  const handleSubmitReview = (_id: string) => {
    toast({
      title: "Submitted for Review",
      description: "Your content has been submitted for review."
    });
    refetchAll();
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
    contentCount: showContent ? contents.length : undefined,
    totalCount: showContent ? totalCount : undefined,
    onCreateClick: handleCreateClick,
  };

  return (
    <div className="workspace-container">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(true)}
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
            <HomeSidebar
              activeNav={activeNav}
              onNavChange={setActiveNav}
              collapsed={!isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="workspace-main-content">
            {showContent && isCountsLoading && isLoading ? (
              <PageLoader message={t('loading')} fullPage={false} />
            ) : (
              <div className="workspace-content-wrapper">
                <WorkspaceToolbar {...navigationProps} />
                <WorkspacePageContent
                  showCreateModal={showCreateModal}
                  activeView={activeView}
                  filteredItems={contents}
                  viewMode={viewMode}
                  t={t}
                  isLoading={isLoading}
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMore}
                  isError={!!error}
                  error={error}
                  onLoadMore={loadMore}
                  onRetry={refetchAll}
                  onCreateOption={handleCreateOption}
                  onCreateClick={handleCreateClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onSubmitReview={handleSubmitReview}
                />
              </div>
            )}
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

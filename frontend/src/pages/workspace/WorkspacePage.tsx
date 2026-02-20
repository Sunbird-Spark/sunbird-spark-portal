/* eslint-disable max-lines */
import { useState, useEffect, useRef, useMemo } from "react";
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
import { ContentService } from "@/services/ContentService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { useOrganizationSearch } from "@/hooks/useOrganization";
import { useChannel } from "@/hooks/useChannel";
import { useUserRead } from "@/hooks/useUserRead";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useWorkspace } from "@/hooks/useWorkspace";
import Header from "@/components/home/Header";
import WorkspacePageContent from "./WorkspacePageContent";
import CreateContentModal from "./CreateContentModal";
import ContentNameDialog from "./ContentNameDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import "../home/home.css";
import "./workspace.css";
import { QumlEditor } from "@/components/quml-editor";

// Resource editor option IDs that should trigger the content editor
const RESOURCE_EDITOR_OPTIONS = ['quiz', 'story'];

// Collection editor option IDs that should trigger the collection editor
const COLLECTION_EDITOR_OPTIONS = ['course','collection'];

/** QuML editor option IDs */
const QUML_EDITOR_OPTIONS = ['question-set', 'question-editor'];

const EDITOR_OPTION_LABELS: Record<string, string> = {
  quiz: 'Quiz & Assessment',
  story: 'Story & Game',
  course: 'Course',
  collection: 'Collection',
};

const COLLECTION_CONTENT_CONFIG: Record<string, {
  mimeType: string;
  contentType: string;
  primaryCategory: string;
  resourceType: string;
  description: string;
}> = {
  course: {
    mimeType: 'application/vnd.ekstep.content-collection',
    contentType: 'Course',
    primaryCategory: 'Course',
    resourceType: 'Course',
    description: 'Enter description for Course',
  },
  collection: {
    mimeType: 'application/vnd.ekstep.content-collection',
    contentType: 'Collection',
    primaryCategory: 'Content Playlist',
    resourceType: 'Collection',
    description: 'Enter description for Collection',
  },
};

const contentService = new ContentService();
/** Option IDs that should open the generic (upload) editor */
const GENERIC_EDITOR_OPTIONS = ['upload-pdf', 'upload-video'];

const WorkspacePage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: userData } = useUserRead();
  const { data: defaultChannelData } = useSystemSetting('default_channel');
  const slug = defaultChannelData?.data?.response?.value;

  // Pre-fetch org data using tanstack mutation when slug becomes available
  const orgSearch = useOrganizationSearch();
  const [orgData, setOrgData] = useState<any>(null);
  const orgFetchAttempted = useRef(false);

  useEffect(() => {
    if (slug && !orgFetchAttempted.current) {
      orgFetchAttempted.current = true;
      const filters: Record<string, any> = { isTenant: true, slug };
      orgSearch.mutateAsync({ filters }).then((res) => {
        setOrgData(res?.data?.response?.content?.[0] ?? null);
      }).catch((err) => {
        orgFetchAttempted.current = false;
        console.warn('Failed to fetch org data:', err);
      });
    }
  }, [slug]);

  // Pre-fetch channel/framework data using tanstack query when org is available
  const orgChannelId = orgData?.hashTagId || orgData?.identifier || '';
  const { data: channelData } = useChannel(orgChannelId);
  const orgFramework = channelData?.data?.channel?.frameworks?.[0]?.identifier || '';

  const { toast } = useToast();
  const { t } = useAppI18n();
  const [activeNav, setActiveNav] = useState("workspace");
  const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen } = useSidebarState(!isMobile);

  // Derive available roles from user profile
  const userRoles: string[] = useMemo(() => {
    const roles = userData?.data?.response?.roles;
    if (!Array.isArray(roles)) return [];
    return roles
      .map((roleInfo) => roleInfo?.role)
      .filter((role): role is string => Boolean(role));
  }, [userData]);

  const hasCreatorRole = userRoles.includes('CONTENT_CREATOR');
  const hasReviewerRole = userRoles.includes('CONTENT_REVIEWER');

  // Default to creator if available, otherwise reviewer
  const [userRole, setUserRole] = useState<UserRole>('creator');

  // Keep selected role valid as user roles become available.
  useEffect(() => {
    setUserRole((prevRole) => {
      if (prevRole === 'creator' && hasCreatorRole) return prevRole;
      if (prevRole === 'reviewer' && hasReviewerRole) return prevRole;
      if (hasCreatorRole) return 'creator';
      if (hasReviewerRole) return 'reviewer';
      return 'creator';
    });
  }, [hasCreatorRole, hasReviewerRole]);
  const [activeView, setActiveView] = useState<WorkspaceView>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy] = useState<SortOption>('updated');
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'delete'; contentId: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [retiredContentIds, setRetiredContentIds] = useState<string[]>([]);

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
    refetchAll,
  } = useWorkspace({
    userId,
    activeTab: activeView,
    sortBy,
    typeFilter,
    userRole,
    orgId: orgChannelId,
    enabled: showContent,
  });

  const visibleContents = useMemo(
    () => contents.filter((content) => !retiredContentIds.includes(content.id)),
    [contents, retiredContentIds],
  );

  // Reset view when role changes
  useEffect(() => {
    const nextView: WorkspaceView = userRole === 'creator' ? 'all' : 'pending-review';
    setActiveView((prev) => (prev === nextView ? prev : nextView));
  }, [userRole]);

  const handleCreateOption = (optionId: string) => {
    setShowCreateModal(false);
    if (RESOURCE_EDITOR_OPTIONS.includes(optionId) || COLLECTION_EDITOR_OPTIONS.includes(optionId)) {
      setSelectedOption(optionId);
      setShowNameDialog(true);
    } else if (GENERIC_EDITOR_OPTIONS.includes(optionId)) {
      navigate('/workspace/content/edit/generic');
      return;
    }else if (QUML_EDITOR_OPTIONS.includes(optionId)) {
      setShowCreateModal(false);
      toast({
        title: "Starting Editor",
        description: `Launching ${optionId.replace('-', ' ')} editor...`
      });
    } else {
      setShowCreateModal(false);
      toast({
        title: "Starting Editor",
        description: `Launching ${optionId.replace('-', ' ')} editor...`
      });
    }
  };

  const handleResourceCreate = async (name: string) => {
    const first = userData?.data?.response?.firstName?.trim();
    const last = userData?.data?.response?.lastName?.trim();
    const creator = first || last ? [first, last].filter(Boolean).join(" ") : "anonymous";
    const response = await contentService.contentCreate(name, {
      createdBy: userAuthInfoService.getUserId() || '',
      creator,
      mimeType: 'application/vnd.ekstep.ecml-archive',
      contentType: 'Resource',
      primaryCategory: 'Learning Resource',
    });
    const contentId = response.data?.identifier || response.data?.content_id;
    if (!contentId) {
      console.error("Content creation response missing identifier:", response);
      throw new Error("Unexpected server response. Please try again.");
    }
    navigate(`/edit/content-editor/${contentId}`);
  };

  const handleCollectionCreate = async (name: string, optionId: string) => {
    const first = userData?.data?.response?.firstName?.trim();
    const last = userData?.data?.response?.lastName?.trim();
    const creator = first || last ? [first, last].filter(Boolean).join(" ") : "anonymous";
    const config = COLLECTION_CONTENT_CONFIG[optionId];

    const organisation: string[] = orgData?.orgName ? [orgData.orgName] : [];
    const createdFor: string[] = orgChannelId ? [orgChannelId] : [];
    const targetFWIds: string[] = orgFramework ? [orgFramework] : [];

    const response = await contentService.contentCreate(name, {
      createdBy: userAuthInfoService.getUserId() || '',
      creator,
      ...config,
      organisation,
      createdFor,
      targetFWIds,
    });
    const contentId = response.data?.identifier || response.data?.content_id;
    if (!contentId) {
      console.error("Collection creation response missing identifier:", response);
      throw new Error("Unexpected server response. Please try again.");
    }
    navigate(`/edit/collection-editor/${contentId}`);
  };

  const handleContentNameSubmit = async (name: string) => {
    setIsCreating(true);
    try {
      if (selectedOption && COLLECTION_EDITOR_OPTIONS.includes(selectedOption)) {
        await handleCollectionCreate(name, selectedOption);
      } else {
        await handleResourceCreate(name);
      }
      setShowNameDialog(false);
      setSelectedOption(null);
    } catch (error) {
      console.error('Failed to create content:', error);
      toast({ title: "Error", description: "Failed to create content. Please try again.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  // Determines the editor route from the cached WorkspaceItem type from search API.
  // Only Course, TextBook, and Collection go to collection editor; everything else goes to content editor.
  const getEditorRoute = (id: string): string | null => {
    const item = visibleContents.find((c) => c.id === id);
    if (!item) return null;
    if (["Course", "TextBook", "Collection"].includes(item.primaryCategory)) {
      return `/edit/collection-editor/${id}`;
    }
    return `/edit/content-editor/${id}`;
  };


  const handleView = (id: string) => {
    const route = getEditorRoute(id);
    if (route) navigate(route);
  };

  const handleEdit = (id: string) => {
    const route = getEditorRoute(id);
    if (route) navigate(route);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ type: 'delete', contentId: id });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    const { contentId } = confirmDialog;
    setIsConfirming(true);
    try {
      await contentService.contentRetire([contentId]);
      setRetiredContentIds((prev) => (prev.includes(contentId) ? prev : [...prev, contentId]));

      try {
        await refetchAll();
      } catch (refetchError) {
        console.warn('Workspace refresh after delete failed:', refetchError);
      }

      setConfirmDialog(null);
      toast({ title: "Content Deleted", description: "The content has been removed.", variant: "destructive" });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message || "Failed to delete content.", variant: "destructive" });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCreateClick = () => setShowCreateModal(true);

  const handleRoleChange = (role: UserRole) => {
    if (role === 'creator' && !hasCreatorRole) return;
    if (role === 'reviewer' && !hasReviewerRole) return;
    setUserRole(role);
  };

  const navigationProps = {
    activeView,
    onViewChange: setActiveView,
    userRole,
    onRoleChange: handleRoleChange,
    hasCreatorRole,
    hasReviewerRole,
    counts,
    viewMode,
    onViewModeChange: setViewMode,
    typeFilter,
    onTypeFilterChange: setTypeFilter,
    contentCount: showContent ? visibleContents.length : undefined,
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
                  filteredItems={visibleContents}
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
                />
              </div>
            )}
          </main>
          <CreateContentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onOptionSelect={handleCreateOption} />
          <ConfirmDialog
            open={!!confirmDialog}
            onClose={() => setConfirmDialog(null)}
            onConfirm={handleConfirmAction}
            isLoading={isConfirming}
            title="Delete Content"
            description="Are you sure you want to delete this content?"
            confirmLabel="Delete"
            confirmVariant="destructive"
          />
          <ContentNameDialog
            open={showNameDialog}
            onClose={() => { setShowNameDialog(false); setSelectedOption(null); }}
            onSubmit={handleContentNameSubmit}
            isLoading={isCreating}
            optionTitle={selectedOption ? EDITOR_OPTION_LABELS[selectedOption] : undefined}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WorkspacePage;

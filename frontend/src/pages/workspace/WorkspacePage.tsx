/* eslint-disable max-lines */
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useImpression from "@/hooks/useImpression";
import useDebounce from "@/hooks/useDebounce";
import PageLoader from "@/components/common/PageLoader";
import { type WorkspaceView, type UserRole, type ViewMode, type SortOption, type ContentTypeFilter } from "@/types/workspaceTypes";
import WorkspaceToolbar from "@/components/workspace/WorkspaceToolbar";
import { ContentService } from "@/services/ContentService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { useOrganizationSearch } from "@/hooks/useOrganization";
import { useChannel } from "@/hooks/useChannel";
import { useUserRead } from "@/hooks/useUserRead";
import { useToast } from "@/hooks/useToast";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useQuestionSetCreate } from "@/hooks/useQuestionSetCreate";
import { useQuestionSetRetire } from "@/hooks/useQuestionSetRetire";
import { lockService, type LockListItem } from "@/services/LockService";
import userProfileService from "@/services/UserProfileService";
import WorkspacePageContent from "./WorkspacePageContent";
import CreateContentModal from "./CreateContentModal";
import ContentNameDialog from "./ContentNameDialog";
import ContentDynamicFormDialog, { type ContentFormData } from "./ContentDynamicFormDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import "../home/home.css";
import "./workspace.css";
import { QumlEditor } from "@/components/quml-editor";

// Option IDs that use the dynamic form dialog for content creation
const DYNAMIC_FORM_OPTIONS = ['quiz', 'story', 'textbook', 'collection'];

// Option IDs for collection-type content created via the dynamic form (textbook, collection)
const COLLECTION_FORM_OPTIONS = ['textbook', 'collection'];

/** QuML editor option IDs */
const QUML_EDITOR_OPTIONS = ['question-set', 'question-editor'];

const EDITOR_OPTION_LABELS: Record<string, string> = {
  'quiz': 'workspace.editorOptions.quiz',
  'story': 'workspace.editorOptions.story',
  'course': 'workspace.editorOptions.course',
  'collection': 'workspace.editorOptions.collection',
  'textbook': 'workspace.editorOptions.textbook',
  'question-set': 'workspace.editorOptions.questionSet',
  'question-editor': 'workspace.editorOptions.questionSet',
};

const COLLECTION_CONTENT_CONFIG: Record<string, {
  mimeType: string;
  contentType: string;
  primaryCategory: string;
  resourceType: string;
  descriptionKey: string;
}> = {
  course: {
    mimeType: 'application/vnd.ekstep.content-collection',
    contentType: 'Course',
    primaryCategory: 'Course',
    resourceType: 'Course',
    descriptionKey: 'workspace.collectionDescriptions.course',
  },
  'content-playlist': {
    mimeType: 'application/vnd.ekstep.content-collection',
    contentType: 'Collection',
    primaryCategory: 'Content Playlist',
    resourceType: 'Collection',
    descriptionKey: 'workspace.collectionDescriptions.contentPlaylist'
  },
  'digital-textbook': {
    mimeType: 'application/vnd.ekstep.content-collection',
    contentType: 'TextBook',
    primaryCategory: 'Digital Textbook',
    resourceType: 'Collection',
    descriptionKey: 'workspace.collectionDescriptions.digitalTextbook'
  },
  'question-paper': {
    mimeType: 'application/vnd.ekstep.content-collection',
    contentType: 'Collection',
    primaryCategory: 'Question paper',
    resourceType: 'Collection',
    descriptionKey: 'workspace.collectionDescriptions.questionPaper'
  },
};

/** MIME types that identify collection-type content */
const COLLECTION_MIMETYPES = [
  "application/vnd.sunbird.questionset",
  "application/vnd.sunbird.collection",
  "application/vnd.ekstep.content-collection",
];

const contentService = new ContentService();
/** Option IDs that should open the generic (upload) editor */
const GENERIC_EDITOR_OPTIONS = ['upload-content', 'upload-large-content'];

const DEFAULT_FIELDS = {
  'primaryCategory': [
    { key: 'Content Playlist', name: 'Content Playlist' },
    { key: 'Digital Textbook', name: 'Digital Textbook' },
    { key: 'Question paper', name: 'Question Paper' },
  ],
} as const;

const WorkspacePage = () => {
  const navigate = useNavigate();
  useImpression({ type: 'view', pageid: 'workspace', env: 'workspace' });
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: userData } = useUserRead();
  const slug = userData?.data?.response?.channel;

  // Pre-fetch org data using tanstack mutation when slug becomes available
  const orgSearch = useOrganizationSearch();
  const questionSetCreate = useQuestionSetCreate();
  const questionSetRetire = useQuestionSetRetire();
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

  // Derive available roles from user profile
  const userRoles: string[] = useMemo(() => {
    const roles = userData?.data?.response?.roles;
    if (!Array.isArray(roles)) return [];
    return roles
      .map((roleInfo) => roleInfo?.role)
      .filter((role): role is string => Boolean(role));
  }, [userData]);

  const hasContentCreatorRole = userRoles.includes('CONTENT_CREATOR');
  const hasContentReviewerRole = userRoles.includes('CONTENT_REVIEWER');
  const hasBookCreatorRole = userRoles.includes('BOOK_CREATOR');
  const hasBookReviewerRole = userRoles.includes('BOOK_REVIEWER');

  // A user can create if they have CONTENT_CREATOR or BOOK_CREATOR
  const hasCreatorRole = hasContentCreatorRole || hasBookCreatorRole;
  // A user can review if they have CONTENT_REVIEWER or BOOK_REVIEWER
  const hasReviewerRole = hasContentReviewerRole || hasBookReviewerRole;

  // BOOK_CREATOR without CONTENT_CREATOR can only create textbooks
  const isBookCreatorOnly = hasBookCreatorRole && !hasContentCreatorRole;

  // BOOK_REVIEWER without CONTENT_REVIEWER can only review textbooks
  const isBookReviewerOnly = hasBookReviewerRole && !hasContentReviewerRole;

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

  // Local state for responsive typing; debounced value drives API + URL.
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync searchInput when URL changes externally (browser back/forward)
  useEffect(() => {
    const urlQuery = searchParams.get('search') || '';
    setSearchInput((prev) => (prev === urlQuery ? prev : urlQuery));
  }, [searchParams]);

  // Sync debounced value to URL (only writes when debounced value settles)
  useEffect(() => {
    setSearchParams((prev) => {
      const current = prev.get('search') || '';
      if (current === debouncedSearch) return prev;
      const next = new URLSearchParams(prev);
      if (debouncedSearch) {
        next.set('search', debouncedSearch);
      } else {
        next.delete('search');
      }
      return next;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showDynamicFormDialog, setShowDynamicFormDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'delete'; contentId: string; mimeType: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [retiredContentIds, setRetiredContentIds] = useState<string[]>([]);

  const showContent = !['create'].includes(activeView);
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
    searchQuery: debouncedSearch,
    enabled: showContent,
    isBookCreatorOnly,
    isBookReviewerOnly,
  });

  const visibleContents = useMemo(
    () => contents.filter((content) => !retiredContentIds.includes(content.id)),
    [contents, retiredContentIds],
  );

  // Memoize content IDs to prevent unnecessary lock list API calls
  const visibleContentIds = useMemo(
    () => JSON.stringify(visibleContents.map((c) => c.id).sort()),
    [visibleContents],
  );

  // Fetch lock list for creator role to show lock icons on content cards.
  const [lockedContentMap, setLockedContentMap] = useState<Record<string, { creatorName: string }>>(
    {},
  );

  useEffect(() => {
    if (userRole !== 'creator' || visibleContents.length === 0) {
      setLockedContentMap({});
      return;
    }

    const contentIds = visibleContents.map((c) => c.id);
    let cancelled = false;

    lockService
      .listLocks(contentIds)
      .then((res) => {
        if (cancelled) return;
        const lockMap: Record<string, { creatorName: string }> = {};
        const items: LockListItem[] = res.data?.data ?? [];
        for (const lock of items) {
          let creatorName = 'Another user';
          try {
            const info = JSON.parse(lock.creatorInfo);
            if (info?.name) creatorName = info.name;
          } catch { /* ignore parse errors */ }
          lockMap[lock.resourceId] = { creatorName };
        }
        setLockedContentMap(lockMap);
      })
      .catch(() => {
        if (!cancelled) setLockedContentMap({});
      });

    return () => {
      cancelled = true;
    };
  }, [userRole, visibleContentIds]); // Changed from visibleContents to visibleContentIds

  // Reset view and search when role changes
  useEffect(() => {
    const nextView: WorkspaceView = userRole === 'creator' ? 'all' : 'pending-review';
    setActiveView((prev) => (prev === nextView ? prev : nextView));
    setSearchInput('');
  }, [userRole]);

  const handleCreateOption = (optionId: string) => {
    setShowCreateModal(false);
    // Quiz, story, textbook, and collection use the dynamic form dialog
    if (DYNAMIC_FORM_OPTIONS.includes(optionId)) {
      setSelectedOption(optionId);
      setShowDynamicFormDialog(true);
      return;
    }
    // Course and question-set use the simple name dialog
    if (optionId === 'course' || QUML_EDITOR_OPTIONS.includes(optionId)) {
      setSelectedOption(optionId);
      setShowNameDialog(true);
    } else if (GENERIC_EDITOR_OPTIONS.includes(optionId)) {
      navigate(optionId === 'upload-content' ? '/workspace/content/edit/generic' : '/workspace/content/edit/editorforlargecontent');
      return;
    } else {
      toast({
        title: t("workspace.startingEditor"),
        description: t("workspace.launchingEditor", { name: optionId.replace('-', ' ') }),
        variant: "success",
      });
    }
  };

  /** Common creator metadata used across all content creation flows */
  const getCreatorMeta = () => {
    const first = userData?.data?.response?.firstName?.trim();
    const last = userData?.data?.response?.lastName?.trim();
    const creator = first || last ? [first, last].filter(Boolean).join(" ") : "anonymous";
    const createdBy = userAuthInfoService.getUserId() || '';
    const organisation: string[] = orgData?.orgName ? [orgData.orgName] : [];
    const createdFor: string[] = orgChannelId ? [orgChannelId] : [];
    return { creator, createdBy, organisation, createdFor };
  };

  const handleDynamicFormSubmit = async (formData: ContentFormData) => {
    setIsCreating(true);
    try {
      const { creator, createdBy, organisation, createdFor } = getCreatorMeta();
      const isCollectionType = selectedOption && COLLECTION_FORM_OPTIONS.includes(selectedOption);

      if (isCollectionType) {
        // Textbook / Collection: create collection-type content
        const configKey = selectedOption === 'textbook' ? 'digital-textbook' : 'content-playlist';
        const config = COLLECTION_CONTENT_CONFIG[configKey];
        if (!config) throw new Error(t("workspace.errors.invalidContentType"));

        const { descriptionKey, ...apiConfig } = config;

        const response = await contentService.contentCreate(formData.name, {
          createdBy,
          creator,
          ...apiConfig,
          description: formData.description || "Enter the description",
          organisation,
          createdFor,
          framework: orgFramework,
          extraFields: formData.dynamicFields,
        });
        const contentId = response.data?.identifier || response.data?.content_id;
        if (!contentId) {
          console.error("Collection creation response missing identifier:", response);
          throw new Error(t("workspace.errors.unexpectedResponse"));
        }
        setShowDynamicFormDialog(false);
        setSelectedOption(null);
        navigate(`/edit/collection-editor/${contentId}`);
      } else {
        // Quiz / Story: create resource-type content
        const isQuiz = selectedOption === 'quiz';
        const resourceType = (formData.dynamicFields['resourceType'] as string) || 'Learn';
        const { resourceType: _, ...extraFields } = formData.dynamicFields;

        const response = await contentService.contentCreate(formData.name, {
          createdBy,
          creator,
          mimeType: 'application/vnd.ekstep.ecml-archive',
          contentType: isQuiz ? 'SelfAssess' : 'Resource',
          ...(isQuiz ? { primaryCategory: 'Course Assessment' } : {}),
          description: formData.description || 'Enter description for Resource',
          organisation,
          createdFor,
          framework: orgFramework,
          resourceType,
          extraFields,
        });
        const contentId = response.data?.identifier || response.data?.content_id;
        if (!contentId) {
          console.error("Content creation response missing identifier:", response);
          throw new Error(t("workspace.errors.unexpectedResponse"));
        }
        setShowDynamicFormDialog(false);
        setSelectedOption(null);
        navigate(`/edit/content-editor/${contentId}`);
      }
    } catch (error) {
      console.error('Failed to create content:', error);
      toast({ title: t("workspace.errors.creationFailed"), description: t("workspace.errors.unableToCreate"), variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuestionSetCreate = async (name: string) => {
    const { createdBy, createdFor, creator } = getCreatorMeta();

    const response = await questionSetCreate.mutateAsync({
      name,
      createdBy,
      createdFor,
      framework: orgFramework || '',
      creator,
    });

    const contentId = response?.identifier;
    if (!contentId) {
      console.error("Question set creation response missing identifier:", response);
      throw new Error(t("workspace.errors.unexpectedResponse"));
    }

    navigate(`/edit/quml-editor/${contentId}`);
  };

  const handleContentNameSubmit = async (name: string, extra?: { description?: string }) => {
    setIsCreating(true);
    try {
      if (selectedOption === 'course') {
        // Course creation: inline collection creation logic
        const { creator, createdBy, organisation, createdFor } = getCreatorMeta();
        const config = COLLECTION_CONTENT_CONFIG['course']!;
        const { descriptionKey, ...apiConfig } = config;
        const targetFWIds: string[] = orgFramework ? [orgFramework] : [];

        const response = await contentService.contentCreate(name, {
          createdBy,
          creator,
          ...apiConfig,
          description: extra?.description || t(descriptionKey),
          organisation,
          createdFor,
          targetFWIds,
        });
        const contentId = response.data?.identifier || response.data?.content_id;
        if (!contentId) {
          console.error("Course creation response missing identifier:", response);
          throw new Error(t("workspace.errors.unexpectedResponse"));
        }
        navigate(`/edit/collection-editor/${contentId}`);
      } else if (selectedOption && QUML_EDITOR_OPTIONS.includes(selectedOption)) {
        await handleQuestionSetCreate(name);
      }
      setShowNameDialog(false);
      setSelectedOption(null);
    } catch (error) {
      console.error('Failed to create content:', error);
      toast({ title: t("workspace.errors.creationFailed"), description: t("workspace.errors.unableToCreate"), variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  // Determines the editor route from the cached WorkspaceItem type from search API.
  // Only Course, TextBook, and Collection go to collection editor; everything else goes to content editor.
  const getEditorRoute = (id: string): string | null => {
    const item = visibleContents.find((c) => c.id === id);
    if (!item) return null;
    if (["Course", "TextBook", "Collection"].includes(item.contentType)) {
      return `/edit/collection-editor/${id}`;
    }
    if (item.primaryCategory === 'Practice Question Set') {
      return `/edit/quml-editor/${id}`;
    }
    if (item.mimeType === 'application/vnd.ekstep.ecml-archive') {
      return `/edit/content-editor/${id}`;
    }
    const state = (item.status || 'Draft').toLowerCase();
    const framework = item.framework || orgFramework || '';
    const contentStatus = item.contentStatus || 'draft';
    return `/workspace/content/edit/generic/${id}/${state}/${framework}/${contentStatus}`;
  };


  const handleView = (id: string) => {
    const item = visibleContents.find((c) => c.id === id);
    if (!item) return;

    const isCollection = COLLECTION_MIMETYPES.includes(item.mimeType);

    if (!isCollection) {
      const isReviewMode = userRole === 'reviewer' && item.status === 'review';
      navigate(isReviewMode ? `/workspace/review/${id}` : `/workspace/view/${id}`);
      return;
    }
    const route = getEditorRoute(id);
    if (route) navigate(route);
  };

  const handleEdit = (id: string) => {
    const route = getEditorRoute(id);
    if (route) navigate(route);
  };

  const handleDelete = (id: string) => {
    const item = visibleContents.find((c) => c.id === id);
    setConfirmDialog({ type: 'delete', contentId: id, mimeType: item?.mimeType ?? '' });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    const { contentId, mimeType } = confirmDialog;
    setIsConfirming(true);
    try {
      const isQuestionSet = mimeType === 'application/vnd.sunbird.questionset';
      if (isQuestionSet) {
        await questionSetRetire.mutateAsync(contentId);
      } else {
        await contentService.contentRetire([contentId]);
      }
      setRetiredContentIds((prev) => (prev.includes(contentId) ? prev : [...prev, contentId]));

      try {
        await refetchAll();
      } catch (refetchError) {
        console.warn('Workspace refresh after delete failed:', refetchError);
      }

      setConfirmDialog(null);
      toast({ title: "Success", description: "Content has been deleted successfully.", variant: "success" });
    } catch (err) {
      toast({ title: "Failed", description: (err as Error).message || "Unable to delete content. Please try again.", variant: "destructive" });
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
    isBookCreatorOnly,
    isBookReviewerOnly,
    counts,
    viewMode,
    onViewModeChange: setViewMode,
    typeFilter,
    onTypeFilterChange: setTypeFilter,
    contentCount: showContent ? visibleContents.length : undefined,
    totalCount: showContent ? totalCount : undefined,
    onCreateClick: handleCreateClick,
    searchQuery: searchInput,
    onSearchChange: setSearchInput,
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="workspace-main-content">
        <div className="workspace-content-wrapper">
          <WorkspaceToolbar {...navigationProps} />
          {showContent && isCountsLoading && isLoading ? (
            <PageLoader message={t('loading')} fullPage={false} />
          ) : (
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
              userRole={userRole}
              lockedContentMap={lockedContentMap}
              onLoadMore={loadMore}
              onRetry={refetchAll}
              onCreateOption={handleCreateOption}
              onCreateClick={handleCreateClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </div>
      </main>
      <CreateContentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onOptionSelect={handleCreateOption} isBookCreator={hasBookCreatorRole} />
      <ConfirmDialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleConfirmAction}
        isLoading={isConfirming}
        title={t('workspace.deleteContent')}
        description={t('workspace.deleteConfirmation')}
        confirmLabel={t('delete')}
        confirmVariant="destructive"
      />
      <ContentNameDialog
        open={showNameDialog}
        onClose={() => { setShowNameDialog(false); setSelectedOption(null); }}
        onSubmit={handleContentNameSubmit}
        isLoading={isCreating}
        optionTitle={selectedOption && EDITOR_OPTION_LABELS[selectedOption] ? t(EDITOR_OPTION_LABELS[selectedOption]) : undefined}
        optionId={selectedOption ?? undefined}
      />
      <ContentDynamicFormDialog
        open={showDynamicFormDialog}
        onClose={() => { setShowDynamicFormDialog(false); setSelectedOption(null); }}
        onSubmit={handleDynamicFormSubmit}
        isLoading={isCreating}
        orgChannelId={orgChannelId}
        orgFramework={orgFramework}
        formSubType={selectedOption === 'quiz' ? 'assessment' : selectedOption === 'textbook' ? 'textbook' : selectedOption === 'collection' ? 'collection' : 'resource'}
        title={selectedOption && EDITOR_OPTION_LABELS[selectedOption] ? `${t('create')} ${t(EDITOR_OPTION_LABELS[selectedOption])}`.trim() : t('workspace.createContent')}
        defaultFields={DEFAULT_FIELDS}
      />
    </div>
  );
};

export default WorkspacePage;

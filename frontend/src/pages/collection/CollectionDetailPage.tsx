import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useCollection } from "@/hooks/useCollection";
import { useCollectionEnrollment } from "@/hooks/useCollectionEnrollment";
import { useUserRead } from "@/hooks/useUserRead";
import { useContentRead, useContentSearch } from "@/hooks/useContent";
import { useQumlContent } from "@/hooks/useQumlContent";
import { useCollectionDetailPlayer } from "@/hooks/useCollectionDetailPlayer";
import { mapSearchContentToRelatedContentItems } from "@/services/collection";
import { useIsContentCreator } from "@/hooks/useUser";
import { useCollectionDetailSelfAssess } from "@/hooks/useCollectionDetailSelfAssess";
import defaultCollectionImage from "@/assets/resource-robot-hand.svg";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { usePermissions } from "@/hooks/usePermission";
import { useInitialCollectionContentNavigation } from "@/hooks/useInitialCollectionContentNavigation";
import { buildCollectionDetailContentArea } from "./buildCollectionDetailContentArea";
import CollectionDetailLayout from "./CollectionDetailLayout";
import "./collection.css";

const CollectionDetailPage = () => {
  const { collectionId, batchId: batchIdParam, contentId } = useParams<{ collectionId: string; batchId?: string; contentId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const backToRef = useRef<string>((location.state as { from?: string } | null)?.from ?? '/explore');
  const capturedCollectionIdRef = useRef<string | undefined>(collectionId);
  if (capturedCollectionIdRef.current !== collectionId) {
    capturedCollectionIdRef.current = collectionId;
    backToRef.current = (location.state as { from?: string } | null)?.from ?? '/explore';
  }
  const backTo = backToRef.current;
  const { isAuthenticated } = usePermissions();
  const isContentCreator = useIsContentCreator();
  const { t } = useAppI18n();
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);
  const [certificatePreviewUrl, setCertificatePreviewUrl] = useState("");

  const { data: collectionDataFromApi, isLoading, isFetching, isError, error, refetch } = useCollection(collectionId);
  const collectionData = collectionDataFromApi ?? null;
  const { data: userReadData } = useUserRead();
  const userProfile = userReadData?.data?.response;
  const enrollment = useCollectionEnrollment(collectionId, batchIdParam, collectionData, isAuthenticated);
  const {
    isEnrolledInCurrentBatch,
    contentStatusMap,
    contentStateFetched,
    contentAttemptInfoMap,
    courseProgressProps,
    batches,
    batchListLoading,
    batchListError,
    firstCertPreviewUrl,
    hasCertificate,
    joinLoading,
    joinError,
    handleJoinCourse,
    effectiveBatchId,
    isBatchEnded,
    isBatchUpcoming,
    batchStartDateFromRead,
  } = enrollment;
  const hasBatchInRoute = !!batchIdParam;
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const currentUserId = userAuthInfoService.getUserId();
  const isCreatorViewingOwnCollection =
    !!isAuthenticated &&
    !!collectionData?.createdBy &&
    !!currentUserId &&
    collectionData.createdBy === currentUserId;
  const contentCreatorPrivilege = isCreatorViewingOwnCollection || !!isContentCreator;

  const [, setAuthRefresh] = useState(0);
  const triedAuthRefreshRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || userAuthInfoService.getUserId() || triedAuthRefreshRef.current) return;
    triedAuthRefreshRef.current = true;
    userAuthInfoService
      .getAuthInfo()
      .then(() => setAuthRefresh((n) => n + 1))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!collectionId || hasBatchInRoute || contentCreatorPrivilege) return;
    const batchId = enrollment.enrollmentForCollection?.batchId;
    if (batchId) navigate(`/collection/${collectionId}/batch/${batchId}`, { replace: true });
  }, [collectionId, hasBatchInRoute, contentCreatorPrivilege, enrollment.enrollmentForCollection?.batchId, navigate]);

  const isTrackable = (collectionDataFromApi?.trackable?.enabled?.toLowerCase() ?? "") === "yes";

  const upcomingBatchBlocked =
    isTrackable &&
    !contentCreatorPrivilege &&
    hasBatchInRoute &&
    isEnrolledInCurrentBatch &&
    isBatchUpcoming;

  /** Block content when trackable and:
   * - not logged in, or
   * - logged in but not enrolled in current batch (and not creator), or
   * - enrolled in an upcoming (not yet started) batch.
   */
  const contentBlocked =
    isTrackable &&
    (
      !isAuthenticated ||
      (!contentCreatorPrivilege && !(hasBatchInRoute && isEnrolledInCurrentBatch)) ||
      upcomingBatchBlocked
    );
  const showLoading = isLoading || (isError && isFetching);
  const hierarchySuccess = !isError && !!collectionDataFromApi;
  const displayCollectionData = useMemo(
    () => (collectionData ? { ...collectionData, image: collectionData.image || defaultCollectionImage } : null),
    [collectionData]
  );

  const {
    data: searchData,
    isError: searchError,
    error: searchErrorObj,
    refetch: searchRefetch,
    isFetching: searchFetching,
  } = useContentSearch({
    request: { limit: 20, offset: 0 },
    enabled: hierarchySuccess,
  });
  // Fetch selected content when contentId is in the URL
  const { data: contentReadData, isLoading: contentIsLoading, error: contentError } = useContentRead(contentId ?? '');
  const selectedContentData = contentReadData?.data?.content;
  const isQumlContent = selectedContentData?.mimeType === 'application/vnd.sunbird.questionset' ||
    selectedContentData?.mimeType === 'application/vnd.sunbird.question';
  const { data: qumlData, isLoading: qumlIsLoading, error: qumlError } = useQumlContent(contentId ?? '', { enabled: isQumlContent });
  const rawPlayerMetadata = isQumlContent ? qumlData : selectedContentData;

  const {
    maxAttemptsExceeded,
    playerMetadata,
    currentContentNode,
  } = useCollectionDetailSelfAssess({
    contentId,
    collectionData,
    hasBatchInRoute,
    isEnrolledInCurrentBatch,
    contentCreatorPrivilege,
    contentAttemptInfoMap: contentAttemptInfoMap ?? {},
    rawPlayerMetadata,
    playerIsLoading: contentId ? (isQumlContent ? qumlIsLoading : contentIsLoading) : false,
    t,
  });

  const playerIsLoading = contentId ? (isQumlContent ? qumlIsLoading : contentIsLoading) : false;
  const playerError = isQumlContent ? qumlError : contentError;

  const currentContentStatus = contentId ? contentStatusMap?.[contentId] : undefined;
  const { handlePlayerEvent, handleTelemetryEvent } = useCollectionDetailPlayer({
    collectionId,
    contentId: contentId ?? undefined,
    effectiveBatchId,
    isEnrolledInCurrentBatch,
    isBatchEnded,
    mimeType: (playerMetadata as { mimeType?: string } | undefined)?.mimeType,
    currentContentStatus,
    skipContentStateUpdate: contentCreatorPrivilege,
    contentType: currentContentNode?.contentType,
  });

  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const initialExpandedSet = useRef(false);

  useInitialCollectionContentNavigation({
    collectionData,
    contentId,
    isTrackable,
    contentCreatorPrivilege,
    collectionId,
    hasBatchInRoute,
    batchIdParam,
    isEnrolledInCurrentBatch,
    contentStatusMap,
    contentStateFetched,
  });

  useEffect(() => {
    const firstMainUnitId = collectionData?.children?.[0]?.identifier;
    if (firstMainUnitId && !initialExpandedSet.current) {
      setExpandedModules([firstMainUnitId]);
      initialExpandedSet.current = true;
    }
  }, [collectionData?.children]);
  useEffect(() => { initialExpandedSet.current = false; setExpandedModules([]); }, [collectionId]);

  const hasSearchResults = (searchData?.data?.content?.length ?? 0) > 0;
  const relatedContentItems = useMemo(
    () => (hasSearchResults ? mapSearchContentToRelatedContentItems(searchData?.data?.content, collectionData?.id ?? undefined, 3) : []),
    [hasSearchResults, searchData?.data?.content, collectionData?.id]
  );
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]));
  };
  const certificatePreviewDetails = useMemo(() => ({
    recipientName: userProfile ? [userProfile.firstName ?? "", userProfile.lastName ?? ""].filter(Boolean).join(" ").trim() || undefined : undefined,
  }), [userProfile?.firstName, userProfile?.lastName]);

  const batchStartDateForOverview =
    courseProgressProps?.batchStartDate ?? batchStartDateFromRead ?? undefined;

  const contentArea = useMemo(
    () =>
      buildCollectionDetailContentArea({
        displayCollectionData, contentId, isTrackable, isAuthenticated, hasBatchInRoute, isEnrolledInCurrentBatch,
        contentBlocked, upcomingBatchBlocked, batchStartDateForOverview, playerMetadata, playerIsLoading,
        playerError: playerError ?? null, handlePlayerEvent, handleTelemetryEvent, maxAttemptsExceeded,
        courseProgressProps, contentStatusMap, contentAttemptInfoMap, batches, selectedBatchId, setSelectedBatchId,
        handleJoinCourse, batchListLoading, joinLoading, batchListError, joinError, hasCertificate, firstCertPreviewUrl,
        setCertificatePreviewUrl, setCertificatePreviewOpen, expandedModules, toggleModule, collectionId, batchIdParam,
        isCreatorViewingOwnCollection, contentCreatorPrivilege, userProfile: userProfile ?? undefined,
        currentUserId: currentUserId ?? undefined,
      }),
    [
      displayCollectionData, contentId, isTrackable, isAuthenticated, hasBatchInRoute, isEnrolledInCurrentBatch,
      contentBlocked, upcomingBatchBlocked, batchStartDateForOverview, playerMetadata, playerIsLoading, playerError,
      handlePlayerEvent, handleTelemetryEvent, maxAttemptsExceeded, courseProgressProps, contentStatusMap,
      contentAttemptInfoMap, batches, selectedBatchId, setSelectedBatchId, handleJoinCourse, batchListLoading,
      joinLoading, batchListError, joinError, hasCertificate, firstCertPreviewUrl, expandedModules, toggleModule,
      collectionId, batchIdParam, isCreatorViewingOwnCollection, contentCreatorPrivilege, userProfile, currentUserId,
    ]
  );

  return (
    <CollectionDetailLayout
      navigation={{ onGoBack: () => navigate(backTo), t }}
      loading={{ showLoading, isError, error: error ?? null, onRetry: refetch }}
      collection={{
        collectionDataFromApi: collectionDataFromApi ?? null,
        hierarchySuccess,
        collectionData,
        displayCollectionData,
      }}
      contentArea={contentArea}
      certificateModal={{
        certificatePreviewOpen,
        certificatePreviewUrl,
        certificatePreviewDetails,
        setCertificatePreviewUrl,
        setCertificatePreviewOpen,
      }}
      relatedContent={{
        searchError,
        searchErrorObj: searchErrorObj ?? null,
        searchFetching,
        relatedContentItems,
        searchRefetch,
      }}
      courseCompletion={{
        courseProgressProps,
        isEnrolledInCurrentBatch,
        collectionId,
        hasCertificate,
      }}
    />
  );
};
export default CollectionDetailPage;

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useCollectionPageData } from "@/hooks/useCollectionPageData";
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
import useImpression from "@/hooks/useImpression";
import { useCollectionAutoNavigate } from "@/hooks/useCollectionAutoNavigate";
import { useCollectionPageUIState } from "@/hooks/useCollectionPageUIState";
import { buildCollectionDetailContentArea } from "./buildCollectionDetailContentArea";
import { buildCollectionCdata, buildObjectRollup } from "@/utils/collectionTelemetryContext";
import { useCollectionBackNavigation, useAuthRefreshOnce } from "./useCollectionBackNavigation";
import CollectionDetailLayout from "./CollectionDetailLayout";
import { TelemetryTracker } from '@/components/telemetry/TelemetryTracker';
import "./collection.css";

const CollectionDetailPage = () => {
  const navigate = useNavigate();
  const { collectionId, batchId: batchIdParam, contentId } = useParams<{ collectionId: string; batchId?: string; contentId?: string }>();
  useImpression({ type: 'view', pageid: 'collection-detail', env: 'course', object: { id: collectionId || '', type: 'Course' } });
  const backTo = useCollectionBackNavigation(collectionId);
  const { isAuthenticated } = usePermissions();
  const isContentCreator = useIsContentCreator();
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);
  const [certificatePreviewUrl, setCertificatePreviewUrl] = useState("");

  const {
    collectionDataFromApi, collectionData, userProfile, enrollment,
    displayCollectionData,
    isLoading, isFetching, isError, error, refetch
  } = useCollectionPageData(collectionId, batchIdParam);

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
    isMentorOfAnyBatchInCourse,
  } = enrollment;
  const hasBatchInRoute = !!batchIdParam;
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const currentUserId = userAuthInfoService.getUserId();
  const isCreatorViewingOwnCollection =
    !!isAuthenticated &&
    !!collectionData?.createdBy &&
    !!currentUserId &&
    collectionData.createdBy === currentUserId;
  const isMentorOfCourse = isMentorOfAnyBatchInCourse;
  const contentCreatorPrivilege = isCreatorViewingOwnCollection || !!isContentCreator || isMentorOfCourse;

  useAuthRefreshOnce(isAuthenticated);

  useEffect(() => {
    if (!collectionId || hasBatchInRoute || contentCreatorPrivilege) return;
    const batchId = enrollment.enrollmentForCollection?.batchId;
    if (batchId) navigate(`/collection/${collectionId}/batch/${batchId}`, { replace: true });
  }, [collectionId, hasBatchInRoute, contentCreatorPrivilege, enrollment.enrollmentForCollection?.batchId, navigate]);

  const isTrackable = (collectionDataFromApi?.trackable?.enabled?.toLowerCase() ?? "") === "yes";

  const upcomingBatchBlocked = isTrackable && !contentCreatorPrivilege && hasBatchInRoute && isEnrolledInCurrentBatch && isBatchUpcoming;
  const contentBlocked = isTrackable && (!isAuthenticated || (!contentCreatorPrivilege && !(hasBatchInRoute && isEnrolledInCurrentBatch)) || upcomingBatchBlocked);

  const showLoading = isLoading || (isError && isFetching);
  const hierarchySuccess = !isError && !!collectionDataFromApi;

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

  const { t } = useAppI18n();

  const hasSearchResults = (searchData?.data?.content?.length ?? 0) > 0;
  const relatedContentItems = useMemo(
    () => (hasSearchResults ? mapSearchContentToRelatedContentItems(searchData?.data?.content, collectionData?.id ?? undefined, 3) : []),
    [hasSearchResults, searchData?.data?.content, collectionData?.id]
  );

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

  const collectionCdata = useMemo(
    () => buildCollectionCdata(collectionId, effectiveBatchId),
    [collectionId, effectiveBatchId]
  );

  const collectionObjectRollup = useMemo(
    () => buildObjectRollup(collectionData?.hierarchyRoot, contentId),
    [collectionData?.hierarchyRoot, contentId]
  );

  const firstMainUnitId = collectionData?.children?.[0]?.identifier;
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const prevCollectionId = useRef(collectionId);
  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev: string[]) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  }, []);

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
    if (prevCollectionId.current !== collectionId) {
      prevCollectionId.current = collectionId;
      setExpandedModules(firstMainUnitId ? [firstMainUnitId] : []);
      return;
    }
    if (firstMainUnitId) {
      setExpandedModules((prev) => prev.length === 0 ? [firstMainUnitId] : prev);
    }
  }, [collectionId, firstMainUnitId]);

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
        cdata: collectionCdata, objectRollup: collectionObjectRollup,
        courseProgressProps, contentStatusMap, contentAttemptInfoMap, batches, selectedBatchId, setSelectedBatchId,
        handleJoinCourse, batchListLoading, joinLoading, batchListError, joinError, hasCertificate, firstCertPreviewUrl,
        setCertificatePreviewUrl, setCertificatePreviewOpen, expandedModules, toggleModule, collectionId, batchIdParam,
        isCreatorViewingOwnCollection, isMentorViewingCourse: isMentorOfCourse, contentCreatorPrivilege, userProfile: userProfile ?? undefined,
        currentUserId: currentUserId ?? undefined,
        backTo,
      }),
    [
      displayCollectionData, contentId, isTrackable, isAuthenticated, hasBatchInRoute, isEnrolledInCurrentBatch,
      contentBlocked, upcomingBatchBlocked, batchStartDateForOverview, playerMetadata, playerIsLoading, playerError,
      handlePlayerEvent, handleTelemetryEvent, maxAttemptsExceeded, collectionCdata, collectionObjectRollup,
      courseProgressProps, contentStatusMap,
      contentAttemptInfoMap, batches, selectedBatchId, setSelectedBatchId, handleJoinCourse, batchListLoading,
      joinLoading, batchListError, joinError, hasCertificate, firstCertPreviewUrl, expandedModules, toggleModule,
      collectionId, batchIdParam, isCreatorViewingOwnCollection, isMentorOfCourse, contentCreatorPrivilege, userProfile, currentUserId, backTo
    ]
  );

  return (
    <>
      <TelemetryTracker
        disabled={!collectionData}
        startEventInput={{ type: 'workflow', mode: contentCreatorPrivilege ? 'preview' : 'play', pageid: 'collection-detail-page' }}
        endEventInput={{ type: 'workflow', mode: contentCreatorPrivilege ? 'preview' : 'play', pageid: 'collection-detail-exit' }}
        startOptions={{ object: { id: collectionId, type: 'Course', ver: collectionData?.pkgVersion ?? '1' }, context: { env: 'course', cdata: batchIdParam ? [{ id: batchIdParam, type: 'CourseBatch' }] : [] } }}
        endOptions={{ object: { id: collectionId, type: 'Course', ver: collectionData?.pkgVersion ?? '1' }, context: { env: 'course', cdata: batchIdParam ? [{ id: batchIdParam, type: 'CourseBatch' }] : [] } }}
      />
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
        certificateModal={{ certificatePreviewOpen, certificatePreviewUrl, certificatePreviewDetails, setCertificatePreviewUrl, setCertificatePreviewOpen }}
        relatedContent={{ searchError, searchErrorObj: searchErrorObj ?? null, searchFetching, relatedContentItems, searchRefetch }}
        courseCompletion={{ courseProgressProps, isEnrolledInCurrentBatch, collectionId, hasCertificate }}
      />
    </>
  );
};
export default CollectionDetailPage;

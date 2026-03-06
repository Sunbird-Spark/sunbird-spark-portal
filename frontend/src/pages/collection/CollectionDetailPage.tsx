import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import FAQSection from "@/components/landing/FAQSection";
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
import RelatedContentSection from "@/components/collection/RelatedContentSection";
import { CollectionSecondarySection } from "@/components/collection/CollectionSecondarySection";
import { CollectionGoBackButton } from "@/components/collection/CollectionGoBackButton";
import CollectionContentArea from "@/components/collection/CollectionContentArea";
import { CollectionStatusViews } from "@/components/collection/CollectionStatusViews";
import CertificatePreviewModal, { type CertificatePreviewDetails } from "@/components/collection/CertificatePreviewModal";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { usePermissions } from "@/hooks/usePermission";
import CourseCompletionDialog from "@/components/collection/CourseCompletionDialog";
import { useInitialCollectionContentNavigation } from "@/hooks/useInitialCollectionContentNavigation";
import useImpression from "@/hooks/useImpression";
import usePageSession from "@/hooks/usePageSession";
import { useCollectionAutoNavigate } from "@/hooks/useCollectionAutoNavigate";
import { useCollectionPageUIState } from "@/hooks/useCollectionPageUIState";
import "./collection.css";

const CollectionDetailPage = () => {
  const navigate = useNavigate();
  const { collectionId, batchId: batchIdParam, contentId } = useParams<{ collectionId: string; batchId?: string; contentId?: string }>();

  useImpression({ type: 'view', pageid: 'collection-detail', object: { id: collectionId || '', type: 'Collection' } });
  usePageSession({ pageid: 'collection-detail', object: { id: collectionId || '', type: 'Collection' } });

  const {
    isAuthenticated, collectionDataFromApi, collectionData, userProfile, enrollment,
    currentUserId, isCreatorViewingOwnCollection, contentCreatorPrivilege,
    isTrackable, contentBlocked, displayCollectionData,
    isLoading, isFetching, isError, error, refetch
  } = useCollectionPageData(collectionId, batchIdParam);

  const {
    isEnrolledInCurrentBatch, contentStatusMap, contentStateFetched, contentAttemptInfoMap, courseProgressProps, batches,
    batchListLoading, batchListError, firstCertPreviewUrl, hasCertificate, joinLoading, joinError,
    handleJoinCourse, effectiveBatchId, isBatchEnded
  } = enrollment;

  const hasBatchInRoute = !!batchIdParam;

  const {
    certificatePreviewOpen, setCertificatePreviewOpen,
    certificatePreviewUrl, setCertificatePreviewUrl,
    selectedBatchId, setSelectedBatchId,
    expandedModules, setExpandedModules,
    toggleModule
  } = useCollectionPageUIState({ batchIdParam });

  const { initialExpandedSet } = useCollectionAutoNavigate({
    collectionId, contentId, collectionData, hasBatchInRoute,
    batchIdParam, isTrackable, contentCreatorPrivilege, enrollment,
  });
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

  const certificatePreviewDetails: CertificatePreviewDetails = useMemo(() => ({
    recipientName: userProfile ? [userProfile.firstName ?? "", userProfile.lastName ?? ""].filter(Boolean).join(" ").trim() || undefined : undefined,
  }), [userProfile?.firstName, userProfile?.lastName]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Go Back Link - always visible */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t("button.goBack")}
        </button>

        {showLoading && <PageLoader message={t("loading")} fullPage={false} />}
        {!showLoading && isError && error && (
          <PageLoader
            error={error.message}
            onRetry={() => refetch()}
            fullPage={false}
          />
        )}

        {!showLoading && !isError && collectionDataFromApi == null && (
          <PageLoader
            error={t("collection.notFound")}
            onRetry={() => refetch()}
            fullPage={false}
          />
        )}
        {!showLoading && hierarchySuccess && collectionData && displayCollectionData && (
          <>
            {/* Main Content Area */}
            <CollectionContentArea
              collectionData={displayCollectionData}
              contentId={contentId}
              isTrackable={isTrackable}
              contentBlocked={contentBlocked}
              isEnrolledInCurrentBatch={isEnrolledInCurrentBatch}
              playerMetadata={playerMetadata}
              playerIsLoading={playerIsLoading}
              playerError={playerError}
              handlePlayerEvent={handlePlayerEvent}
              handleTelemetryEvent={handleTelemetryEvent}
              showMaxAttemptsExceeded={maxAttemptsExceeded}
              isAuthenticated={isAuthenticated}
              collectionId={collectionId}
              hasBatchInRoute={hasBatchInRoute}
              courseProgressProps={courseProgressProps}
              batchIdParam={batchIdParam}
              expandedModules={expandedModules}
              toggleModule={toggleModule}
              contentStatusMap={contentStatusMap}
              contentAttemptInfoMap={contentAttemptInfoMap}
              batches={batches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
              handleJoinCourse={handleJoinCourse}
              batchListLoading={batchListLoading}
              joinLoading={joinLoading}
              batchListError={batchListError}
              joinError={joinError}
              hasCertificate={hasCertificate}
              firstCertPreviewUrl={firstCertPreviewUrl}
              setCertificatePreviewUrl={setCertificatePreviewUrl}
              setCertificatePreviewOpen={setCertificatePreviewOpen}
              isCreatorViewingOwnCollection={isCreatorViewingOwnCollection}
              contentCreatorPrivilege={contentCreatorPrivilege}
              userProfile={userProfile ?? undefined}
              userId={currentUserId ?? undefined}
            />

            <RelatedContentSection
              searchError={searchError}
              searchErrorObj={searchErrorObj}
              searchFetching={searchFetching}
              relatedContentItems={relatedContentItems}
              searchRefetch={searchRefetch}
            />
            <div className="mt-16"><FAQSection /></div>
          </>
        )}
      </main>
      <CertificatePreviewModal
        open={certificatePreviewOpen}
        onClose={() => setCertificatePreviewOpen(false)}
        previewUrl={certificatePreviewUrl}
        details={certificatePreviewDetails}
      />
      <CourseCompletionDialog
        courseProgressProps={courseProgressProps}
        isEnrolledInCurrentBatch={isEnrolledInCurrentBatch}
        collectionId={collectionId}
        hasCertificate={hasCertificate}
      />
      <Footer />
    </div>
  );
};
export default CollectionDetailPage;

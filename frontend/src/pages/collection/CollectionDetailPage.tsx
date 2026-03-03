import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import FAQSection from "@/components/landing/FAQSection";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useCollection } from "@/hooks/useCollection";
import { useCollectionEnrollment } from "@/hooks/useCollectionEnrollment";
import { useUserRead } from "@/hooks/useUserRead";
import { useContentRead, useContentSearch } from "@/hooks/useContent";
import { useQumlContent } from "@/hooks/useQumlContent";
import { useCollectionDetailPlayer } from "@/hooks/useCollectionDetailPlayer";
import { mapSearchContentToRelatedContentItems } from "@/services/collection";
import { getFirstLeafContentIdFromHierarchy } from "@/services/collection/hierarchyTree";
import { useIsContentCreator } from "@/hooks/useUser";
import defaultCollectionImage from "@/assets/resource-robot-hand.svg";
import RelatedContentSection from "@/components/collection/RelatedContentSection";
import CollectionContentArea from "@/components/collection/CollectionContentArea";
import CertificatePreviewModal, { type CertificatePreviewDetails } from "@/components/collection/CertificatePreviewModal";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { usePermissions } from "@/hooks/usePermission";
import { useTelemetry } from "@/hooks/useTelemetry";
import useImpression from "@/hooks/useImpression";
import useInteract from "@/hooks/useInteract";
import "./collection.css";

const CollectionDetailPage = () => {
  const { collectionId, batchId: batchIdParam, contentId } = useParams<{ collectionId: string; batchId?: string; contentId?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = usePermissions();
  const isContentCreator = useIsContentCreator();
  const { t } = useAppI18n();
  const telemetry = useTelemetry();
  const { interact } = useInteract();
  useImpression({ type: 'view', pageid: 'collection-detail', object: { id: collectionId || '', type: 'Collection' } });
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);
  const [certificatePreviewUrl, setCertificatePreviewUrl] = useState("");

  const { data: collectionDataFromApi, isLoading, isFetching, isError, error, refetch } = useCollection(collectionId);
  const collectionData = collectionDataFromApi ?? null;
  const { data: userReadData } = useUserRead();
  const userProfile = userReadData?.data?.response;
  const enrollment = useCollectionEnrollment(collectionId, batchIdParam, collectionData, isAuthenticated);
  const { isEnrolledInCurrentBatch, contentStatusMap, courseProgressProps, batches, batchListLoading, batchListError,
    firstCertPreviewUrl, hasCertificate, joinLoading, joinError, handleJoinCourse, effectiveBatchId, isBatchEnded } = enrollment;
  const hasBatchInRoute = !!batchIdParam;
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const currentUserId = userAuthInfoService.getUserId();
  const isCreatorViewingOwnCollection =
    !!isAuthenticated &&
    !!collectionData?.createdBy &&
    !!currentUserId &&
    collectionData.createdBy === currentUserId;
  /** Content creators get access without batch and no progress (own or others' collection); BatchCard only when viewing own. */
  const contentCreatorPrivilege = isCreatorViewingOwnCollection || !!isContentCreator;

  const [, setAuthRefresh] = useState(0);
  const triedAuthRefreshRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || userAuthInfoService.getUserId() || triedAuthRefreshRef.current) return;
    triedAuthRefreshRef.current = true;
    userAuthInfoService.getAuthInfo().then(() => setAuthRefresh((n) => n + 1)).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!collectionId || hasBatchInRoute || contentCreatorPrivilege) return;
    const batchId = enrollment.enrollmentForCollection?.batchId;
    if (batchId) navigate(`/collection/${collectionId}/batch/${batchId}`, { replace: true });
  }, [collectionId, hasBatchInRoute, contentCreatorPrivilege, enrollment.enrollmentForCollection?.batchId, navigate]);

  const isTrackable = (collectionDataFromApi?.trackable?.enabled?.toLowerCase() ?? "") === "yes";
  /** Block content when trackable and (not logged in, or logged in but not enrolled in current batch and not creator). */
  const contentBlocked = isTrackable && (
    !isAuthenticated
    || (!contentCreatorPrivilege && !(hasBatchInRoute && isEnrolledInCurrentBatch))
  );
  const showLoading = isLoading || (isError && isFetching);
  const hierarchySuccess = !isError && !!collectionDataFromApi;
  const displayCollectionData = useMemo(
    () => (collectionData ? { ...collectionData, image: collectionData.image || defaultCollectionImage } : null),
    [collectionData]
  );
  const { data: searchData, isError: searchError, error: searchErrorObj, refetch: searchRefetch, isFetching: searchFetching } = useContentSearch({
    request: { limit: 20, offset: 0 }, enabled: hierarchySuccess,
  });
  const { data: contentReadData, isLoading: contentIsLoading, error: contentError } = useContentRead(contentId ?? '');
  const selectedContentData = contentReadData?.data?.content;
  const isQumlContent = selectedContentData?.mimeType === 'application/vnd.sunbird.questionset' ||
    selectedContentData?.mimeType === 'application/vnd.sunbird.question';
  const { data: qumlData, isLoading: qumlIsLoading, error: qumlError } = useQumlContent(contentId ?? '', { enabled: isQumlContent });
  const playerMetadata = isQumlContent ? qumlData : selectedContentData;
  const playerIsLoading = contentId ? (isQumlContent ? qumlIsLoading : contentIsLoading) : false;
  const playerError = isQumlContent ? qumlError : contentError;
  const currentContentStatus = contentId ? contentStatusMap?.[contentId] : undefined;
  const { handlePlayerEvent, handleTelemetryEvent } = useCollectionDetailPlayer({
    collectionId, contentId: contentId ?? undefined, effectiveBatchId, isEnrolledInCurrentBatch,
    isBatchEnded, mimeType: playerMetadata?.mimeType, currentContentStatus, skipContentStateUpdate: contentCreatorPrivilege,
  });
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const initialExpandedSet = useRef(false);

  useEffect(() => {
    if (!collectionData?.hierarchyRoot || contentId) return;
    const firstContentId = getFirstLeafContentIdFromHierarchy(collectionData.hierarchyRoot);
    if (!firstContentId) return;
    if (!isTrackable || contentCreatorPrivilege) {
      navigate(`/collection/${collectionId}/content/${firstContentId}`, { replace: true });
      return;
    }
    if (hasBatchInRoute && batchIdParam) {
      navigate(`/collection/${collectionId}/batch/${batchIdParam}/content/${firstContentId}`, { replace: true });
    }
  }, [contentId, collectionData?.hierarchyRoot, collectionId, navigate, isTrackable, contentCreatorPrivilege, hasBatchInRoute, batchIdParam]);

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
    interact({ id: 'collection-module-toggle', type: 'CLICK', pageid: 'collection-detail', cdata: [{ id: moduleId, type: 'CollectionUnit' }] });
    setExpandedModules((prev) => prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]);
  };

  const certificatePreviewDetails: CertificatePreviewDetails = useMemo(() => {
    const recipientName = userProfile
      ? [userProfile.firstName ?? "", userProfile.lastName ?? ""].filter(Boolean).join(" ").trim() || undefined
      : undefined;
    return { recipientName };
  }, [userProfile?.firstName, userProfile?.lastName]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Go Back Link - always visible */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
          data-edataid="collection-go-back"
          data-pageid="collection-detail"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t("button.goBack")}
        </button>

        {showLoading && (
          <PageLoader message={t("loading")} fullPage={false} />
        )}

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
              isAuthenticated={isAuthenticated}
              isContentCreator={isContentCreator}
              collectionId={collectionId}
              hasBatchInRoute={hasBatchInRoute}
              courseProgressProps={courseProgressProps}
              batchIdParam={batchIdParam}
              expandedModules={expandedModules}
              toggleModule={toggleModule}
              contentStatusMap={contentStatusMap}
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
            />

            {/* Related Content Section */}
            <RelatedContentSection
              searchError={searchError}
              searchErrorObj={searchErrorObj}
              searchFetching={searchFetching}
              relatedContentItems={relatedContentItems}
              searchRefetch={searchRefetch}
            />

            <div className="mt-16">
              <FAQSection />
            </div>
          </>
        )}
      </main>

      <CertificatePreviewModal
        open={certificatePreviewOpen}
        onClose={() => setCertificatePreviewOpen(false)}
        previewUrl={certificatePreviewUrl}
        details={certificatePreviewDetails}
      />
      <Footer />
    </div>
  );
};

export default CollectionDetailPage;

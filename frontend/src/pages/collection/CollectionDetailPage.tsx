import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import FAQSection from "@/components/landing/FAQSection";
import RelatedContent from "@/components/common/RelatedContent";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useCollection } from "@/hooks/useCollection";
import { useCollectionEnrollment } from "@/hooks/useCollectionEnrollment";
import { useContentRead, useContentSearch } from "@/hooks/useContent";
import { useQumlContent } from "@/hooks/useQumlContent";
import { useContentPlayer } from "@/hooks/useContentPlayer";
import { mapSearchContentToRelatedContentItems } from "@/services/collection";
import CollectionOverview from "@/components/collection/CollectionOverview";
import CollectionSidebar from "@/components/collection/CollectionSidebar";
import LoginToUnlockCard from "@/components/collection/LoginToUnlockCard";
import CourseProgressCard from "@/components/collection/CourseProgressCard";
import AvailableBatchesCard from "@/components/collection/AvailableBatchesCard";
import CertificateCard from "@/components/collection/CertificateCard";
import CertificatePreviewModal from "@/components/collection/CertificatePreviewModal";
import defaultCollectionImage from "@/assets/resource-robot-hand.svg";
import { useAuth } from "@/auth/AuthContext";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import "./collection.css";

const CollectionDetailPage = () => {
  const { collectionId, batchId: batchIdParam, contentId } = useParams<{ collectionId: string; batchId?: string; contentId?: string }>();
  const navigate = useNavigate();
  const { t } = useAppI18n();
  const { isAuthenticated: contextAuth } = useAuth();
  const isAuthenticated = contextAuth || userAuthInfoService.isUserAuthenticated();
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);
  const [certificatePreviewUrl, setCertificatePreviewUrl] = useState("");

  const { data: collectionDataFromApi, isLoading, isFetching, isError, error, refetch } = useCollection(collectionId);
  const collectionData = collectionDataFromApi ?? null;
  const enrollment = useCollectionEnrollment(collectionId, batchIdParam, collectionData, isAuthenticated);
  const { isEnrolledInCurrentBatch, contentStatusMap, courseProgressProps, batches, batchListLoading, batchListError,
    firstCertPreviewUrl, hasCertificate, joinLoading, joinError, handleJoinCourse } = enrollment;
  const hasBatchInRoute = !!batchIdParam;
  const [selectedBatchId, setSelectedBatchId] = useState("");

  useEffect(() => {
    if (!collectionId || hasBatchInRoute) return;
    const batchId = enrollment.enrollmentForCollection?.batchId;
    if (batchId) navigate(`/collection/${collectionId}/batch/${batchId}`, { replace: true });
  }, [collectionId, hasBatchInRoute, enrollment.enrollmentForCollection?.batchId, navigate]);

  const isTrackable = (collectionDataFromApi?.trackable?.enabled?.toLowerCase() ?? "") === "yes";
  const contentBlocked = isTrackable && !isAuthenticated;
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
  const playerMetadata = isQumlContent ? qumlData : selectedContentData;
  const playerIsLoading = contentId ? (isQumlContent ? qumlIsLoading : contentIsLoading ) : false;
  const playerError = isQumlContent ? qumlError : contentError;

  const { handlePlayerEvent, handleTelemetryEvent } = useContentPlayer({
    onPlayerEvent: (event) => console.log('Collection content player event:', event),
    onTelemetryEvent: (event) => console.log('Collection content telemetry event:', event),
  });

  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const initialExpandedSet = useRef(false);

  // Auto-navigate to first content when collection loads without a selected contentId
  useEffect(() => {
    if (!collectionData || contentId) return;
    const firstLesson = collectionData.modules?.[0]?.lessons?.[0];
    if (!firstLesson) return;
    const mime = (firstLesson.mimeType ?? '').toLowerCase();
    if (mime === 'application/vnd.ekstep.content-collection') return;
    if (!isTrackable) {
      navigate(`/collection/${collectionId}/content/${firstLesson.id}`, { replace: true });
      return;
    }
    if (hasBatchInRoute && batchIdParam) {
      navigate(`/collection/${collectionId}/batch/${batchIdParam}/content/${firstLesson.id}`, { replace: true });
    }
  }, [contentId, collectionData, collectionId, navigate, isTrackable, hasBatchInRoute, batchIdParam]);

  useEffect(() => {
    const firstId = collectionData?.modules?.[0]?.id;
    if (firstId && !initialExpandedSet.current) {
      setExpandedModules([firstId]);
      initialExpandedSet.current = true;
    }
  }, [collectionData?.modules]);
  useEffect(() => { initialExpandedSet.current = false; setExpandedModules([]); }, [collectionId]);

  const hasSearchResults = (searchData?.data?.content?.length ?? 0) > 0;

  const relatedContentItems = useMemo(
    () => (hasSearchResults ? mapSearchContentToRelatedContentItems(searchData?.data?.content, collectionData?.id ?? undefined, 3) : []),
    [hasSearchResults, searchData?.data?.content, collectionData?.id]
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

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
            error="Collection not found."
            onRetry={() => refetch()}
            fullPage={false}
          />
        )}

        {!showLoading && hierarchySuccess && collectionData && displayCollectionData && (
          <>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground max-w-[75%]">{collectionData.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <span>{collectionData.lessons} {t("contentStats.lessons")}</span>
        </div>


        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Left Column */}
          <CollectionOverview
            collectionData={displayCollectionData}
            contentId={contentId}
            contentAccessBlocked={isTrackable && (contentBlocked || !isEnrolledInCurrentBatch)}
            playerMetadata={playerMetadata}
            playerIsLoading={playerIsLoading}
            playerError={playerError ?? null}
            onPlayerEvent={handlePlayerEvent}
            onTelemetryEvent={handleTelemetryEvent}
          />

          {/* Right Sidebar - Lessons Accordion */}
          <div className="lg:sticky lg:top-6 flex flex-col max-h-[calc(100vh_-_120px)] pr-3">
            {contentBlocked && (
              <div className="flex-shrink-0 mb-4">
                <LoginToUnlockCard />
              </div>
            )}
            {isTrackable && !contentBlocked && hasBatchInRoute && isEnrolledInCurrentBatch && courseProgressProps && (
              <div className="flex-shrink-0 mb-4">
                <CourseProgressCard {...courseProgressProps} />
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <CollectionSidebar
                collectionId={collectionId ?? ''}
                batchId={hasBatchInRoute ? batchIdParam ?? null : null}
                modules={collectionData.modules}
                expandedModules={expandedModules}
                toggleModule={toggleModule}
                activeLessonId={contentId ?? null}
                contentBlocked={contentBlocked}
                contentStatusMap={hasBatchInRoute && isEnrolledInCurrentBatch ? contentStatusMap : undefined}
              />
            </div>
            {isTrackable && !contentBlocked && (
              <div className="flex-shrink-0 flex flex-col gap-4 mt-4">
                {!hasBatchInRoute && (
                  <AvailableBatchesCard
                    batches={batches}
                    selectedBatchId={selectedBatchId}
                    onBatchSelect={setSelectedBatchId}
                    onJoinCourse={() => handleJoinCourse(selectedBatchId)}
                    isLoading={batchListLoading}
                    joinLoading={joinLoading}
                    error={batchListError}
                    joinError={joinError}
                  />
                )}
                <CertificateCard
                  hasCertificate={hasCertificate}
                  previewUrl={firstCertPreviewUrl}
                  onPreviewClick={() => { if (firstCertPreviewUrl) { setCertificatePreviewUrl(firstCertPreviewUrl); setCertificatePreviewOpen(true); } }}
                />
              </div>
            )}
          </div>
        </div>

        <section className="mt-16">
          {(searchError || (searchFetching && relatedContentItems.length === 0)) && (
            <div className="content-player-related-header mb-6">
              <h2 className="content-player-related-title">{t("courseDetails.relatedContent")}</h2>
            </div>
          )}
          {searchError && searchErrorObj && (
            <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
              <PageLoader error={searchErrorObj.message} onRetry={() => searchRefetch()} fullPage={false} />
            </div>
          )}
          {!searchError && searchFetching && relatedContentItems.length === 0 && (
            <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
              <PageLoader message={t("loading")} fullPage={false} />
            </div>
          )}
          {!searchError && (relatedContentItems.length > 0 || !searchFetching) && (
            <RelatedContent items={relatedContentItems} cardType="collection" />
          )}
        </section>
        <div className="mt-16"><FAQSection /></div>
          </>
        )}
      </main>

      <CertificatePreviewModal
        open={certificatePreviewOpen}
        onClose={() => setCertificatePreviewOpen(false)}
        previewUrl={certificatePreviewUrl}
      />
      <Footer />
    </div>
  );
};

export default CollectionDetailPage;

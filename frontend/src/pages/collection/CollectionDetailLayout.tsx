import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import FAQSection from "@/components/landing/FAQSection";
import RelatedContentSection from "@/components/collection/RelatedContentSection";
import CollectionContentArea from "@/components/collection/CollectionContentArea";
import CertificatePreviewModal, { type CertificatePreviewDetails } from "@/components/collection/CertificatePreviewModal";
import CourseCompletionDialog from "@/components/collection/CourseCompletionDialog";
import type { CourseProgressCardProps } from "@/components/collection/CourseProgressCard";
import type { CollectionData } from "@/types/collectionTypes";
import type { TrackableCollection } from "@/types/TrackableCollections";
import type { PlayerEvent, TelemetryEvent } from "@/hooks/useContentPlayer";

interface CollectionDetailLayoutProps {
  // Navigation / i18n
  onGoBack: () => void;
  t: (key: string) => string;

  // Top-level state
  showLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;

  // Collection data
  collectionDataFromApi: CollectionData | null;
  hierarchySuccess: boolean;
  collectionData: CollectionData | null;
  displayCollectionData: CollectionData | null;

  // Enrollment / access
  isTrackable: boolean;
  isAuthenticated: boolean;
  hasBatchInRoute: boolean;
  isEnrolledInCurrentBatch: boolean;
  contentBlocked: boolean;
  upcomingBatchBlocked: boolean;

  // Routing identifiers
  collectionId: string | undefined;
  batchIdParam: string | undefined;
  contentId: string | undefined;

  // Player / self-assess
  maxAttemptsExceeded: boolean;
  playerMetadata: unknown;
  playerIsLoading: boolean;
  playerError: Error | null;
  handlePlayerEvent: (event: PlayerEvent) => void;
  handleTelemetryEvent: (event: TelemetryEvent) => void;

  // Enrollment / progress props
  courseProgressProps: CourseProgressCardProps | null | undefined;
  contentStatusMap: Record<string, number> | undefined;
  contentAttemptInfoMap: Record<string, { attemptCount: number }> | undefined;
  batches: TrackableCollection[] | undefined;
  batchListLoading: boolean;
  batchListError: string | undefined;
  joinLoading: boolean;
  joinError: string;
  handleJoinCourse: (batchId: string) => void;
  hasCertificate: boolean;
  firstCertPreviewUrl: string | undefined;

  // UI state for sidebar
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;

  // Creator flags / profile
  isCreatorViewingOwnCollection: boolean;
  contentCreatorPrivilege: boolean;
  userProfile: Record<string, unknown> | undefined;
  userId: string | undefined;

  // Certificate preview modal
  certificatePreviewOpen: boolean;
  certificatePreviewUrl: string;
  certificatePreviewDetails: CertificatePreviewDetails;
  setCertificatePreviewUrl: (url: string) => void;
  setCertificatePreviewOpen: (open: boolean) => void;

  // Related content
  searchError: boolean;
  searchErrorObj: Error | null;
  searchFetching: boolean;
  relatedContentItems: Array<{ identifier?: string; name?: string }> ;
  searchRefetch: () => void;
}

const CollectionDetailLayout = ({
  onGoBack,
  t,
  showLoading,
  isError,
  error,
  onRetry,
  collectionDataFromApi,
  hierarchySuccess,
  collectionData,
  displayCollectionData,
  isTrackable,
  isAuthenticated,
  hasBatchInRoute,
  isEnrolledInCurrentBatch,
  contentBlocked,
  upcomingBatchBlocked,
  collectionId,
  batchIdParam,
  contentId,
  maxAttemptsExceeded,
  playerMetadata,
  playerIsLoading,
  playerError,
  handlePlayerEvent,
  handleTelemetryEvent,
  courseProgressProps,
  contentStatusMap,
  contentAttemptInfoMap,
  batches,
  batchListLoading,
  batchListError,
  joinLoading,
  joinError,
  handleJoinCourse,
  hasCertificate,
  firstCertPreviewUrl,
  expandedModules,
  toggleModule,
  selectedBatchId,
  setSelectedBatchId,
  isCreatorViewingOwnCollection,
  contentCreatorPrivilege,
  userProfile,
  userId,
  certificatePreviewOpen,
  certificatePreviewUrl,
  certificatePreviewDetails,
  setCertificatePreviewUrl,
  setCertificatePreviewOpen,
  searchError,
  searchErrorObj,
  searchFetching,
  relatedContentItems,
  searchRefetch,
}: CollectionDetailLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Go Back Link - always visible */}
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t("button.goBack")}
        </button>

        {showLoading && <PageLoader message={t("loading")} fullPage={false} />}
        {!showLoading && isError && error && (
          <PageLoader
            error={error.message}
            onRetry={onRetry}
            fullPage={false}
          />
        )}

        {!showLoading && !isError && collectionDataFromApi == null && (
          <PageLoader
            error={t("collection.notFound")}
            onRetry={onRetry}
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
              upcomingBatchBlocked={upcomingBatchBlocked}
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
              userId={userId ?? undefined}
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

export default CollectionDetailLayout;


import { useAppI18n } from "@/hooks/useAppI18n";
import CollectionOverview from "@/components/collection/CollectionOverview";
import CollectionSidebar from "@/components/collection/CollectionSidebar";
import BatchCard from "@/components/collection/BatchCard";
import LoginToUnlockCard from "@/components/collection/LoginToUnlockCard";
import CourseProgressCard from "@/components/collection/CourseProgressCard";
import AvailableBatchesCard from "@/components/collection/AvailableBatchesCard";
import CertificateCard from "@/components/collection/CertificateCard";

interface CollectionContentAreaProps {
  collectionData: any;
  contentId: string | undefined;
  isTrackable: boolean;
  contentBlocked: boolean;
  isEnrolledInCurrentBatch: boolean;
  playerMetadata: any;
  playerIsLoading: boolean;
  playerError: any;
  handlePlayerEvent: (event: any) => void;
  handleTelemetryEvent: (event: any) => void;
  isAuthenticated: boolean;
  isContentCreator: boolean;
  collectionId: string | undefined;
  hasBatchInRoute: boolean;
  courseProgressProps: any;
  batchIdParam: string | undefined;
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  contentStatusMap: any;
  batches: any;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  handleJoinCourse: (id: string) => void;
  batchListLoading: boolean;
  joinLoading: boolean;
  batchListError: any;
  joinError: any;
  hasCertificate: boolean;
  firstCertPreviewUrl: string | undefined;
  setCertificatePreviewUrl: (url: string) => void;
  setCertificatePreviewOpen: (open: boolean) => void;
}

export default function CollectionContentArea({
  collectionData,
  contentId,
  isTrackable,
  contentBlocked,
  isEnrolledInCurrentBatch,
  playerMetadata,
  playerIsLoading,
  playerError,
  handlePlayerEvent,
  handleTelemetryEvent,
  isAuthenticated,
  isContentCreator,
  collectionId,
  hasBatchInRoute,
  courseProgressProps,
  batchIdParam,
  expandedModules,
  toggleModule,
  contentStatusMap,
  batches,
  selectedBatchId,
  setSelectedBatchId,
  handleJoinCourse,
  batchListLoading,
  joinLoading,
  batchListError,
  joinError,
  hasCertificate,
  firstCertPreviewUrl,
  setCertificatePreviewUrl,
  setCertificatePreviewOpen,
}: CollectionContentAreaProps) {
  const { t } = useAppI18n();

  return (
    <>
      {/* Title Row */}
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground max-w-[75%]">{collectionData.title}</h1>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <span>{collectionData.lessons} {t("contentStats.lessons")}</span>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        {/* Left Column */}
        <CollectionOverview
          collectionData={collectionData}
          contentId={contentId}
          contentAccessBlocked={isTrackable && (contentBlocked || !isEnrolledInCurrentBatch)}
          playerMetadata={playerMetadata}
          playerIsLoading={playerIsLoading}
          playerError={playerError ?? null}
          onPlayerEvent={handlePlayerEvent}
          onTelemetryEvent={handleTelemetryEvent}
        />

        {/* Right Sidebar */}
        <div className="lg:sticky lg:top-6 flex flex-col h-fit max-h-[calc(100vh_-_120px)] pr-3 custom-scrollbar">
          {/* Creator: Batch management card */}
          {isAuthenticated && isContentCreator && collectionId && (
            <div className="mb-4">
              <BatchCard collectionId={collectionId} collectionName={collectionData.title} />
            </div>
          )}

          {/* Learner: Login gate */}
          {contentBlocked && (
            <div className="flex-shrink-0 mb-4">
              <LoginToUnlockCard />
            </div>
          )}

          {/* Learner: Course progress */}
          {isTrackable && !contentBlocked && hasBatchInRoute && isEnrolledInCurrentBatch && courseProgressProps && (
            <div className="flex-shrink-0 mb-4">
              <CourseProgressCard {...courseProgressProps} />
            </div>
          )}

          {/* Scrollable lesson list */}
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

          {/* Learner: Batch join + Certificate */}
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
                onPreviewClick={() => {
                  if (firstCertPreviewUrl) {
                    setCertificatePreviewUrl(firstCertPreviewUrl);
                    setCertificatePreviewOpen(true);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

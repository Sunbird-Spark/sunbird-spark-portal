import { useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { FiLayout } from "react-icons/fi";
import { Button } from "@/components/common/Button";
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
  /** When true (creator viewing own collection), BatchCard is shown. */
  isCreatorViewingOwnCollection?: boolean;
  /** When true (content creator viewing any collection), access without batch, no progress, learner cards hidden. */
  contentCreatorPrivilege?: boolean;
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
  isCreatorViewingOwnCollection = false,
  contentCreatorPrivilege = false,
}: CollectionContentAreaProps) {
  const { t } = useAppI18n();
  const navigate = useNavigate();

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

      <div className="grid lg:grid-cols-[1fr_23.75rem] gap-8 lg:items-start">
        {/* Left Column */}
        <CollectionOverview
          collectionData={collectionData}
          contentId={contentId}
          contentAccessBlocked={contentBlocked}
          playerMetadata={playerMetadata}
          playerIsLoading={playerIsLoading}
          playerError={playerError ?? null}
          onPlayerEvent={handlePlayerEvent}
          onTelemetryEvent={handleTelemetryEvent}
        />

        {/* Right Sidebar */}
        <div className="lg:sticky lg:top-6 flex flex-col min-h-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1 custom-scrollbar">
          {/* Creator: Dashboard link & Batch management card */}
          {isAuthenticated && isContentCreator && collectionId && (
            <div className="mb-4 flex flex-col gap-3 flex-shrink-0">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 font-['Rubik'] text-sunbird-brick border-sunbird-brick hover:bg-sunbird-brick/5 bg-white shadow-sm"
                onClick={() => navigate(`/collection/${collectionId}/dashboard/batches`)}
                data-testid="view-dashboard-btn"
              >
                <FiLayout className="w-4 h-4" />
                View Course Dashboard
              </Button>
              {isCreatorViewingOwnCollection && (
                <BatchCard collectionId={collectionId} collectionName={collectionData.title} />
              )}
            </div>
          )}

          {/* Learner: Login gate — only when trackable and not authenticated */}
          {contentBlocked && !isAuthenticated && (
            <div className="flex-shrink-0 mb-4">
              <LoginToUnlockCard />
            </div>
          )}

          {/* Learner: Course progress (hidden when content creator privilege) */}
          {isTrackable && !contentBlocked && !contentCreatorPrivilege && hasBatchInRoute && isEnrolledInCurrentBatch && courseProgressProps && (
            <div className="flex-shrink-0 mb-4">
              <CourseProgressCard {...courseProgressProps} />
            </div>
          )}

          {/* Scrollable lesson list */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <CollectionSidebar
              collectionId={collectionId ?? ''}
              batchId={hasBatchInRoute ? batchIdParam ?? null : null}
              children={collectionData.children ?? []}
              expandedMainUnitIds={expandedModules}
              toggleMainUnit={toggleModule}
              activeContentId={contentId ?? null}
              contentBlocked={contentBlocked}
              contentStatusMap={hasBatchInRoute && isEnrolledInCurrentBatch && !contentCreatorPrivilege ? contentStatusMap : undefined}
            />
          </div>

          {/* Learner: Batch join + Certificate — show when trackable and authenticated learner (so they can join); hidden for content creators */}
          {isTrackable && isAuthenticated && !contentCreatorPrivilege && (
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

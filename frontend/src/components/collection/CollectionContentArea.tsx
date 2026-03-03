import { useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { FiLayout } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import CollectionOverview from "@/components/collection/CollectionOverview";
import CollectionSidebar from "@/components/collection/CollectionSidebar";
import BatchCard from "@/components/collection/BatchCard";
import LoginToUnlockCard from "@/components/collection/LoginToUnlockCard";
import CourseProgressCard from "@/components/collection/CourseProgressCard";
import LearnerBottomCards from "@/components/collection/LearnerBottomCards";
import { useForceSync } from "@/hooks/useForceSync";

interface CollectionContentAreaProps {
  collectionData: any;
  contentId: string | undefined;
  isTrackable: boolean;
  contentBlocked: boolean;
  isEnrolledInCurrentBatch: boolean;
  showMaxAttemptsExceeded?: boolean;
  playerMetadata: any;
  playerIsLoading: boolean;
  playerError: any;
  handlePlayerEvent: (event: any) => void;
  handleTelemetryEvent: (event: any) => void;
  isAuthenticated: boolean;
  collectionId: string | undefined;
  hasBatchInRoute: boolean;
  courseProgressProps: any;
  batchIdParam: string | undefined;
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  contentStatusMap: any;
  contentAttemptInfoMap?: Record<string, { attemptCount: number }>;
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
  /** User profile for Profile Data Sharing consent modal (from useUserRead). */
  userProfile?: Record<string, unknown> | null;
  /** Current user id for force sync (learner). */
  userId?: string | null;
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
  showMaxAttemptsExceeded = false,
  isAuthenticated,
  collectionId,
  hasBatchInRoute,
  courseProgressProps,
  batchIdParam,
  expandedModules,
  toggleModule,
  contentStatusMap,
  contentAttemptInfoMap,
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
  userProfile = null,
  userId = null,
}: CollectionContentAreaProps) {
  const { t } = useAppI18n();
  const navigate = useNavigate();
  const { showForceSyncButton, handleForceSync, isForceSyncing } = useForceSync(
    userId,
    collectionId,
    batchIdParam,
    courseProgressProps
  );

  const showProfileDataSharingCard =
    isTrackable &&
    isAuthenticated &&
    !contentCreatorPrivilege &&
    hasBatchInRoute &&
    isEnrolledInCurrentBatch &&
    (collectionData?.userConsent?.toLowerCase() ?? "") === "yes";

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

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:items-stretch">
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
          showMaxAttemptsExceeded={showMaxAttemptsExceeded}
        />

        {/* Right Sidebar */}
        <div className="lg:sticky lg:top-6 flex flex-col min-h-0 lg:min-h-[calc(100vh-5rem)] lg:max-h-[calc(100vh-5rem)] pr-1">
          {/* Creator: Dashboard link & Batch management card — only for the course owner */}
          {isAuthenticated && isCreatorViewingOwnCollection && collectionId && (
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
              <BatchCard collectionId={collectionId} collectionName={collectionData.title} />
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
              <CourseProgressCard
                {...courseProgressProps}
                showForceSyncButton={showForceSyncButton}
                onForceSync={handleForceSync}
                isForceSyncing={isForceSyncing}
              />
            </div>
          )}

          {/* Scrollable lesson list — scrollbar only here; progress and cards stay fixed */}
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
              contentAttemptInfoMap={hasBatchInRoute && isEnrolledInCurrentBatch && !contentCreatorPrivilege ? contentAttemptInfoMap : undefined}
            />
          </div>

          {/* Learner: Batch join + Certificate — show when trackable and authenticated learner (so they can join); hidden for content creators */}
          {isTrackable && isAuthenticated && !contentCreatorPrivilege && (
            <LearnerBottomCards
              hasBatchInRoute={hasBatchInRoute}
              batches={batches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
              onJoinCourse={handleJoinCourse}
              batchListLoading={batchListLoading}
              joinLoading={joinLoading}
              batchListError={batchListError}
              joinError={joinError}
              hasCertificate={hasCertificate}
              firstCertPreviewUrl={firstCertPreviewUrl}
              onCertificatePreviewClick={() => {
                if (firstCertPreviewUrl) {
                  setCertificatePreviewUrl(firstCertPreviewUrl);
                  setCertificatePreviewOpen(true);
                }
              }}
              showProfileDataSharingCard={showProfileDataSharingCard}
              collectionId={collectionId}
              channel={collectionData?.channel}
              userProfile={userProfile ?? undefined}
            />
          )}
        </div>
      </div>
    </>
  );
}

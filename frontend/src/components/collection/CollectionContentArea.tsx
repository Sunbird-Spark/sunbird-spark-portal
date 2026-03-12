import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { FiArrowLeft, FiLayout } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import CollectionOverview from "@/components/collection/CollectionOverview";
import CollectionSidebar from "@/components/collection/CollectionSidebar";
import BatchCard from "@/components/collection/BatchCard";
import LoginToUnlockCard from "@/components/collection/LoginToUnlockCard";
import LearnerBottomCards from "@/components/collection/LearnerBottomCards";
import { useForceSync } from "@/hooks/useForceSync";
import type { CourseProgressCardProps } from "@/components/collection/CourseProgressCard";
import type { BatchListItem } from "@/types/collectionTypes";
import CourseProgressSection from "@/components/collection/CourseProgressSection";


/** Access and blocking state for the collection detail view. */
export interface CollectionContentAreaAccessProps {
  isTrackable: boolean;
  isAuthenticated: boolean;
  hasBatchInRoute: boolean;
  isEnrolledInCurrentBatch: boolean;
  contentBlocked: boolean;
  upcomingBatchBlocked: boolean;
  batchStartDateForOverview?: string;
}

/** Player state and handlers for the content player. */
export interface CollectionContentAreaPlayerProps {
  playerMetadata: any;
  playerIsLoading: boolean;
  playerError: any;
  handlePlayerEvent: (event: any) => void;
  handleTelemetryEvent: (event: any) => void;
  showMaxAttemptsExceeded?: boolean;
}

/** Enrollment, progress, batch list and certificate state. */
export interface CollectionContentAreaEnrollmentProps {
  courseProgressProps: any;
  contentStatusMap: any;
  contentAttemptInfoMap?: Record<string, { attemptCount: number }>;
  batches: BatchListItem[] | undefined;
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

/** Sidebar UI state and route identifiers. */
export interface CollectionContentAreaSidebarProps {
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  collectionId: string | undefined;
  batchIdParam: string | undefined;
}

/** Creator/viewer flags and user profile for consent. */
export interface CollectionContentAreaCreatorProps {
  isCreatorViewingOwnCollection?: boolean;
  contentCreatorPrivilege?: boolean;
  userProfile?: Record<string, unknown> | null;
  userId?: string | null;
  /** The route to return to when the user exits the collection (used for back navigation). */
  backTo?: string;
}

interface CollectionContentAreaProps {
  collectionData: any;
  contentId: string | undefined;
  access: CollectionContentAreaAccessProps;
  player: CollectionContentAreaPlayerProps;
  enrollment: CollectionContentAreaEnrollmentProps;
  sidebar: CollectionContentAreaSidebarProps;
  creator?: CollectionContentAreaCreatorProps;
  backTo?: string;
}

export default function CollectionContentArea({
  collectionData,
  contentId,
  access,
  player,
  enrollment,
  sidebar,
  creator = {},
  backTo = '/home',
}: CollectionContentAreaProps) {
  const {
    isTrackable,
    isAuthenticated,
    hasBatchInRoute,
    isEnrolledInCurrentBatch,
    contentBlocked,
    upcomingBatchBlocked,
    batchStartDateForOverview,
  } = access;
  const {
    playerMetadata,
    playerIsLoading,
    playerError,
    handlePlayerEvent,
    handleTelemetryEvent,
    showMaxAttemptsExceeded = false,
  } = player;
  const {
    courseProgressProps,
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
  } = enrollment;
  const { expandedModules, toggleModule, collectionId, batchIdParam } = sidebar;
  const {
    isCreatorViewingOwnCollection = false,
    contentCreatorPrivilege = false,
    userProfile = null,
    userId = null,
  } = creator;

  const { t } = useAppI18n();
  const navigate = useNavigate();
  const { showForceSyncButton, handleForceSync, isForceSyncing } = useForceSync(
    userId,
    collectionId,
    batchIdParam,
    courseProgressProps as CourseProgressCardProps | null | undefined
  );

  const showProfileDataSharingCard =
    isTrackable &&
    isAuthenticated &&
    !contentCreatorPrivilege &&
    hasBatchInRoute &&
    isEnrolledInCurrentBatch &&
    (collectionData?.userConsent?.toLowerCase() ?? "") === "yes";

  const showCourseProgress =
    isTrackable && (!contentBlocked || upcomingBatchBlocked) && !contentCreatorPrivilege && hasBatchInRoute && isEnrolledInCurrentBatch && !!courseProgressProps;

  const showCertificateCard = hasBatchInRoute && isEnrolledInCurrentBatch;
  const showBottomSections =
    isTrackable && isAuthenticated && !contentCreatorPrivilege && (showCertificateCard || showProfileDataSharingCard);

  // Measure the actual CollectionOverview content height (not the grid cell,
  // which stretches to the row height). The ref goes on an inner wrapper so
  // we get the true content height to constrain the aside.
  // We also keep the initial height as a floor so feedback/end-page shrink
  // doesn't cause layout jumps.
  const overviewRef = useRef<HTMLDivElement>(null);
  const initialHeightRef = useRef<number>(0);
  const [leftColHeight, setLeftColHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = overviewRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight;
      if (initialHeightRef.current === 0) {
        initialHeightRef.current = h;
      }
      setLeftColHeight(Math.max(h, initialHeightRef.current));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 2-column CSS grid: row 1 = header (go-back + title | progress), row 2 = main content.
           Grid rows share height so the player and content rows start at the exact same Y. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-x-8">
        {/* Row 1, Col 1: Go Back + Title + Lessons */}
        <div className="min-w-0 pb-4">
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-3 hover:opacity-80 transition-opacity"
          >
            <FiArrowLeft className="w-4 h-4" />
            {t("button.goBack")}
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">{collectionData.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{collectionData.lessons} {t("contentStats.lessons")}</span>
          </div>
        </div>

        {/* Row 1, Col 2: Course Progress (compact, vertically centered alongside go-back + title) */}
        <div className="self-center pb-4">
          {showCourseProgress && (
            <CourseProgressSection
              collectionId={collectionId}
              batchIdParam={batchIdParam}
              userId={userId}
              isTrackable={isTrackable}
              contentBlocked={contentBlocked}
              upcomingBatchBlocked={upcomingBatchBlocked}
              contentCreatorPrivilege={contentCreatorPrivilege}
              hasBatchInRoute={hasBatchInRoute}
              isEnrolledInCurrentBatch={isEnrolledInCurrentBatch}
              courseProgressProps={courseProgressProps as CourseProgressCardProps}
              showForceSyncButton={showForceSyncButton}
              onForceSync={handleForceSync}
              isForceSyncing={isForceSyncing}
            />
          )}
        </div>

        {/* Row 2, Col 1: Player + Overview — scrolls with the page.
             Inner wrapper (overviewRef) measures true content height,
             not the grid-stretched cell height. */}
        <div className="min-w-0">
          <div ref={overviewRef}>
            <CollectionOverview
              collectionData={collectionData}
              contentId={contentId}
              contentAccessBlocked={contentBlocked && !upcomingBatchBlocked}
              upcomingBatchBlocked={upcomingBatchBlocked}
              batchStartDate={batchStartDateForOverview ?? courseProgressProps?.batchStartDate}
              playerMetadata={playerMetadata}
              playerIsLoading={playerIsLoading}
              playerError={playerError ?? null}
              onPlayerEvent={handlePlayerEvent}
              onTelemetryEvent={handleTelemetryEvent}
              showMaxAttemptsExceeded={showMaxAttemptsExceeded}
            />
          </div>
        </div>

        {/* Row 2, Col 2: Content rows + bottom sections.
             Content rows have flexible height and will scroll when they would push sections below the Collection Overview.
             Certificate and Profile sections are positioned naturally below content rows. */}
        <aside
          className="flex flex-col overflow-hidden"
          style={leftColHeight != null ? { maxHeight: leftColHeight } : undefined}
        >
          {/* Creator: Dashboard link & Batch management card */}
          {isTrackable && isAuthenticated && isCreatorViewingOwnCollection && collectionId && (
            <div className="flex flex-col gap-3 mb-4">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 font-['Rubik'] text-sunbird-brick border-sunbird-brick hover:bg-sunbird-brick/5 bg-white shadow-sm"
                onClick={() => navigate(`/collection/${collectionId}/dashboard/batches`, { state: { from: backTo } })}
                data-testid="view-dashboard-btn"
              >
                <FiLayout className="w-4 h-4" />
                View Course Dashboard
              </Button>
              <BatchCard collectionId={collectionId} collectionName={collectionData.title} />
            </div>
          )}

          {/* Learner: Login gate */}
          {contentBlocked && !isAuthenticated && (
            <div className="mb-4">
              <LoginToUnlockCard />
            </div>
          )}

          {/* Content rows section - natural height, scrolls only when it would push sections past overview */}
          <div className="min-h-0 overflow-y-scroll custom-scrollbar">
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

          {/* Learner: Batch join card — show when not enrolled yet */}
          {isTrackable && isAuthenticated && !contentCreatorPrivilege && !hasBatchInRoute && (
            <div className="mt-4 flex-shrink-0">
              <LearnerBottomCards
                hasBatchInRoute={hasBatchInRoute}
                showCertificateCard={false}
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
                showProfileDataSharingCard={false}
                collectionId={collectionId}
                channel={collectionData?.channel}
                userProfile={userProfile ?? undefined}
              />
            </div>
          )}

          {/* Certificate & Profile Data Sharing sections - directly below content rows,
               stuck to course overview bottom when content rows expand */}
          {showBottomSections && (
            <div className="flex-shrink-0 flex flex-col gap-4">
              {showCertificateCard && (
                <LearnerBottomCards
                  hasBatchInRoute={hasBatchInRoute}
                  showCertificateCard
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
                  showProfileDataSharingCard={false}
                  collectionId={collectionId}
                  channel={collectionData?.channel}
                  userProfile={userProfile ?? undefined}
                />
              )}
              {showProfileDataSharingCard && (
                <LearnerBottomCards
                  hasBatchInRoute={hasBatchInRoute}
                  showCertificateCard={false}
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
                  showProfileDataSharingCard
                  collectionId={collectionId}
                  channel={collectionData?.channel}
                  userProfile={userProfile ?? undefined}
                />
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

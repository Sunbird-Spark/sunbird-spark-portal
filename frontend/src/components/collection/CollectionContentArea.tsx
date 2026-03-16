import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { FiArrowLeft } from "react-icons/fi";
import CollectionOverview from "@/components/collection/CollectionOverview";
import { useForceSync } from "@/hooks/useForceSync";
import type { CourseProgressCardProps } from "@/components/collection/CourseProgressCard";
import CourseProgressSection from "@/components/collection/CourseProgressSection";
import CollectionSidePanel from "@/components/collection/CollectionSidePanel";
import type { CollectionContentAreaProps } from "@/types/collectionContentAreaTypes";


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
  const { courseProgressProps } = enrollment;
  const { collectionId, batchIdParam } = sidebar;
  const {
    isCreatorViewingOwnCollection = false,
    isMentorViewingCourse = false,
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

        {/* Row 1, Col 2: Course Progress */}
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

        {/* Row 2, Col 1: Player + Overview */}
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

        {/* Row 2, Col 2: Sidebar panel */}
        <CollectionSidePanel
          contentId={contentId}
          access={access}
          enrollment={enrollment}
          sidebar={sidebar}
          creator={{
            isCreatorViewingOwnCollection,
            contentCreatorPrivilege,
            userProfile,
            isMentorViewingCourse,
          }}
          collectionData={collectionData}
          leftColHeight={leftColHeight}
          showCertificateCard={showCertificateCard}
          showBottomSections={showBottomSections}
          showProfileDataSharingCard={showProfileDataSharingCard}
          backTo={backTo}
        />
      </div>
    </>
  );
}

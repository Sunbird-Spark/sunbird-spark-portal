import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useUnenrol } from "@/hooks/useBatch";
import CourseProgressCard, { type CourseProgressCardProps } from "./CourseProgressCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface CourseProgressSectionProps {
  collectionId: string | undefined;
  batchIdParam: string | undefined;
  userId: string | null;
  isTrackable: boolean;
  contentBlocked: boolean;
  contentCreatorPrivilege: boolean;
  hasBatchInRoute: boolean;
  isEnrolledInCurrentBatch: boolean;
  courseProgressProps: CourseProgressCardProps;
  showForceSyncButton: boolean;
  onForceSync?: () => void;
  isForceSyncing: boolean;
}

export default function CourseProgressSection({
  collectionId,
  batchIdParam,
  userId,
  isTrackable,
  contentBlocked,
  contentCreatorPrivilege,
  hasBatchInRoute,
  isEnrolledInCurrentBatch,
  courseProgressProps,
  showForceSyncButton,
  onForceSync,
  isForceSyncing,
}: CourseProgressSectionProps) {
  const { t } = useAppI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unenrolMutation = useUnenrol();
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);

  const { totalContentCount, completedContentCount = 0 } = courseProgressProps;

  const progressPercentage = useMemo(() => {
    if (!totalContentCount || totalContentCount <= 0) {
      return 0;
    }
    return Math.min(100, Math.ceil((completedContentCount / totalContentCount) * 100));
  }, [totalContentCount, completedContentCount]);

  const canShowUnenroll =
    isTrackable &&
    !contentBlocked &&
    !contentCreatorPrivilege &&
    hasBatchInRoute &&
    isEnrolledInCurrentBatch &&
    Boolean(collectionId && batchIdParam && userId) &&
    progressPercentage < 100;

  const showUnenrollOption = canShowUnenroll && showForceSyncButton === false;

  const handleConfirmUnenroll = async () => {
    if (!collectionId || !userId || !batchIdParam) return;
    try {
      await unenrolMutation.mutateAsync({
        courseId: collectionId,
        userId,
        batchId: batchIdParam,
      });
      await queryClient.invalidateQueries({ queryKey: ["userEnrollments"] });
      await queryClient.invalidateQueries({ queryKey: ["contentState"] });
      setShowUnenrollDialog(false);
      navigate(`/collection/${collectionId}`);
    } catch {
      // Error handling is surfaced via API layer / toasts if configured.
    }
  };

  return (
    <>
      <CourseProgressCard
        {...courseProgressProps}
        showForceSyncButton={showForceSyncButton && !showUnenrollOption}
        onForceSync={onForceSync}
        isForceSyncing={isForceSyncing}
        showUnenrollOption={showUnenrollOption}
        onUnenroll={() => setShowUnenrollDialog(true)}
        isUnenrolling={unenrolMutation.isPending}
      />
      <ConfirmDialog
        open={showUnenrollDialog}
        onClose={() => {
          if (!unenrolMutation.isPending) {
            setShowUnenrollDialog(false);
          }
        }}
        onConfirm={handleConfirmUnenroll}
        title={t("courseDetails.leaveCourseTitle")}
        description={t("courseDetails.leaveCourseDescription")}
        confirmLabel={t("courseDetails.leaveCourse")}
        confirmVariant="destructive"
        isLoading={unenrolMutation.isPending}
      />
    </>
  );
}


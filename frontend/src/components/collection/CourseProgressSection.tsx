import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useToast } from "@/hooks/useToast";
import { useUnenrol } from "@/hooks/useBatch";
import CourseProgressCard, { type CourseProgressCardProps } from "./CourseProgressCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface CourseProgressSectionProps {
  collectionId: string | undefined;
  batchIdParam: string | undefined;
  userId: string | null;
  isTrackable: boolean;
  contentBlocked: boolean;
  upcomingBatchBlocked?: boolean;
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
  upcomingBatchBlocked = false,
  contentCreatorPrivilege,
  hasBatchInRoute,
  isEnrolledInCurrentBatch,
  courseProgressProps,
  showForceSyncButton,
  onForceSync,
  isForceSyncing,
}: CourseProgressSectionProps) {
  const { t } = useAppI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unenrolMutation = useUnenrol();
  const [showUnenrolDialog, setShowUnenrolDialog] = useState(false);

  const { totalContentCount, completedContentCount = 0 } = courseProgressProps;

  const progressPercentage = useMemo(() => {
    if (upcomingBatchBlocked) return 0;
    if (!totalContentCount || totalContentCount <= 0) {
      return 0;
    }
    return Math.min(100, Math.ceil((completedContentCount / totalContentCount) * 100));
  }, [totalContentCount, completedContentCount, upcomingBatchBlocked]);

  const canShowUnenrol =
    isTrackable &&
    (!contentBlocked || upcomingBatchBlocked) &&
    !contentCreatorPrivilege &&
    hasBatchInRoute &&
    isEnrolledInCurrentBatch &&
    Boolean(collectionId && batchIdParam && userId) &&
    progressPercentage < 100;

  const showUnenrolOption = canShowUnenrol && showForceSyncButton === false;

  const progressPropsForCard: CourseProgressCardProps = upcomingBatchBlocked
    ? { ...courseProgressProps, completedContentCount: 0 }
    : courseProgressProps;

  const handleConfirmUnenrol = async () => {
    if (!collectionId || !userId || !batchIdParam) return;
    try {
      await unenrolMutation.mutateAsync({
        courseId: collectionId,
        userId,
        batchId: batchIdParam,
      });
      await queryClient.invalidateQueries({ queryKey: ["userEnrollments"] });
      await queryClient.invalidateQueries({ queryKey: ["contentState"] });
      setShowUnenrolDialog(false);
      toast({
        title: t("success"),
        description: t("courseDetails.unenrolSuccess"),
        variant: "default",
      });
      navigate(`/collection/${collectionId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast({
        title: t("error"),
        description: message || t("courseDetails.leaveCourseError"),
        variant: "destructive",
      });
      // Dialog stays open so the user can retry or cancel.
    }
  };

  return (
    <>
      <CourseProgressCard
        {...progressPropsForCard}
        isBatchUpcoming={upcomingBatchBlocked}
        showForceSyncButton={showForceSyncButton && !showUnenrolOption}
        onForceSync={onForceSync}
        isForceSyncing={isForceSyncing}
        showUnenrollOption={showUnenrolOption}
        onUnenroll={() => setShowUnenrolDialog(true)}
        isUnenrolling={unenrolMutation.isPending}
      />
      <ConfirmDialog
        open={showUnenrolDialog}
        onClose={() => {
          if (!unenrolMutation.isPending) {
            setShowUnenrolDialog(false);
          }
        }}
        onConfirm={handleConfirmUnenrol}
        title={t("courseDetails.leaveCourseTitle")}
        description={t("courseDetails.leaveCourseDescription")}
        confirmLabel={t("courseDetails.leaveCourse")}
        confirmVariant="destructive"
        isLoading={unenrolMutation.isPending}
      />
    </>
  );
}


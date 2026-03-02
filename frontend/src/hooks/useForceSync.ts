import { useState, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { useAppI18n } from "@/hooks/useAppI18n";
import { batchService } from "@/services/collection";
import { canUseForceSync, markForceSyncUsed } from "@/services/forceSyncStorage";

export function useForceSync(
  userId: string | null | undefined,
  collectionId: string | undefined,
  batchIdParam: string | undefined,
  courseProgressProps: { totalContentCount: number; completedContentCount: number } | null | undefined
) {
  const { toast } = useToast();
  const { t } = useAppI18n();
  const [, setForceSyncRefresh] = useState(0);
  const [isForceSyncing, setIsForceSyncing] = useState(false);

  const progressPercentage =
    courseProgressProps && courseProgressProps.totalContentCount > 0
      ? Math.min(
          100,
          Math.ceil(
            (courseProgressProps.completedContentCount / courseProgressProps.totalContentCount) * 100
          )
        )
      : 0;

  const showForceSyncButton = Boolean(
    userId &&
      collectionId &&
      batchIdParam &&
      progressPercentage >= 100 &&
      canUseForceSync(userId, collectionId, batchIdParam)
  );

  const handleForceSync = useCallback(async () => {
    if (!userId || !collectionId || !batchIdParam) return;
    if (!canUseForceSync(userId, collectionId, batchIdParam)) {
      toast({
        title: t("error"),
        description: t("courseDetails.forceSyncCooldown"),
        variant: "destructive",
      });
      return;
    }
    setIsForceSyncing(true);
    try {
      await batchService.forceSyncActivityAgg({
        userId,
        courseId: collectionId,
        batchId: batchIdParam,
      });
      markForceSyncUsed(userId, collectionId, batchIdParam);
      toast({
        title: t("success"),
        description: t("courseDetails.forceSyncSuccess"),
        variant: "default",
        viewport: "center",
      });
      // Trigger re-render so showForceSyncButton is recalculated and the sync button hides (canUseForceSync now returns false).
      setForceSyncRefresh((r) => r + 1);
    } catch (err) {
      const message = (err as Error).message;
      toast({
        title: t("error"),
        description: message && message.trim() ? message : t("error"),
        variant: "destructive",
      });
    } finally {
      setIsForceSyncing(false);
    }
  }, [userId, collectionId, batchIdParam, toast, t]);

  return { showForceSyncButton, handleForceSync, isForceSyncing };
}

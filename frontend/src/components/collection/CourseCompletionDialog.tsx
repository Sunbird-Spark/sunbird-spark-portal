import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dialog";
import { BadgesIcon } from "@/components/profile/ProfileIcons";
import type { CourseProgressCardProps } from "./CourseProgressCard";

interface CourseCompletionDialogProps {
  courseProgressProps: CourseProgressCardProps | null | undefined;
  isEnrolledInCurrentBatch: boolean;
  collectionId: string | undefined;
  hasCertificate: boolean;
}

export default function CourseCompletionDialog({
  courseProgressProps,
  isEnrolledInCurrentBatch,
  collectionId,
  hasCertificate,
}: CourseCompletionDialogProps) {
  const { t } = useAppI18n();
  const [open, setOpen] = useState(false);
  const previousProgressRef = useRef<number | null>(null);
  const lastCollectionIdRef = useRef<string | undefined>(undefined);
  const completionShownForCollectionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!collectionId) {
      previousProgressRef.current = null;
      lastCollectionIdRef.current = undefined;
      return;
    }
    if (collectionId !== lastCollectionIdRef.current) {
      lastCollectionIdRef.current = collectionId;
      previousProgressRef.current = null;
      setOpen(false);
    }
  }, [collectionId]);

  useEffect(() => {
    if (!courseProgressProps || !isEnrolledInCurrentBatch || !collectionId) {
      return;
    }
    const { totalContentCount, completedContentCount = 0 } = courseProgressProps;
    if (!totalContentCount || totalContentCount <= 0) {
      return;
    }
    const currentPercent = Math.min(
      100,
      Math.ceil((completedContentCount / totalContentCount) * 100),
    );
    if (previousProgressRef.current === null) {
      previousProgressRef.current = currentPercent;
      return;
    }
    if (previousProgressRef.current < 100 && currentPercent === 100) {
      if (!completionShownForCollectionIdsRef.current.has(collectionId)) {
        completionShownForCollectionIdsRef.current.add(collectionId);
        setOpen(true);
      }
      previousProgressRef.current = 100;
      return;
    }
    previousProgressRef.current = currentPercent;
  }, [courseProgressProps, isEnrolledInCurrentBatch, collectionId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setOpen(false);
        }
      }}
    >
      <DialogContent className="top-10 md:top-16 translate-y-0">
        <DialogHeader className="space-y-4 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-emerald-50">
              <BadgesIcon />
            </div>
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-xl font-semibold text-emerald-700">
                {t("congratulations")}
              </DialogTitle>
              <DialogDescription className="text-sm text-emerald-700">
                {t("courseDetails.courseCompletionMessage")}
              </DialogDescription>
            </div>
          </div>
          {hasCertificate ? (
            <p className="text-sm text-muted-foreground">
              {t("courseDetails.courseCompletionCertificateNote")}
            </p>
          ) : (
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                {t("courseDetails.courseCompletionNoCertificateNote")}
              </p>
            </div>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}


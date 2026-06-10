import { useEffect, useRef, useState } from "react";
import { FiInfo } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/common/Dialog";
import { formatBatchDisplayDate } from "@/services/collection/enrollmentMapper";

export interface CourseUpdatedBannerProps {
  /** ISO timestamp of the course's most recent publish. May be undefined if the API didn't return it. */
  lastPublishedOn: string | undefined;
  /** Course identifier — scopes "already shown" tracking so navigating between courses re-opens the dialog. */
  collectionId?: string;
}

/**
 * Returns true when the course was republished after the user enrolled.
 * Accepts enrolledDate as epoch ms or ISO string (Sunbird varies by deployment).
 */
export function shouldShowCourseUpdatedBanner(
  enrolledDate: number | string | undefined,
  lastPublishedOn: string | undefined
): boolean {
  if (enrolledDate == null || !lastPublishedOn) return false;
  const enrolledMs =
    typeof enrolledDate === "number" ? enrolledDate : new Date(enrolledDate).getTime();
  if (Number.isNaN(enrolledMs)) return false;
  const publishedMs = new Date(lastPublishedOn).getTime();
  if (Number.isNaN(publishedMs)) return false;
  return publishedMs > enrolledMs;
}

export default function CourseUpdatedBanner({
  lastPublishedOn,
  collectionId,
}: CourseUpdatedBannerProps) {
  const { t } = useAppI18n();
  const [open, setOpen] = useState(false);
  // Per-mount tracker so the dialog auto-opens at most once for a given (course, publish-version).
  // We don't persist this — refreshing the page or remounting the component will pop the dialog again.
  const shownForKeysRef = useRef<Set<string>>(new Set());

  const formattedDate = lastPublishedOn ? formatBatchDisplayDate(lastPublishedOn) : "";
  const dialogKey = lastPublishedOn
    ? `${collectionId ?? "unknown"}:${lastPublishedOn}`
    : null;

  useEffect(() => {
    if (!dialogKey || !formattedDate || formattedDate === "-") return;
    if (shownForKeysRef.current.has(dialogKey)) return;
    shownForKeysRef.current.add(dialogKey);
    setOpen(true);
  }, [dialogKey, formattedDate]);

  if (!formattedDate || formattedDate === "-") return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setOpen(false);
      }}
    >
      <DialogContent className="top-10 md:top-16 translate-y-0">
        <DialogHeader className="space-y-4 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FiInfo className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {t("collection.courseUpdatedTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground">
                {t("collection.courseUpdatedOnMessage", { date: formattedDate })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiClock } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { formatBatchDisplayDate } from "@/services/collection/enrollmentMapper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dialog";

const SESSION_KEY_PREFIX = "batch-expiry-dialog-shown:";

interface BatchExpiryDialogProps {
  isBatchEnded: boolean;
  isBatchExpiringSoon: boolean;
  batchEndDate: string | undefined;
  isEnrolledInCurrentBatch: boolean;
  collectionId: string | undefined;
  contentCreatorPrivilege: boolean;
}

export default function BatchExpiryDialog({
  isBatchEnded,
  isBatchExpiringSoon,
  batchEndDate,
  isEnrolledInCurrentBatch,
  collectionId,
  contentCreatorPrivilege,
}: BatchExpiryDialogProps) {
  const { t } = useAppI18n();
  const [open, setOpen] = useState(false);
  const lastCollectionIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!collectionId) {
      lastCollectionIdRef.current = undefined;
      setOpen(false);
      return;
    }
    if (collectionId !== lastCollectionIdRef.current) {
      lastCollectionIdRef.current = collectionId;
      setOpen(false);
    }
  }, [collectionId]);

  useEffect(() => {
    if (!collectionId || !isEnrolledInCurrentBatch || contentCreatorPrivilege) return;
    if (!isBatchEnded && !isBatchExpiringSoon) return;

    const sessionKey = `${SESSION_KEY_PREFIX}${collectionId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    sessionStorage.setItem(sessionKey, "1");
    setOpen(true);
  }, [collectionId, isEnrolledInCurrentBatch, contentCreatorPrivilege, isBatchEnded, isBatchExpiringSoon]);

  const formattedDate = formatBatchDisplayDate(batchEndDate);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setOpen(false);
      }}
    >
      <DialogContent className="top-10 md:top-16 translate-y-0">
        {isBatchEnded ? (
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FiClock className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <DialogTitle className="text-xl font-semibold text-gray-700">
                  {t("courseDetails.batchEndedTitle")}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {t("courseDetails.batchExpiredProgressWarning")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        ) : (
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <DialogTitle className="text-xl font-semibold text-amber-700">
                  {t("courseDetails.batchExpiringSoonTitle")}
                </DialogTitle>
                <DialogDescription className="text-sm text-amber-700">
                  {t("courseDetails.batchExpiringSoonWarning", { date: formattedDate })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/common/Button";
import { useAppI18n } from "@/hooks/useAppI18n";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "default";
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useAppI18n();
  const resolvedConfirmLabel = confirmLabel ?? t("confirm");
  const handleClose = useCallback(() => {
    if (!isLoading) onClose();
  }, [onClose, isLoading]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, handleClose]);

  if (!open) return null;

  const confirmButtonClass =
    confirmVariant === "destructive"
      ? "bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-rubik"
      : "bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-rubik";

      return createPortal(
        <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-sunbird-gray-f3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold font-rubik text-sunbird-obsidian mb-2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mb-6 font-rubik">
          {description}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            className="font-rubik border-sunbird-gray-d0 text-sunbird-obsidian hover:bg-sunbird-gray-f3 hover:text-sunbird-obsidian"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmButtonClass}
          >
            {isLoading ? t("confirmDialog.pleaseWait") : resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

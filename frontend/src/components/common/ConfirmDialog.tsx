import { useCallback, useEffect } from "react";
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
  confirmButtonProps?: Record<string, any>;
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
  confirmButtonProps,
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

  const confirmClassName =
    confirmVariant === "destructive"
      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
      : "bg-sunbird-brick hover:bg-sunbird-brick/90 text-white";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-rubik text-foreground mb-2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mb-6 font-rubik">
          {description}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            data-edataid="confirm-dialog-cancel"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmClassName}
            {...confirmButtonProps}
          >
            {isLoading ? t("confirmDialog.pleaseWait") : resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

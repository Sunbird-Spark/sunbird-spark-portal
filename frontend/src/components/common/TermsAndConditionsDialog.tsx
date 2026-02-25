import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FiX } from "react-icons/fi";
import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from "./Button";

interface TermsAndConditionsDialogProps {
  children: React.ReactNode;
  termsUrl: string;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TermsAndConditionsDialog: React.FC<TermsAndConditionsDialogProps> = ({
  children,
  termsUrl,
  title,
  open,
  onOpenChange,
}) => {
  const { t } = useAppI18n();
  const displayTitle = title || t("footer.terms");

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="tnc-dialog-overlay" />
        <DialogPrimitive.Content className="tnc-dialog-content">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="tnc-dialog-header">
              <DialogPrimitive.Title asChild>
                <h2 className="tnc-dialog-title">{displayTitle}</h2>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                View and read the terms and conditions document
              </DialogPrimitive.Description>
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="tnc-close-button"
                  aria-label={t("close")}
                >
                  <FiX className="w-[0.875rem] h-[0.875rem] tnc-close-icon" />
                </Button>
              </DialogPrimitive.Close>
            </div>

            {/* Iframe Content */}
            <div className="tnc-iframe-container">
              <iframe
                src={termsUrl}
                title={displayTitle}
                className="tnc-iframe"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

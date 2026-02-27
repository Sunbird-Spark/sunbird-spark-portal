import React, { useState } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FiX, FiLoader } from "react-icons/fi";
import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from "../common/Button";
import { cn } from "@/lib/utils";
import { TncCheckboxRow } from "@/components/collection/TncCheckboxRow";

interface TncAcceptancePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termsUrl: string;
  onAccept: () => void;
  isAccepting?: boolean;
}

export const TncAcceptancePopup: React.FC<TncAcceptancePopupProps> = ({
  open,
  onOpenChange,
  termsUrl,
  onAccept,
  isAccepting = false,
}) => {
  const { t } = useAppI18n();
  const [tncChecked, setTncChecked] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setTncChecked(false);
    onOpenChange(isOpen);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="tnc-dialog-overlay" />
        <DialogPrimitive.Content className="tnc-dialog-content">
          <div className="flex flex-col h-full">

            {/* Header */}
            <div className="tnc-dialog-header">
              <DialogPrimitive.Title asChild>
                <h2 className="tnc-dialog-title">{t('tncPopup.title')}</h2>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {t('tncPopup.description')}
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
                title={t('tncPopup.title')}
                className="tnc-iframe"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>

            {/* Acceptance Footer */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border bg-gray-50/60 rounded-b-[1.875rem]">
              <TncCheckboxRow
                checked={tncChecked}
                onCheckedChange={(v) => setTncChecked(!!v)}
                label=""
                onTermsClick={() => {}}
              />
              <button
                type="button"
                disabled={!tncChecked || isAccepting}
                onClick={onAccept}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white font-['Rubik'] transition-colors shrink-0",
                  !tncChecked || isAccepting
                    ? "bg-sunbird-brick/40 cursor-not-allowed"
                    : "bg-sunbird-brick hover:bg-opacity-90"
                )}
              >
                {isAccepting && <FiLoader className="w-4 h-4 animate-spin" />}
                {isAccepting ? t('tncPopup.accepting') : t('tncPopup.accept')}
              </button>
            </div>

          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

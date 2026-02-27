import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as Checkbox from "@radix-ui/react-checkbox";
import { FiX, FiCheck, FiLoader } from "react-icons/fi";
import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from "../common/Button";
import { cn } from "@/lib/utils";

interface TermsAndConditionsDialogProps {
  children: React.ReactNode;
  termsUrl: string;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When provided, a footer with a checkbox and "Continue" button is shown. */
  onAccept?: () => void;
  /** Shows a loading spinner on the Continue button while the API call is in-flight. */
  accepting?: boolean;
}

export const TermsAndConditionsDialog: React.FC<TermsAndConditionsDialogProps> = ({
  children,
  termsUrl,
  title,
  open,
  onOpenChange,
  onAccept,
  accepting = false,
}) => {
  const { t } = useAppI18n();
  const [tncChecked, setTncChecked] = React.useState(false);

  const displayTitle = title || t("footer.terms");

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setTncChecked(false);
    onOpenChange?.(isOpen);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
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
                {t("termsDialog.description")}
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

            {/* Acceptance Footer — only rendered when onAccept is provided */}
            {onAccept && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border bg-gray-50/60 rounded-b-[1.875rem]">
                <label
                  htmlFor="tnc-accept-check"
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <Checkbox.Root
                    id="tnc-accept-check"
                    checked={tncChecked}
                    onCheckedChange={(v) => setTncChecked(!!v)}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-sunbird-brick data-[state=checked]:bg-sunbird-brick data-[state=checked]:text-white focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40"
                  >
                    <Checkbox.Indicator>
                      <FiCheck className="w-3 h-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="text-sm text-foreground font-['Rubik']">
                    I have read and accept the Terms &amp; Conditions
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!tncChecked || accepting}
                  onClick={onAccept}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white font-['Rubik'] transition-colors shrink-0",
                    !tncChecked || accepting
                      ? "bg-sunbird-brick/40 cursor-not-allowed"
                      : "bg-sunbird-brick hover:bg-opacity-90"
                  )}
                >
                  {accepting && <FiLoader className="w-4 h-4 animate-spin" />}
                  {accepting ? "Accepting…" : "Continue"}
                </button>
              </div>
            )}

          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

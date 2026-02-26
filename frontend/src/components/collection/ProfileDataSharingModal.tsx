import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { Button } from "@/components/common/Button";
import { FiX } from "react-icons/fi";

export interface ProfileDataSharingModalProps {
  open: boolean;
  onClose: () => void;
  /** User profile for PII list (name, email, phone, etc.). */
  userProfile: Record<string, unknown> | null | undefined;
  onAgree: () => Promise<void>;
  onDisagree: () => Promise<void>;
  isSubmitting: boolean;
}

export default function ProfileDataSharingModal({
  open,
  onClose,
  userProfile,
  onAgree,
  onDisagree,
  isSubmitting,
}: ProfileDataSharingModalProps) {
  const { t } = useAppI18n();
  const [tncAgreed, setTncAgreed] = useState(false);

  useEffect(() => {
    if (!open) setTncAgreed(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const profile = userProfile ?? {};
  const declarationsInfo = (profile.declarations as { info?: Record<string, string> }[] | undefined)?.[0]?.info;

  const firstName = (profile.firstName as string) ?? "";
  const lastName = (profile.lastName as string) ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || "-";
  let emailId = (profile.email as string) ?? "-";
  let phone = (profile.phone as string) ?? "-";
  const userId = (profile.userId as string) ?? (profile.id as string) ?? "-";

  const locationList =
    (profile.userLocations as { type: string; name?: string; code?: string }[] | undefined) ??
    (profile.locations as { type: string; name?: string; code?: string }[] | undefined) ??
    (profile.profileLocation as { type: string; name?: string; code?: string }[] | undefined) ??
    [];

  const state = locationList.find((loc) => loc.type === "state")?.name ?? "-";
  const district = locationList.find((loc) => loc.type === "district")?.name ?? "-";
  const block = locationList.find((loc) => loc.type === "block")?.name ?? "-";
  const schoolLoc = locationList.find((loc) => loc.type === "school");
  let schoolName = schoolLoc?.name ?? "-";
  let schoolId = schoolLoc?.code ?? "-";

  const externalId =
    (profile.externalIds as { provider: string; id: string }[] | undefined)?.find(
      (e: { provider: string; id: string }) => e.provider === (profile.channel as string)
    )?.id ?? "-";

  if (declarationsInfo) {
    if (declarationsInfo["declared-email"]) emailId = declarationsInfo["declared-email"];
    if (declarationsInfo["declared-phone"]) phone = declarationsInfo["declared-phone"];
    if (declarationsInfo["declared-school-udise-code"]) schoolId = declarationsInfo["declared-school-udise-code"] || schoolId;
    if (declarationsInfo["declared-school-name"]) schoolName = declarationsInfo["declared-school-name"] || schoolName;
  }

  const fieldRows: { label: string; value: string }[] = [
    { label: t("profileDataSharing.fields.name"), value: name },
    { label: t("profileDataSharing.fields.state"), value: state },
    { label: t("profileDataSharing.fields.userId"), value: userId },
    { label: t("profileDataSharing.fields.externalId"), value: externalId },
    { label: t("profileDataSharing.fields.district"), value: district },
    { label: t("profileDataSharing.fields.block"), value: block },
    { label: t("profileDataSharing.fields.schoolId"), value: schoolId },
    { label: t("profileDataSharing.fields.schoolName"), value: schoolName },
    { label: t("profileDataSharing.fields.mobileNumber"), value: phone },
    { label: t("profileDataSharing.fields.emailId"), value: emailId },
  ];

  const handleShare = async () => {
    if (!tncAgreed || isSubmitting) return;
    await onAgree();
    onClose();
  };

  const handleDoNotShare = async () => {
    if (isSubmitting) return;
    await onDisagree();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-data-sharing-modal-title"
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2
            id="profile-data-sharing-modal-title"
            className="text-lg font-semibold font-rubik text-foreground"
          >
            {t("profileDataSharing.consentTitle")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("close")}
          >
            <FiX className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
          <div className="space-y-2 text-sm">
            {fieldRows.map(({ label, value }) => (
              <div key={label} className="flex gap-2">
                <span className="font-medium text-foreground shrink-0">{label}:</span>
                <span className="text-muted-foreground break-words">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("profileDataSharing.canEditFromProfile")}
          </p>
          <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={tncAgreed}
              onChange={(e) => setTncAgreed(e.target.checked)}
              className="mt-1 rounded border-input"
              aria-label={t("profileDataSharing.tncCheckboxLabel")}
            />
            <span>{t("profileDataSharing.tncText")}</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 p-4 border-t border-border flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleDoNotShare}
            disabled={isSubmitting}
            className="font-rubik"
          >
            {t("profileDataSharing.dontShare")}
          </Button>
          <Button
            type="button"
            onClick={handleShare}
            disabled={!tncAgreed || isSubmitting}
            className="font-rubik bg-sunbird-brick text-white hover:opacity-90"
          >
            {isSubmitting ? t("loading") : t("profileDataSharing.share")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

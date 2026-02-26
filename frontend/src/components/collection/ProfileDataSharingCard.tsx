import { useState } from "react";
import { useAppI18n } from "@/hooks/useAppI18n";
import type { ConsentStatus } from "@/types/consentTypes";
import ProfileDataSharingModal from "./ProfileDataSharingModal";

export interface ProfileDataSharingCardProps {
  /** ACTIVE = On, REVOKED or null = Off. */
  status: ConsentStatus | null;
  lastUpdatedOn: string | undefined;
  /** When true, user has not set consent yet (card shows Off); modal opens only on Update click. */
  noConsentYet?: boolean;
  onAgree: () => Promise<void>;
  onDisagree: () => Promise<void>;
  isUpdating: boolean;
  /** User profile for the modal PII list. */
  userProfile: Record<string, unknown> | null | undefined;
}

function formatLastUpdated(isoDate: string | undefined): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

export default function ProfileDataSharingCard({
  status,
  lastUpdatedOn,
  noConsentYet: _noConsentYet = false,
  onAgree,
  onDisagree,
  isUpdating,
  userProfile,
}: ProfileDataSharingCardProps) {
  const { t } = useAppI18n();
  const [modalOpen, setModalOpen] = useState(false);

  const isOn = status === "ACTIVE";
  const lastUpdatedStr = formatLastUpdated(lastUpdatedOn);

  const handleUpdateClick = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <>
      <div
        className="font-rubik w-full rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-white p-5 flex flex-col gap-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        data-testid="profile-data-sharing-card"
      >
        <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-foreground">
          {t("profileDataSharing.cardTitle")}
        </h3>
        <p className="font-rubik font-normal text-[0.8125rem] leading-[1.25] text-muted-foreground">
          {isOn
            ? t("profileDataSharing.statusOn")
            : t("profileDataSharing.statusOff")}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {lastUpdatedStr && (
            <span className="font-rubik font-normal text-[0.8125rem] text-muted-foreground">
              {t("profileDataSharing.lastUpdatedOn")} {lastUpdatedStr}
            </span>
          )}
          <button
            type="button"
            onClick={handleUpdateClick}
            className="font-rubik font-medium text-[0.8125rem] text-sunbird-brick hover:underline ml-auto"
          >
            {t("profileDataSharing.update")}
          </button>
        </div>
      </div>

      <ProfileDataSharingModal
        open={modalOpen}
        onClose={handleCloseModal}
        userProfile={userProfile}
        onAgree={onAgree}
        onDisagree={onDisagree}
        isSubmitting={isUpdating}
      />
    </>
  );
}

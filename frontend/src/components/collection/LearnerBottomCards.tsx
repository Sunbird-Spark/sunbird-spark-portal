import AvailableBatchesCard from "@/components/collection/AvailableBatchesCard";
import CertificateCard from "@/components/collection/CertificateCard";
import ProfileDataSharingCard from "@/components/collection/ProfileDataSharingCard";
import type { BatchListItem } from "@/types/collectionTypes";
import { useConsent } from "@/hooks/useConsent";
import { useToast } from "@/hooks/useToast";
import { useAppI18n } from "@/hooks/useAppI18n";

function toErrorMessage(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Error) return value.message;
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  ) {
    return (value as { message: string }).message;
  }
  return String(value);
}

interface LearnerBottomCardsProps {
  hasBatchInRoute: boolean;
  /** When true, CertificateCard is shown (certificate is per batch; only known after enrollment). */
  showCertificateCard: boolean;
  batches: unknown;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  onJoinCourse: (id: string) => void;
  batchListLoading: boolean;
  joinLoading: boolean;
  batchListError: unknown;
  joinError: unknown;
  hasCertificate: boolean;
  firstCertPreviewUrl: string | undefined;
  onCertificatePreviewClick: () => void;
  showProfileDataSharingCard: boolean;
  collectionId: string | undefined;
  channel: string | undefined;
  userProfile: Record<string, unknown> | undefined;
}

export function LearnerBottomCards({
  hasBatchInRoute,
  showCertificateCard,
  batches,
  selectedBatchId,
  setSelectedBatchId,
  onJoinCourse,
  batchListLoading,
  joinLoading,
  batchListError,
  joinError,
  hasCertificate,
  firstCertPreviewUrl,
  onCertificatePreviewClick,
  showProfileDataSharingCard,
  collectionId,
  channel,
  userProfile,
}: LearnerBottomCardsProps) {
  const { toast } = useToast();
  const { t } = useAppI18n();
  const { status: consentStatus, lastUpdatedOn: consentLastUpdatedOn, updateConsent, isUpdating: consentIsUpdating } = useConsent({
    collectionId: collectionId ?? undefined,
    channel,
    enabled: showProfileDataSharingCard,
  });

  const handleConsentAgree = async () => {
    try {
      await updateConsent("ACTIVE");
      toast({ title: t("success"), description: t("profileDataSharing.consentUpdateSuccess"), variant: "default" });
    } catch (err) {
      toast({ title: t("error"), description: (err as Error).message || t("profileDataSharing.consentUpdateError"), variant: "destructive" });
    }
  };

  const handleConsentDisagree = async () => {
    try {
      await updateConsent("REVOKED");
      toast({ title: t("success"), description: t("profileDataSharing.consentUpdateSuccess"), variant: "default" });
    } catch (err) {
      toast({ title: t("error"), description: (err as Error).message || t("profileDataSharing.consentUpdateError"), variant: "destructive" });
    }
  };

  return (
    <div className="flex-shrink-0 flex flex-col gap-4 mt-4">
      {!hasBatchInRoute && (
        <AvailableBatchesCard
          batches={(Array.isArray(batches) ? batches : []) as BatchListItem[]}
          selectedBatchId={selectedBatchId}
          onBatchSelect={setSelectedBatchId}
          onJoinCourse={() => onJoinCourse(selectedBatchId)}
          isLoading={batchListLoading}
          joinLoading={joinLoading}
          error={toErrorMessage(batchListError)}
          joinError={toErrorMessage(joinError)}
        />
      )}
      {showCertificateCard && (
        <CertificateCard
          hasCertificate={hasCertificate}
          previewUrl={firstCertPreviewUrl}
          onPreviewClick={onCertificatePreviewClick}
        />
      )}
      {showProfileDataSharingCard && (
        <ProfileDataSharingCard
          status={consentStatus}
          lastUpdatedOn={consentLastUpdatedOn}
          onAgree={handleConsentAgree}
          onDisagree={handleConsentDisagree}
          isUpdating={consentIsUpdating}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}

export default LearnerBottomCards;

import { TbCertificate } from "react-icons/tb";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CertificateCardProps {
  hasCertificate: boolean;
  previewUrl?: string;
  onPreviewClick?: () => void;
}

const CertificateCard = ({
  hasCertificate,
  previewUrl,
  onPreviewClick,
}: CertificateCardProps) => {
  const { t } = useAppI18n();

  const handlePreviewCertificate = () => {
    if (previewUrl && onPreviewClick) {
      onPreviewClick();
    }
  };

  if (hasCertificate) {
    return (
      <div
        className="font-rubik w-full rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-sunbird-status-ongoing-bg p-5 flex flex-col gap-3"
        data-testid="certificate-card"
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sunbird-brick/10 text-sunbird-brick"
            aria-hidden
          >
            <TbCertificate className="h-5 w-5" />
          </span>
          <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-sunbird-status-ongoing-text">
            {t("courseDetails.certificate")}
          </h3>
        </div>
        <p className="font-rubik font-normal text-[0.8125rem] leading-[100%] text-muted-foreground">
          {t("courseDetails.certificateEarnDescription")}
        </p>
        <button
          type="button"
          onClick={handlePreviewCertificate}
          disabled={!previewUrl}
          className="font-rubik font-medium text-[1rem] leading-normal w-fit h-[2.25rem] px-5 rounded-[0.375rem] bg-sunbird-brick text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center self-start"
        >
          {t("courseDetails.previewCertificate")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="font-rubik w-full rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-white p-5 flex flex-col gap-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
      data-testid="certificate-card"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sunbird-brick/10 text-sunbird-brick"
          aria-hidden
        >
          <TbCertificate className="h-5 w-5" />
        </span>
        <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-foreground">
          {t("courseDetails.certificate")}
        </h3>
      </div>
      <p className="font-rubik font-normal text-[0.8125rem] leading-[100%] text-muted-foreground">
        {t("courseDetails.certificateNotAvailable")}
      </p>
    </div>
  );
};

export default CertificateCard;

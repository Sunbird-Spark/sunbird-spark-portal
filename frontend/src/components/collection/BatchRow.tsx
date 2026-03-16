import dayjs from "dayjs";
import { FiAward, FiCalendar, FiEdit2, FiLock, FiEye } from "react-icons/fi";
import { Batch } from "@/services/BatchService";
import { cn } from "@/lib/utils";
import { useAppI18n } from "@/hooks/useAppI18n";

type BatchStatus = "Upcoming" | "Ongoing" | "Expired";

const STATUS_MAP: Record<string, BatchStatus> = {
  "0": "Upcoming",
  "1": "Ongoing",
  "2": "Expired",
};

const STATUS_STYLES: Record<BatchStatus, string> = {
  Upcoming: "bg-yellow-100 text-yellow-700",
  Ongoing:  "bg-green-100 text-green-700",
  Expired:  "bg-gray-100  text-gray-500",
};

export function getBatchStatus(status: string): BatchStatus {
  return STATUS_MAP[status] ?? "Expired";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD MMM YYYY") : "—";
}

interface BatchRowProps {
  batch: Batch;
  onEditClick: (batch: Batch) => void;
  onCertificateClick: (batch: Batch) => void;
  canManageCertificates?: boolean;
}

export const BatchRow = ({ batch, onEditClick, onCertificateClick, canManageCertificates = true }: BatchRowProps) => {
  const { t } = useAppI18n();
  const status = getBatchStatus(batch.status);
  const hasCertTemplate =
    batch.certTemplates != null && Object.keys(batch.certTemplates).length > 0;

  const today = dayjs().startOf("day");

  // Batch can only be edited if startDate has NOT yet passed (today included)
  const batchEditable = !batch.startDate || !dayjs(batch.startDate).isBefore(today);

  // Lock cert modifications after the batch end date has passed
  const certLocked =
    !!batch.endDate && dayjs(batch.endDate).isBefore(today);

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-foreground font-['Rubik'] leading-snug flex-1">
          {batch.name}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 font-['Rubik']",
              STATUS_STYLES[status]
            )}
          >
            {t(`batchTabs.${status.toLowerCase()}`)}
          </span>
          {/* Edit/View — disabled if start date has passed */}
          {batchEditable ? (
            <button
              type="button"
              onClick={() => onEditClick(batch)}
              title={canManageCertificates ? t('batchRow.editBatch') : t('batchRow.viewBatch')}
              aria-label={canManageCertificates ? t('batchRow.editBatch') : t('batchRow.viewBatch')}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sunbird-brick hover:bg-sunbird-brick/8 transition-colors"
            >
              {canManageCertificates ? <FiEdit2 className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span
              title={canManageCertificates ? t('batchRow.batchCannotBeEdited') : t('batchRow.viewBatch')}
              className="p-1.5 rounded-lg text-muted-foreground/40 cursor-not-allowed"
            >
              <FiLock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-['Rubik']">
        <FiCalendar className="w-3 h-3 shrink-0 text-sunbird-brick/70" />
        <span>
          {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
        </span>
        {batch.enrollmentEndDate && (
          <>
            <span className="text-border">·</span>
            <span>{t('batchRow.enrolmentEnds', { date: formatDate(batch.enrollmentEndDate) })}</span>
          </>
        )}
      </div>

      {/* Certificate action */}
      {canManageCertificates && (
        <div className="flex items-center gap-1.5 pt-0.5 border-t border-border/60">
          <FiAward className="w-3.5 h-3.5 text-sunbird-brick shrink-0" />
          {certLocked ? (
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground font-['Rubik'] cursor-not-allowed"
              title={t('batchRow.certificateCannotBeModified')}
            >
              <FiLock className="w-3 h-3" />
              {hasCertTemplate ? t('certificate.certificateLocked') : t('certificate.certificateUnavailable')}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onCertificateClick(batch)}
              className="text-xs text-sunbird-brick font-medium font-['Rubik'] hover:underline"
            >
              {hasCertTemplate ? t('certificate.editCertificate') : t('certificate.addCertificate')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};


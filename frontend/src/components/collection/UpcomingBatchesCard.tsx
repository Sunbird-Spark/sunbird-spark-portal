import { useAppI18n } from "@/hooks/useAppI18n";
import { FiChevronDown } from "react-icons/fi";
import type { BatchListItem } from "@/types/collectionTypes";

interface UpcomingBatchesCardProps {
  batches: BatchListItem[];
  selectedBatchId: string;
  onBatchSelect: (batchId: string) => void;
  onJoinCourse: () => void;
  isLoading?: boolean;
  joinLoading?: boolean;
  error?: string;
  joinError?: string;
}

const UpcomingBatchesCard = ({
  batches,
  selectedBatchId,
  onBatchSelect,
  onJoinCourse,
  isLoading = false,
  joinLoading = false,
  error,
  joinError,
}: UpcomingBatchesCardProps) => {
  const { t } = useAppI18n();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onBatchSelect(value || "");
  };

  return (
    <div
      className="font-rubik w-full max-w-[21.875rem] rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-sunbird-status-ongoing-bg p-5 flex flex-col gap-3"
      data-testid="upcoming-batches-card"
    >
      <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-sunbird-status-ongoing-text">
        {t("courseDetails.upcomingBatches")}
      </h3>
      <p className="font-rubik font-normal text-[0.8125rem] leading-[100%] text-muted-foreground">
        {t("courseDetails.selectBatchToStart")}
      </p>
      {error && (
        <p className="font-rubik text-[0.8125rem] text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="relative">
        <select
          value={selectedBatchId}
          onChange={handleSelectChange}
          disabled={isLoading}
          className="font-rubik w-full appearance-none rounded-[0.375rem] border border-sunbird-status-ongoing-border bg-white px-4 py-2.5 pr-10 text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-status-ongoing-border/50 disabled:opacity-60"
          data-testid="batch-select"
          aria-label={t("courseDetails.selectBatch")}
        >
          <option value="">{t("courseDetails.selectBatch")}</option>
          {batches.map((batch) => (
            <option key={batch.identifier} value={batch.identifier}>
              {batch.name ?? batch.identifier}
            </option>
          ))}
        </select>
        <FiChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
      {joinError && (
        <p className="font-rubik text-[0.8125rem] text-red-600" role="alert">
          {joinError}
        </p>
      )}
      <button
        type="button"
        onClick={onJoinCourse}
        disabled={!selectedBatchId || joinLoading}
        className="font-rubik font-medium text-[1rem] leading-normal w-full h-[2.25rem] rounded-[0.375rem] bg-sunbird-brick text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
      >
        {joinLoading ? t("loading") : t("courseDetails.joinTheCourse")}
      </button>
    </div>
  );
};

export default UpcomingBatchesCard;

import { useAppI18n } from "@/hooks/useAppI18n";
import type { BatchListItem, AvailableBatchesCardProps } from "@/types/collectionTypes";
import { formatBatchDisplayDate } from "@/services/collection/enrollmentMapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";

function BatchOptionLabel({ batch }: { batch: BatchListItem }) {
  const { t } = useAppI18n();
  const start = formatBatchDisplayDate(batch.startDate);
  const timelineEnd =
    batch.endDate != null && batch.endDate !== "" ? formatBatchDisplayDate(batch.endDate) : t("courseDetails.noEndDate");
  const timelineText = `${start}–${timelineEnd}`;
  const enrollmentEndText =
    batch.enrollmentEndDate != null && batch.enrollmentEndDate !== ""
      ? formatBatchDisplayDate(batch.enrollmentEndDate)
      : t("courseDetails.noEndDate");
  return (
    <span className="block text-left">
      <span className="font-medium text-foreground">{batch.name ?? batch.identifier}</span>
      <span className="block text-xs text-muted-foreground mt-0.5">
        {t("courseDetails.timeline")}: {timelineText}
      </span>
      <span className="block text-xs text-muted-foreground mt-0.5">
        {t("courseDetails.enrollmentEndsBy")}: {enrollmentEndText}
      </span>
    </span>
  );
}

const AvailableBatchesCard = ({
  batches,
  selectedBatchId,
  onBatchSelect,
  onJoinCourse,
  isLoading = false,
  joinLoading = false,
  error,
  joinError,
}: AvailableBatchesCardProps) => {
  const { t } = useAppI18n();

  const isEmpty = batches.length === 0 && !isLoading;

  return (
    <div
      className="font-rubik w-full max-w-[21.875rem] rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-sunbird-status-ongoing-bg p-5 flex flex-col gap-3"
      data-testid="available-batches-card"
    >
      <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-sunbird-status-ongoing-text">
        {t("courseDetails.availableBatches")}
      </h3>
      {error && (
        <p className="font-rubik text-[0.8125rem] text-red-600" role="alert">
          {error}
        </p>
      )}
      {isEmpty ? (
        <p className="font-rubik text-[0.8125rem] text-muted-foreground">
          {t("courseDetails.noBatchesAvailable")}
        </p>
      ) : (
        <>
          <p className="font-rubik font-normal text-[0.8125rem] leading-[100%] text-muted-foreground">
            {t("courseDetails.selectBatchToStart")}
          </p>
          <Select
            value={selectedBatchId || ""}
            onValueChange={onBatchSelect}
            disabled={isLoading || batches.length === 0}
          >
            <SelectTrigger
              className="font-rubik w-full rounded-[0.375rem] border-sunbird-status-ongoing-border bg-white px-4 py-2.5 text-[0.875rem] text-foreground focus:ring-sunbird-status-ongoing-border/50 text-left disabled:opacity-60 [&>svg]:relative [&>svg]:right-0"
              data-testid="batch-select"
              aria-label={t("courseDetails.selectBatch")}
            >
              <SelectValue placeholder={t("courseDetails.selectBatch")} />
            </SelectTrigger>
            <SelectContent
              className="max-h-60 border-sunbird-status-ongoing-border [&_[data-radix-select-viewport]>*>span:first-of-type]:hidden"
              data-testid="batch-select-list"
            >
              {batches.map((batch) => (
                <SelectItem
                  key={batch.identifier}
                  value={batch.identifier}
                  className="pl-4 pr-2 focus:bg-gray-50 focus:text-foreground hover:bg-gray-50"
                >
                  <BatchOptionLabel batch={batch} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </>
      )}
    </div>
  );
};

export default AvailableBatchesCard;

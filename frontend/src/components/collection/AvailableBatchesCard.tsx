import { useState, useRef, useEffect } from "react";
import { useAppI18n } from "@/hooks/useAppI18n";
import { FiChevronDown } from "react-icons/fi";
import type { BatchListItem, AvailableBatchesCardProps } from "@/types/collectionTypes";
import { formatBatchDisplayDate } from "@/services/collection/enrollmentMapper";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBatch = batches.find((b) => b.identifier === selectedBatchId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (batchId: string) => {
    onBatchSelect(batchId);
    setDropdownOpen(false);
  };

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
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => !isLoading && batches.length > 0 && setDropdownOpen((o) => !o)}
              disabled={isLoading || batches.length === 0}
              className="font-rubik w-full flex items-center justify-between rounded-[0.375rem] border border-sunbird-status-ongoing-border bg-white px-4 py-2.5 pr-10 text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-status-ongoing-border/50 disabled:opacity-60 text-left"
              data-testid="batch-select"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-label={t("courseDetails.selectBatch")}
            >
              {selectedBatch ? (
                <BatchOptionLabel batch={selectedBatch} />
              ) : (
                <span className="text-muted-foreground">{t("courseDetails.selectBatch")}</span>
              )}
              <FiChevronDown
                className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {dropdownOpen && batches.length > 0 && (
              <ul
                role="listbox"
                className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-[0.375rem] border border-sunbird-status-ongoing-border bg-white shadow-lg py-1"
                data-testid="batch-select-list"
              >
                {batches.map((batch) => (
                  <li
                    key={batch.identifier}
                    role="option"
                    aria-selected={batch.identifier === selectedBatchId}
                    onClick={() => handleSelect(batch.identifier)}
                    className="px-4 py-1.5 cursor-pointer hover:bg-gray-50 border-b border-gray-300 last:border-b-0"
                  >
                    <BatchOptionLabel batch={batch} />
                  </li>
                ))}
              </ul>
            )}
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
        </>
      )}
    </div>
  );
};

export default AvailableBatchesCard;

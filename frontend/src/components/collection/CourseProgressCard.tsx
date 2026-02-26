import { useAppI18n } from "@/hooks/useAppI18n";
import { formatBatchDisplayDate } from "@/services/collection/enrollmentMapper";

const CONTENT_STATUS_COMPLETED = 2;

function getCompletedCount(
  contentStatus: Record<string, number> | undefined,
  totalCount: number,
  completionPercentage: number
): number {
  if (contentStatus && typeof contentStatus === "object") {
    return Object.values(contentStatus).filter(
      (status) => status === CONTENT_STATUS_COMPLETED
    ).length;
  }
  if (totalCount > 0 && typeof completionPercentage === "number") {
    return Math.round((completionPercentage / 100) * totalCount);
  }
  return 0;
}

export interface CourseProgressCardProps {
  batchStartDate?: string;
  totalContentCount: number;
  completedContentCount?: number;
  contentStatus?: Record<string, number>;
  completionPercentage?: number;
}

const CourseProgressCard = ({
  batchStartDate,
  totalContentCount,
  completedContentCount: completedContentCountProp,
  contentStatus,
  completionPercentage = 0,
}: CourseProgressCardProps) => {
  const { t } = useAppI18n();

  const completedContentCount =
    completedContentCountProp ??
    getCompletedCount(contentStatus, totalContentCount, completionPercentage);

  const progressPercentage =
    totalContentCount > 0
      ? Math.min(100, Math.ceil((completedContentCount / totalContentCount) * 100))
      : 0;

  const displayDate = batchStartDate ? formatBatchDisplayDate(batchStartDate) : null;

  return (
    <div
      className="font-rubik w-full rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-sunbird-status-ongoing-bg p-5 flex flex-col gap-3"
      data-testid="course-progress-card"
    >
      <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-sunbird-status-ongoing-text">
        {t("courseDetails.courseProgress")}
      </h3>
      {displayDate && (
        <p className="font-rubik font-normal text-[0.8125rem] leading-[100%] text-muted-foreground">
          {t("courseDetails.batchStartedOn")}: {displayDate}
        </p>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-white/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-sunbird-brick transition-[width] duration-300"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("courseDetails.courseProgress")}
          />
        </div>
        <span className="font-rubik font-medium text-[0.875rem] leading-[100%] text-sunbird-status-ongoing-text tabular-nums">
          {progressPercentage}%
        </span>
      </div>
    </div>
  );
};

export default CourseProgressCard;

import { useAppI18n } from "@/hooks/useAppI18n";
import { formatBatchDisplayDate } from "@/services/collection/enrollmentMapper";
import { FiMoreVertical } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";

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
  showForceSyncButton?: boolean;
  onForceSync?: () => void;
  isForceSyncing?: boolean;
  showUnenrollOption?: boolean;
  onUnenroll?: () => void;
  isUnenrolling?: boolean;
}

const CourseProgressCard = ({
  batchStartDate,
  totalContentCount,
  completedContentCount: completedContentCountProp,
  contentStatus,
  completionPercentage = 0,
  showForceSyncButton = false,
  onForceSync,
  isForceSyncing = false,
  showUnenrollOption = false,
  onUnenroll,
  isUnenrolling = false,
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

  const showMenu = (showForceSyncButton && !!onForceSync) || (showUnenrollOption && !!onUnenroll);
  const isLoading = showUnenrollOption ? isUnenrolling : isForceSyncing;

  return (
    <div
      className="font-rubik w-full rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-sunbird-status-ongoing-bg p-5 flex flex-col gap-3"
      data-testid="course-progress-card"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-sunbird-status-ongoing-text">
          {t("courseDetails.courseProgress")}
        </h3>
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded hover:bg-white/50 text-sunbird-status-ongoing-text focus:outline-none focus:ring-2 focus:ring-sunbird-brick/50"
                aria-label={
                  showUnenrollOption
                    ? t("courseDetails.leaveCourse")
                    : t("courseDetails.forceSync")
                }
                disabled={isLoading}
              >
                <FiMoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-max min-w-[8rem] bg-white border border-sunbird-gray-f3 rounded-xl shadow-lg z-50 py-1">
              <DropdownMenuItem
                onClick={showUnenrollOption ? onUnenroll : onForceSync}
                disabled={isLoading}
                className="font-rubik cursor-pointer text-sunbird-obsidian focus:bg-sunbird-brick/10 focus:text-sunbird-brick"
              >
                {isLoading
                  ? t("loading")
                  : showUnenrollOption
                    ? t("courseDetails.leaveCourse")
                    : t("courseDetails.forceSync")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
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

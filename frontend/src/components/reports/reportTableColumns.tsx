import type { Column } from "@/components/reports/DataTableWrapper";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LearnerProgress, AssessmentRecord } from "@/types/reports";

const statusColor: Record<string, string> = { "Completed": "default", "In Progress": "secondary", "Not Started": "outline" };
const certColor: Record<string, string> = { "Issued": "default", "Pending": "secondary", "N/A": "outline" };

export function buildLearnerColumns(t: (k: string) => string): Column<LearnerProgress>[] {
  return [
    { key: "learnerName", header: t("courseReport.colLearnerName"), sortable: true },
    { key: "enrollmentDate", header: t("courseReport.enrolled"), sortable: true },
    {
      key: "progressPercent",
      header: t("courseReport.colProgress"),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 min-w-[7.5rem]">
          <Progress value={row.progressPercent} className="h-2 flex-1" />
          <span className="text-xs font-medium w-8 text-right">{row.progressPercent}%</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("courseReport.colStatus"),
      sortable: true,
      render: (row) => (
        <Badge variant={statusColor[row.status] as "default"} className="text-xs">{row.status}</Badge>
      ),
    },
    { key: "lastActiveDate", header: t("courseReport.colLastActive"), sortable: true },
    {
      key: "certificateStatus",
      header: t("courseReport.colCertificate"),
      render: (row) => (
        <Badge variant={certColor[row.certificateStatus] as "default"} className="text-xs">
          {row.certificateStatus}
        </Badge>
      ),
    },
  ];
}

export function buildAssessmentColumns(t: (k: string) => string): Column<AssessmentRecord>[] {
  return [
    { key: "learnerName", header: t("courseReport.colLearnerName"), sortable: true },
    { key: "attemptNumber", header: t("courseReport.colAttempt"), sortable: true, className: "text-center" },
    { key: "score", header: t("courseReport.colScore"), sortable: true, className: "text-right" },
    { key: "maxScore", header: t("courseReport.colMaxScore"), className: "text-right" },
    {
      key: "percentage",
      header: t("courseReport.colPercent"),
      sortable: true,
      className: "text-right",
      render: (r) => `${r.percentage}%`,
    },
    { key: "attemptDate", header: t("courseReport.colDate"), sortable: true },
  ];
}

import type { Column } from "@/components/reports/DataTableWrapper";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LearnerProgress, AssessmentRecord } from "@/types/reports";

const statusColor: Record<string, string> = { "Completed": "default", "In Progress": "secondary", "Not Started": "outline" };
const certColor: Record<string, string> = { "Issued": "default", "Pending": "secondary", "N/A": "outline" };

export const learnerColumns: Column<LearnerProgress>[] = [
  { key: "learnerName", header: "Learner Name", sortable: true },
  { key: "enrollmentDate", header: "Enrolled", sortable: true },
  {
    key: "progressPercent",
    header: "Progress",
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
    header: "Status",
    sortable: true,
    render: (row) => (
      <Badge variant={statusColor[row.status] as "default"} className="text-xs">{row.status}</Badge>
    ),
  },
  { key: "lastActiveDate", header: "Last Active", sortable: true },
  {
    key: "certificateStatus",
    header: "Certificate",
    render: (row) => (
      <Badge variant={certColor[row.certificateStatus] as "default"} className="text-xs">
        {row.certificateStatus}
      </Badge>
    ),
  },
];

export const assessmentColumns: Column<AssessmentRecord>[] = [
  { key: "learnerName", header: "Learner Name", sortable: true },
  { key: "attemptNumber", header: "Attempt #", sortable: true, className: "text-center" },
  { key: "score", header: "Score", sortable: true, className: "text-right" },
  { key: "maxScore", header: "Max Score", className: "text-right" },
  {
    key: "percentage",
    header: "%",
    sortable: true,
    className: "text-right",
    render: (r) => `${r.percentage}%`,
  },
  {
    key: "passFail",
    header: "Result",
    render: (row) => (
      <Badge variant={row.passFail === "Pass" ? "default" : "destructive"} className="text-xs">
        {row.passFail}
      </Badge>
    ),
  },
  { key: "attemptDate", header: "Date", sortable: true },
];

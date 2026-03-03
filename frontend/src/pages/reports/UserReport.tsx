import { useParams } from "react-router-dom";
import ReportLayout from "@/components/reports/ReportLayout";
import useImpression from "@/hooks/useImpression";
import SummaryCard from "@/components/reports/SummaryCard";
import DataTableWrapper, { type Column } from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  userReportSummary,
  userCourseProgressData,
  userCertificates,
  userAssessmentHistory,
} from "@/data/reportsMockData";
import type { UserCourseProgress, UserCertificate, UserAssessmentHistory } from "@/types/reports";

const statusColor: Record<string, string> = {
  "Completed": "default",
  "In Progress": "secondary",
  "Not Started": "outline",
};

const UserReport = () => {
  const { userId } = useParams();
  useImpression({ type: 'view', pageid: 'user-report', object: { id: userId || '', type: 'User' } });
  const summary = userReportSummary;

  const courseColumns: Column<UserCourseProgress>[] = [
    { key: "courseName", header: "Course", sortable: true },
    {
      key: "progressPercent",
      header: "Progress",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={row.progressPercent} className="h-2 flex-1" />
          <span className="text-xs font-medium w-8 text-right">{row.progressPercent}%</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={statusColor[row.status] as "default"} className="text-xs">{row.status}</Badge>,
    },
    { key: "enrollmentDate", header: "Enrolled", sortable: true },
    { key: "lastAccessed", header: "Last Accessed", sortable: true },
  ];

  const certColumns: Column<UserCertificate>[] = [
    { key: "courseName", header: "Course", sortable: true },
    { key: "certificateId", header: "Certificate ID" },
    { key: "issuedDate", header: "Issued Date", sortable: true },
  ];

  const assessColumns: Column<UserAssessmentHistory>[] = [
    { key: "courseName", header: "Course", sortable: true },
    { key: "assessmentName", header: "Assessment", sortable: true },
    { key: "score", header: "Score", sortable: true, className: "text-right" },
    { key: "maxScore", header: "Max", className: "text-right" },
    { key: "percentage", header: "%", sortable: true, className: "text-right", render: (r) => `${r.percentage}%` },
    {
      key: "passFail",
      header: "Result",
      render: (row) => <Badge variant={row.passFail === "Pass" ? "default" : "destructive"} className="text-xs">{row.passFail}</Badge>,
    },
    { key: "attemptDate", header: "Date", sortable: true },
  ];

  return (
    <ReportLayout
      title={`User Report: ${summary.userName}`}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <SummaryCard label="Courses Completed" value={summary.coursesCompleted} colorClass="bg-sunbird-moss" />
        <SummaryCard label="Courses Pending" value={summary.coursesPending} colorClass="bg-sunbird-ginger" />
        <SummaryCard label="Certificates Issued" value={summary.certificatesIssued} colorClass="bg-sunbird-ink" />
        <SummaryCard label="Content Completed" value={summary.contentCompleted} colorClass="bg-sunbird-wave" />
        <SummaryCard label="Assessments Done" value={summary.assessmentsCompleted} colorClass="bg-sunbird-lavender" />
      </div>

      {/* Course Progress */}
      <section className="mb-8" aria-label="Course Progress">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Course Progress</h2>
          <ExportButton
            data={userCourseProgressData as unknown as Record<string, unknown>[]}
            filename="user-course-progress"
            columns={courseColumns.map((c) => ({ key: c.key, header: c.header }))}
          />
        </div>
        <DataTableWrapper columns={courseColumns} data={userCourseProgressData} keyExtractor={(r) => r.id} pageSize={10} />
      </section>

      {/* Certificates */}
      <section className="mb-8" aria-label="Certificates">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Certificates</h2>
          <ExportButton
            data={userCertificates as unknown as Record<string, unknown>[]}
            filename="user-certificates"
            columns={certColumns.map((c) => ({ key: c.key, header: c.header }))}
          />
        </div>
        <DataTableWrapper columns={certColumns} data={userCertificates} keyExtractor={(r) => r.id} pageSize={10} />
      </section>

      {/* Assessment History */}
      <section className="mb-8" aria-label="Assessment History">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Assessment History</h2>
          <ExportButton
            data={userAssessmentHistory as unknown as Record<string, unknown>[]}
            filename="user-assessments"
            columns={assessColumns.map((c) => ({ key: c.key, header: c.header }))}
          />
        </div>
        <DataTableWrapper columns={assessColumns} data={userAssessmentHistory} keyExtractor={(r) => r.id} pageSize={10} />
      </section>
    </ReportLayout>
  );
};

export default UserReport;

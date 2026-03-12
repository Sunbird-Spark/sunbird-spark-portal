import { useMemo } from "react";
import { useParams } from "react-router-dom";
import ReportLayout from "@/components/reports/ReportLayout";
import SummaryCard from "@/components/reports/SummaryCard";
import DataTableWrapper, { type Column } from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  userCertificates,
  userAssessmentHistory,
} from "@/data/reportsMockData";
import type { UserCourseProgress, UserCertificate, UserAssessmentHistory } from "@/types/reports";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useUserCourseEnrolments } from "@/hooks/useUserCourseEnrolments";
import { useUserRead } from "@/hooks/useUserRead";
import { mapApiItemToUserCourseProgress } from "@/utils/userCourseEnrolmentUtils";

const statusColor: Record<string, string> = {
  "Completed": "default",
  "In Progress": "secondary",
  "Not Started": "outline",
};

const UserReport = () => {
  const { userId } = useParams();
  const { t } = useAppI18n();

  const { data: userReadData } = useUserRead();
  const userProfile = userReadData?.data?.response as { firstName?: string; lastName?: string } | undefined;
  const userName = [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || String(userId ?? '');

  const {
    data: enrolmentResult,
    isLoading: isCourseProgressLoading,
    isError: isCourseProgressError,
  } = useUserCourseEnrolments();

  const apiCourses = enrolmentResult?.data ?? [];

  /** Derived summary values */
  const summaryCoursesCompleted = isCourseProgressLoading
    ? '—'
    : String(apiCourses.filter((c) => c.status === 2).length);
  const summaryCoursesPending = isCourseProgressLoading
    ? '—'
    : String(apiCourses.filter((c) => c.status !== 2).length);
  const summaryTotalCourses = isCourseProgressLoading
    ? '—'
    : String(enrolmentResult?.count ?? 0);
  const summaryCertsIssued = isCourseProgressLoading
    ? '—'
    : String(apiCourses.filter((c) => c.issued_certificates != null).length);

  const courseProgressData = useMemo(
    () => apiCourses.map(mapApiItemToUserCourseProgress),
    [apiCourses]
  );

  const courseColumns: Column<UserCourseProgress>[] = [
    { key: "courseName", header: t('userReport.course'), sortable: true },
    {
      key: "progressPercent",
      header: t('userReport.progress'),
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
      header: t('userReport.status'),
      render: (row) => <Badge variant={statusColor[row.status] as "default"} className="text-xs">{row.status}</Badge>,
    },
    { key: "enrollmentDate", header: t('userReport.enrolled'), sortable: true },
    { key: "lastAccessed", header: t('userReport.lastAccessed'), sortable: true },
  ];

  const certColumns: Column<UserCertificate>[] = [
    { key: "courseName", header: t('userReport.course'), sortable: true },
    { key: "certificateId", header: t('userReport.certificateId') },
    { key: "issuedDate", header: t('userReport.issuedDate'), sortable: true },
  ];

  const assessColumns: Column<UserAssessmentHistory>[] = [
    { key: "courseName", header: t('userReport.course'), sortable: true },
    { key: "assessmentName", header: t('userReport.assessment'), sortable: true },
    { key: "score", header: t('userReport.score'), sortable: true, className: "text-right" },
    { key: "maxScore", header: t('userReport.max'), className: "text-right" },
    { key: "percentage", header: "%", sortable: true, className: "text-right", render: (r) => `${r.percentage}%` },
    {
      key: "passFail",
      header: t('userReport.result'),
      render: (row) => <Badge variant={row.passFail === "Pass" ? "default" : "destructive"} className="text-xs">{row.passFail}</Badge>,
    },
    { key: "attemptDate", header: t('userReport.date'), sortable: true },
  ];

  return (
    <ReportLayout
      title={`${t('userReport.title')}: ${userName}`}
      breadcrumbs={[{ label: t('home'), href: "/home" }, { label: t('userReport.title') }]}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <SummaryCard label={t('userReport.totalCourses')} value={summaryTotalCourses} colorClass="bg-sunbird-wave" />
        <SummaryCard label={t('userReport.coursesCompleted')} value={summaryCoursesCompleted} colorClass="bg-sunbird-moss" />
        <SummaryCard label={t('userReport.coursesPending')} value={summaryCoursesPending} colorClass="bg-sunbird-ginger" />
        <SummaryCard label={t('userReport.certificatesIssued')} value={summaryCertsIssued} colorClass="bg-sunbird-ink" />
        <SummaryCard label={t('userReport.assessmentsCompleted')} value="—" colorClass="bg-sunbird-lavender" />
      </div>

      {/* Course Progress */}
      <section className="mb-8" aria-label={t('userReport.courseProgress')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('userReport.courseProgress')}</h2>
          <ExportButton
            data={courseProgressData as unknown as Record<string, unknown>[]}
            filename="user-course-progress"
            columns={courseColumns.map((c) => ({ key: c.key, header: c.header }))}
          />
        </div>

        {isCourseProgressLoading && (
          <div
            className="flex items-center justify-center py-16 text-sm text-muted-foreground"
            data-testid="course-progress-loading"
          >
            Loading course progress…
          </div>
        )}

        {isCourseProgressError && !isCourseProgressLoading && (
          <div
            className="flex items-center justify-center py-16 text-sm text-destructive"
            data-testid="course-progress-error"
          >
            Failed to load course progress. Please try again.
          </div>
        )}

        {!isCourseProgressLoading && !isCourseProgressError && (
          <DataTableWrapper columns={courseColumns} data={courseProgressData} keyExtractor={(r) => r.id} pageSize={10} />
        )}
      </section>

      {/* Certificates */}
      <section className="mb-8" aria-label={t('userReport.certificates')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('userReport.certificates')}</h2>
          <ExportButton
            data={userCertificates as unknown as Record<string, unknown>[]}
            filename="user-certificates"
            columns={certColumns.map((c) => ({ key: c.key, header: c.header }))}
          />
        </div>
        <DataTableWrapper columns={certColumns} data={userCertificates} keyExtractor={(r) => r.id} pageSize={10} />
      </section>

      {/* Assessment History */}
      <section className="mb-8" aria-label={t('userReport.assessmentHistory')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('userReport.assessmentHistory')}</h2>
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

import { useState, useMemo } from "react";
import SummaryCard from "@/components/reports/SummaryCard";
import CourseReportCharts from "@/components/reports/CourseReportCharts";
import FilterPanel from "@/components/reports/FilterPanel";
import DataTableWrapper from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { mapApiItemToLearnerProgress, mapApiItemToAssessmentRecord, buildEnrollmentVsCompletion, buildProgressBuckets, buildScoreDistribution } from "@/utils/learnerProgressUtils";
import { buildLearnerColumns, buildAssessmentColumns } from "@/components/reports/reportTableColumns";
import EmptyState from "@/components/workspace/EmptyState";
import { FiAlertCircle } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CourseReportContentProps {
  courseId?: string;
  batchId?: string;
  batchStartDate?: string;
}

const CourseReportContent = ({ courseId, batchId, batchStartDate }: CourseReportContentProps) => {
  const { t } = useAppI18n();

  const { data: apiResult, isLoading: isLearnersLoading, isError: isLearnersError, refetch: refetchLearners } =
    useLearnerProgress(courseId, batchId);

  const { data: assessmentResult, isLoading: isAssessmentsLoading, isError: isAssessmentsError, refetch: refetchAssessments } =
    useAssessmentData(courseId);

  const apiLearners = apiResult?.data ?? [];

  const summaryTotalEnrolled = isLearnersLoading ? "—" : String(apiResult?.count ?? 0);
  const summaryCompleted    = isLearnersLoading ? "—" : String(apiLearners.filter((l) => l.status === 2).length);
  const summaryCerts        = isLearnersLoading ? "—" : String(apiLearners.filter((l) => l.issued_certificates != null).length);

  const enrollmentChartData = useMemo(
    () => buildEnrollmentVsCompletion(apiLearners, batchStartDate),
    [apiLearners, batchStartDate]
  );

  const progressBucketsData = useMemo(
    () => buildProgressBuckets(apiLearners),
    [apiLearners]
  );

  const assessmentRecords = useMemo(
    () => (assessmentResult?.data ?? []).map(mapApiItemToAssessmentRecord),
    [assessmentResult]
  );

  const scoreDistributionData = useMemo(
    () => buildScoreDistribution(assessmentRecords),
    [assessmentRecords]
  );

  const summaryAvgScore = useMemo(() => {
    if (isAssessmentsLoading) return "—";
    const valid = assessmentRecords.filter((r) => r.maxScore > 0);
    if (valid.length === 0) return "—";
    const avg = Math.round(valid.reduce((sum, r) => sum + r.percentage, 0) / valid.length);
    return `${avg}%`;
  }, [assessmentRecords, isAssessmentsLoading]);

  const learnerColumns = buildLearnerColumns(t);
  const assessmentColumns = buildAssessmentColumns(t);

  const [learnerSearch, setLearnerSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<Record<string, string>>({});

  const mappedLearners = useMemo(
    () => apiLearners.map(mapApiItemToLearnerProgress),
    [apiLearners]
  );
  const filteredLearners = useMemo(() => {
    let result = mappedLearners;
    if (learnerSearch) {
      const q = learnerSearch.toLowerCase();
      result = result.filter((l) => l.learnerName.toLowerCase().includes(q));
    }
    const bucket = progressFilter.progress;
    if (bucket && bucket !== "all") {
      const ranges: Record<string, [number, number]> = {
        "0-25": [0, 25],
        "25-50": [25, 50],
        "50-75": [50, 75],
        "75-100": [75, 100],
      };
      const [lo, hi] = ranges[bucket] ?? [0, 100];
      result = result.filter((l) =>
        lo === 0 ? l.progressPercent <= hi : l.progressPercent > lo && l.progressPercent <= hi
      );
    }
    return result;
  }, [mappedLearners, learnerSearch, progressFilter]);

  return (
    <div data-testid="course-report-content">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SummaryCard label={t('courseReport.totalEnrolled')} value={summaryTotalEnrolled} colorClass="bg-sunbird-ink" />
        <SummaryCard label={t('courseReport.totalCompleted')} value={summaryCompleted} colorClass="bg-sunbird-moss" />
        <SummaryCard label={t('courseReport.certificatesIssued')} value={summaryCerts} colorClass="bg-sunbird-ginger" />
        <SummaryCard label={t('courseReport.avgScore')} value={summaryAvgScore} colorClass="bg-sunbird-lavender" />
      </div>

      {/* Charts Row */}
      <CourseReportCharts
        enrollmentChartData={enrollmentChartData}
        progressBucketsData={progressBucketsData}
        scoreDistributionData={scoreDistributionData}
        labels={{
          enrollmentVsCompletion: t('courseReport.enrollmentVsCompletion'),
          pendingCompletionBuckets: t('courseReport.pendingCompletionBuckets'),
          scoreDistribution: t('courseReport.scoreDistribution'),
          enrolled: t('courseReport.enrolled'),
          completed: t('courseReport.completed'),
          learners: t('courseReport.learners'),
        }}
      />

      {/* Tabs for Tables */}
      <Tabs defaultValue="learners" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="learners">{t('courseReport.learnerProgress')}</TabsTrigger>
          <TabsTrigger value="assessments">{t('courseReport.assessments')}</TabsTrigger>
        </TabsList>

        <TabsContent value="learners">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-base font-semibold text-foreground">{t('courseReport.detailedLearnerProgress')}</h3>
            <ExportButton
              data={filteredLearners as unknown as Record<string, unknown>[]}
              filename="learner-progress"
              columns={learnerColumns.map((c) => ({ key: c.key, header: c.header }))}
            />
          </div>

          {isLearnersLoading && (
            <div
              className="flex items-center justify-center py-16 text-sm text-muted-foreground"
              data-testid="learners-loading"
            >
              {t("courseReport.loadingLearners")}
            </div>
          )}

          {isLearnersError && !isLearnersLoading && (
            <div data-testid="learners-error">
              <EmptyState
                icon={FiAlertCircle}
                title={t("courseReport.somethingWentWrong")}
                description={t("courseReport.failedLearnerProgress")}
                actionLabel={t("courseReport.tryAgain")}
                onAction={() => void refetchLearners()}
              />
            </div>
          )}

          {!isLearnersLoading && !isLearnersError && (
            <>
              <FilterPanel
                filters={[
                  {
                    key: "progress",
                    label: t("courseReport.progressFilter"),
                    options: [
                      { label: t("courseReport.progress025"), value: "0-25" },
                      { label: t("courseReport.progress2550"), value: "25-50" },
                      { label: t("courseReport.progress5075"), value: "50-75" },
                      { label: t("courseReport.progress75100"), value: "75-100" },
                    ],
                  },
                ]}
                values={progressFilter}
                onChange={(k, v) => setProgressFilter((p) => ({ ...p, [k]: v }))}
                searchValue={learnerSearch}
                onSearchChange={setLearnerSearch}
                searchPlaceholder={t("courseReport.searchLearners")}
              />
              <DataTableWrapper
                columns={learnerColumns}
                data={filteredLearners}
                keyExtractor={(r) => r.id}
                pageSize={10}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="assessments">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-base font-semibold text-foreground">{t('courseReport.detailedAssessments')}</h3>
            <ExportButton
              data={assessmentRecords as unknown as Record<string, unknown>[]}
              filename="assessment-records"
              columns={assessmentColumns.map((c) => ({ key: c.key, header: c.header }))}
            />
          </div>

          {isAssessmentsLoading && (
            <div
              className="flex items-center justify-center py-16 text-sm text-muted-foreground"
              data-testid="assessments-loading"
            >
              {t("courseReport.loadingAssessments")}
            </div>
          )}

          {isAssessmentsError && !isAssessmentsLoading && (
            <div data-testid="assessments-error">
              <EmptyState
                icon={FiAlertCircle}
                title={t("courseReport.somethingWentWrong")}
                description={t("courseReport.failedAssessmentData")}
                actionLabel={t("courseReport.tryAgain")}
                onAction={() => void refetchAssessments()}
              />
            </div>
          )}

          {!isAssessmentsLoading && !isAssessmentsError && (
            <DataTableWrapper
              columns={assessmentColumns}
              data={assessmentRecords}
              keyExtractor={(r) => r.id}
              pageSize={10}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseReportContent;

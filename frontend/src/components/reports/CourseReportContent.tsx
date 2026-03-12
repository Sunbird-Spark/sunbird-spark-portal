import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, LabelList,
} from "recharts";
import SummaryCard from "@/components/reports/SummaryCard";
import ChartCard from "@/components/reports/ChartCard";
import FilterPanel from "@/components/reports/FilterPanel";
import DataTableWrapper from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assessmentRecords } from "@/data/reportsMockData";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import { mapApiItemToLearnerProgress, buildEnrollmentVsCompletion, buildProgressBuckets } from "@/utils/learnerProgressUtils";
import { learnerColumns, assessmentColumns } from "@/components/reports/reportTableColumns";

const donutColors = ["hsl(var(--sunbird-ginger))", "hsl(var(--sunbird-moss))", "hsl(var(--sunbird-ink))", "hsl(var(--sunbird-lavender))"];

interface CourseReportContentProps {
  courseId?: string;
  batchId?: string;
  batchStartDate?: string;
}

const CourseReportContent = ({ courseId, batchId, batchStartDate }: CourseReportContentProps) => {
  const { data: apiResult, isLoading: isLearnersLoading, isError: isLearnersError } =
    useLearnerProgress(courseId, batchId);

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

  const [learnerSearch, setLearnerSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<Record<string, string>>({});

  const mappedLearners = useMemo(
    () => (Array.isArray(apiLearners) ? apiLearners : []).map(mapApiItemToLearnerProgress),
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
      result = result.filter((l) => l.progressPercent >= lo && l.progressPercent <= hi);
    }
    return result;
  }, [mappedLearners, learnerSearch, progressFilter]);

  return (
    <div data-testid="course-report-content">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SummaryCard label="Total Enrolled" value={summaryTotalEnrolled} colorClass="bg-sunbird-ink" />
        <SummaryCard label="Total Completed" value={summaryCompleted} colorClass="bg-sunbird-moss" />
        <SummaryCard label="Certificates Issued" value={summaryCerts} colorClass="bg-sunbird-ginger" />
        <SummaryCard label="Avg Score" value="—" colorClass="bg-sunbird-lavender" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <ChartCard title="Enrollment vs Completion" className="xl:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="enrolled" fill="hsl(var(--sunbird-ink))" radius={[6, 6, 0, 0]} barSize={20} name="Enrolled" />
                <Bar dataKey="completed" fill="hsl(var(--sunbird-moss))" radius={[6, 6, 0, 0]} barSize={20} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Pending Completion Buckets">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={progressBucketsData}
                margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <YAxis
                  type="category"
                  dataKey="bucket"
                  width={56}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: unknown) => [`${String(value)} learners`]}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {progressBucketsData.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Score Distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: unknown) => [`${String(value)} learners`, "Learners"]} />
                <Bar dataKey="count" name="Learners" radius={[6, 6, 0, 0]} barSize={28}>
                  {([] as unknown[]).map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Tabs for Tables */}
      <Tabs defaultValue="learners" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="learners">Learner Progress</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="learners">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-base font-semibold text-foreground">Detailed Learner Progress</h3>
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
              Loading learner data…
            </div>
          )}

          {isLearnersError && !isLearnersLoading && (
            <div
              className="flex items-center justify-center py-16 text-sm text-destructive"
              data-testid="learners-error"
            >
              Failed to load learner progress. Please try again.
            </div>
          )}

          {!isLearnersLoading && !isLearnersError && (
            <>
              <FilterPanel
                filters={[
                  {
                    key: "progress",
                    label: "Progress",
                    options: [
                      { label: "0–25%", value: "0-25" },
                      { label: "25–50%", value: "25-50" },
                      { label: "50–75%", value: "50-75" },
                      { label: "75–100%", value: "75-100" },
                    ],
                  },
                ]}
                values={progressFilter}
                onChange={(k, v) => setProgressFilter((p) => ({ ...p, [k]: v }))}
                searchValue={learnerSearch}
                onSearchChange={setLearnerSearch}
                searchPlaceholder="Search learners…"
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
            <h3 className="text-base font-semibold text-foreground">Detailed Assessments</h3>
            <ExportButton
              data={assessmentRecords as unknown as Record<string, unknown>[]}
              filename="assessment-records"
              columns={assessmentColumns.map((c) => ({ key: c.key, header: c.header }))}
            />
          </div>
          <DataTableWrapper
            columns={assessmentColumns}
            data={assessmentRecords}
            keyExtractor={(r) => r.id}
            pageSize={10}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseReportContent;

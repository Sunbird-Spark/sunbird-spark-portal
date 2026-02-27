import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import SummaryCard from "@/components/reports/SummaryCard";
import ChartCard from "@/components/reports/ChartCard";
import FilterPanel from "@/components/reports/FilterPanel";
import DataTableWrapper, { type Column } from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  courseReportSummary,
  enrollmentVsCompletion,
  progressBuckets,
  scoreBuckets,
  learnerProgressData,
  assessmentRecords,
} from "@/data/reportsMockData";
import type { LearnerProgress, AssessmentRecord } from "@/types/reports";

const donutColors = ["hsl(var(--sunbird-ginger))", "hsl(var(--sunbird-moss))", "hsl(var(--sunbird-ink))", "hsl(var(--sunbird-lavender))"];
const statusColor: Record<string, string> = { "Completed": "default", "In Progress": "secondary", "Not Started": "outline" };
const certColor: Record<string, string> = { "Issued": "default", "Pending": "secondary", "N/A": "outline" };

interface CourseReportContentProps {
  courseId?: string;
  batchId?: string;
}

const CourseReportContent = ({ courseId: _courseId, batchId: _batchId }: CourseReportContentProps) => {
  const summary = courseReportSummary;

  const [learnerSearch, setLearnerSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<Record<string, string>>({});

  const filteredLearners = useMemo(() => {
    let result = learnerProgressData;
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
  }, [learnerSearch, progressFilter]);

  const learnerColumns: Column<LearnerProgress>[] = [
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
    { key: "timeSpent", header: "Time Spent", sortable: true },
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

  const assessmentColumns: Column<AssessmentRecord>[] = [
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

  return (
    <div data-testid="course-report-content">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SummaryCard label="Total Enrolled" value={summary.totalEnrolled} colorClass="bg-sunbird-ink" />
        <SummaryCard label="Total Completed" value={summary.totalCompleted} colorClass="bg-sunbird-moss" />
        <SummaryCard label="Certificates Issued" value={summary.certificatesIssued} colorClass="bg-sunbird-ginger" />
        <SummaryCard label="Avg Score" value={`${summary.avgScore}%`} colorClass="bg-sunbird-lavender" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <ChartCard title="Enrollment vs Completion" className="xl:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentVsCompletion}>
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
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressBuckets}
                  dataKey="count"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {progressBuckets.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} learners`, name as string]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Score Distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} learners`, "Learners"]} />
                <Bar dataKey="count" name="Learners" radius={[6, 6, 0, 0]} barSize={28}>
                  {scoreBuckets.map((_, i) => (
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

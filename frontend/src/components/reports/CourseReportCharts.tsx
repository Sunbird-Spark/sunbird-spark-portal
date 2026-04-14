import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, LabelList,
} from "recharts";
import ChartCard from "@/components/reports/ChartCard";
import type { ProgressBucket } from "@/types/reports";

const donutColors = ["hsl(var(--sunbird-ginger))", "hsl(var(--sunbird-moss))", "hsl(var(--sunbird-ink))", "hsl(var(--sunbird-lavender))"];

interface CourseReportChartsProps {
  enrollmentChartData: { label: string; enrolled: number; completed: number }[];
  progressBucketsData: ProgressBucket[];
  scoreDistributionData: ProgressBucket[];
  labels: {
    enrollmentVsCompletion: string;
    pendingCompletionBuckets: string;
    scoreDistribution: string;
    enrolled: string;
    completed: string;
    learners: string;
  };
}

const CourseReportCharts = ({
  enrollmentChartData,
  progressBucketsData,
  scoreDistributionData,
  labels,
}: CourseReportChartsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
    <ChartCard title={labels.enrollmentVsCompletion} className="xl:col-span-2">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={enrollmentChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="enrolled" fill="hsl(var(--sunbird-ink))" radius={[6, 6, 0, 0]} barSize={20} name={labels.enrolled} />
            <Bar dataKey="completed" fill="hsl(var(--sunbird-moss))" radius={[6, 6, 0, 0]} barSize={20} name={labels.completed} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>

    <ChartCard title={labels.pendingCompletionBuckets}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={progressBucketsData} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: unknown) => [`${String(value)} learners`]} cursor={{ fill: "hsl(var(--muted))" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {progressBucketsData.map((_, i) => (
                <Cell key={i} fill={donutColors[i % donutColors.length]} />
              ))}
              <LabelList dataKey="count" position="top" style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>

    <ChartCard title={labels.scoreDistribution}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scoreDistributionData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(value: unknown) => [`${String(value)} learners`, labels.learners]} />
            <Bar dataKey="count" name={labels.learners} radius={[6, 6, 0, 0]} barSize={28}>
              {scoreDistributionData.map((_, i) => (
                <Cell key={i} fill={donutColors[i % donutColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  </div>
);

export default CourseReportCharts;

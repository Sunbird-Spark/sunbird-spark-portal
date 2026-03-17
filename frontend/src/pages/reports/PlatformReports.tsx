import { useState, useMemo, useCallback } from "react";
import useImpression from "@/hooks/useImpression";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import ReportLayout from "@/components/reports/ReportLayout";
import SummaryCard from "@/components/reports/SummaryCard";
import ChartCard from "@/components/reports/ChartCard";
import FilterPanel from "@/components/reports/FilterPanel";
import DataTableWrapper, { type Column } from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  contentStatusCounts,
  contentByTaxonomy,
  contentBySkills,
  contentByType,
  contentByCategory,
  topCreators,
  popularContent,
  userGrowthData,
  userDemographics,
  userByAppType,
  adminCourseSummaries,
} from "@/data/reportsMockData";
import type { AdminCourseSummary, ContentByGroup } from "@/types/reports";

const PIE_COLORS = [
  "hsl(var(--sunbird-ink))",
  "hsl(var(--sunbird-ginger))",
  "hsl(var(--sunbird-moss))",
  "hsl(var(--sunbird-lavender))",
];

const groupingMap: Record<string, ContentByGroup[]> = {
  taxonomy: contentByTaxonomy,
  skills: contentBySkills,
  type: contentByType,
  category: contentByCategory,
};

const PlatformReports = () => {
  useImpression({ type: 'view', pageid: 'platform-reports', env: 'reports' });
  const [contentGrouping, setContentGrouping] = useState("taxonomy");
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilters, setTableFilters] = useState<Record<string, string>>({});

  const totalUsers = useMemo(() => userDemographics.reduce((s, d) => s + d.count, 0), []);

  const filteredCourses = useMemo(() => {
    let result = adminCourseSummaries;
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      result = result.filter((c) => c.courseName.toLowerCase().includes(q));
    }
    return result;
  }, [tableSearch]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setTableFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const courseColumns: Column<AdminCourseSummary>[] = [
    { key: "courseName", header: "Course Name", sortable: true },
    { key: "totalEnrolled", header: "Enrolled", sortable: true, className: "text-right" },
    { key: "totalCompleted", header: "Completed", sortable: true, className: "text-right" },
    {
      key: "completionPercent",
      header: "Completion %",
      sortable: true,
      className: "text-right",
      render: (row) => (
        <Badge variant={row.completionPercent >= 70 ? "default" : row.completionPercent >= 40 ? "secondary" : "destructive"} className="text-xs">
          {row.completionPercent}%
        </Badge>
      ),
    },
    { key: "certificatesIssued", header: "Certificates", sortable: true, className: "text-right" },
    { key: "lastUpdated", header: "Last Updated", sortable: true },
  ];

  return (
    <ReportLayout
      title="Platform Reports"
    >
      {/* ── Section 1: Content Overview ── */}
      <section className="mb-10" aria-label="Content Overview">
        <h2 className="text-lg font-semibold text-foreground mb-4">Content Overview</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Content by Status – Pie Chart */}
          <ChartCard title="Content by Status">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={contentStatusCounts} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {contentStatusCounts.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Content by Grouping – Bar Chart */}
          <ChartCard
            title="Content by Grouping"
            actions={
              <Select value={contentGrouping} onValueChange={setContentGrouping}>
                <SelectTrigger className="w-[8.75rem] h-8 text-xs border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="taxonomy">Taxonomy</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="type">Content Type</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupingMap[contentGrouping]} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="group" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--sunbird-ink))" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Top Creators – Bar Chart */}
          <ChartCard title="Top 5 Creators">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCreators} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--sunbird-ginger))" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Most Popular Content */}
        <ChartCard title="Most Popular Content" className="mb-6">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularContent}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="enrollments" fill="hsl(var(--sunbird-ink))" radius={[6, 6, 0, 0]} barSize={24} name="Enrollments" />
                <Bar dataKey="views" fill="hsl(var(--sunbird-wave))" radius={[6, 6, 0, 0]} barSize={24} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      {/* ── Section 2: User Analytics ── */}
      <section className="mb-10" aria-label="User Analytics">
        <h2 className="text-lg font-semibold text-foreground mb-4">User Analytics</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Total Users" value={totalUsers.toLocaleString()} colorClass="bg-sunbird-ink" />
          {userDemographics.map((d) => (
            <SummaryCard key={d.label} label={d.label} value={d.count.toLocaleString()} colorClass="bg-sunbird-wave" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Growth Trend */}
          <ChartCard title="User Growth Trend">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--sunbird-ginger))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Users by App Type */}
          <ChartCard title="Users by App Type">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userByAppType} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {userByAppType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* ── Section 3: Admin Course Summary Table ── */}
      <section aria-label="Admin Course Summary">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Admin Course Summary</h2>
          <ExportButton
            data={filteredCourses as unknown as Record<string, unknown>[]}
            filename="platform-course-summary"
            columns={courseColumns.map((c) => ({ key: c.key, header: c.header }))}
          />
        </div>

        <FilterPanel
          filters={[]}
          values={tableFilters}
          onChange={handleFilterChange}
          searchValue={tableSearch}
          onSearchChange={setTableSearch}
          searchPlaceholder="Search courses…"
        />

        <DataTableWrapper
          columns={courseColumns}
          data={filteredCourses}
          keyExtractor={(r) => r.id}
          pageSize={10}
        />
      </section>
    </ReportLayout>
  );
};

export default PlatformReports;

import { useState, useMemo, useCallback } from "react";
import useImpression from "@/hooks/useImpression";
import { useAppI18n } from "@/hooks/useAppI18n";
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
import { Badge } from "@/components/ui/badge";
import type { AdminCourseSummary } from "@/types/reports";
import { useOrgCourseSummary } from "@/hooks/useOrgCourseSummary";
import { useContentStatusSummary } from "@/hooks/useContentStatusSummary";
import { useUserCreationCount } from "@/hooks/useUserCreationCount";

const PIE_COLORS = [
  "hsl(var(--sunbird-ink))",
  "hsl(var(--sunbird-ginger))",
  "hsl(var(--sunbird-moss))",
  "hsl(var(--sunbird-lavender))",
];

const PlatformReports = () => {
  useImpression({ type: 'view', pageid: 'platform-reports', env: 'reports' });
  const { t } = useAppI18n();
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilters, setTableFilters] = useState<Record<string, string>>({});

  const { statusData, topCreatorsData, categoryData: groupingData } = useContentStatusSummary();
  const { data: growthData, totalUsers, isLoading: isGrowthLoading, isError: isGrowthError } = useUserCreationCount();
  const { data: apiCourses, isLoading: isCoursesLoading, isError: isCoursesError } = useOrgCourseSummary();

  const filteredCourses = useMemo(() => {
    if (!tableSearch) return apiCourses;
    const q = tableSearch.toLowerCase();
    return apiCourses.filter((c) => c.courseName.toLowerCase().includes(q));
  }, [apiCourses, tableSearch]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setTableFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const courseColumns: Column<AdminCourseSummary>[] = [
    { key: "courseName", header: t("platformReport.colCourseName"), sortable: true },
    { key: "totalEnrolled", header: t("platformReport.colEnrolled"), sortable: true, className: "text-right" },
    { key: "totalCompleted", header: t("platformReport.colCompleted"), sortable: true, className: "text-right" },
    {
      key: "completionPercent",
      header: t("platformReport.colCompletionPct"),
      sortable: true,
      className: "text-right",
      render: (row) => (
        <Badge variant={row.completionPercent >= 70 ? "default" : row.completionPercent >= 40 ? "secondary" : "destructive"} className="text-xs">
          {row.completionPercent}%
        </Badge>
      ),
    },
    { key: "certificatesIssued", header: t("platformReport.colCertificates"), sortable: true, className: "text-right" },
  ];

  return (
    <ReportLayout
      title={t("platformReport.title")}
    >
      {/* ── Section 1: Content Overview ── */}
      <section className="mb-10" aria-label={t("platformReport.contentOverview")}>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("platformReport.contentOverview")}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Content by Status – Pie Chart */}
          <ChartCard title={t("platformReport.contentByStatus")}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {statusData.map((_, i) => (
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
          <ChartCard title={t("platformReport.contentByType")}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupingData} layout="vertical" margin={{ left: 10 }}>
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
          <ChartCard title={t("platformReport.top5Creators")}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCreatorsData} layout="vertical" margin={{ left: 10 }}>
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

      </section>

      {/* ── Section 2: User Analytics ── */}
      <section className="mb-10" aria-label={t("platformReport.userAnalytics")}>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("platformReport.userAnalytics")}</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard label={t("platformReport.totalUsers")} value={isGrowthLoading ? "…" : totalUsers.toLocaleString()} colorClass="bg-sunbird-ink" />
        </div>

        {isGrowthError && (
          <p className="text-sm text-destructive mb-3">{t("platformReport.failedUserGrowth")}</p>
        )}

        <ChartCard title={t("platformReport.userGrowthTrend")}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="userCount" stroke="hsl(var(--sunbird-ginger))" strokeWidth={2.5} dot={{ r: 3 }} name={t("platformReport.users")} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      {/* ── Section 3: Admin Course Summary Table ── */}
      <section aria-label={t("platformReport.adminCourseSummary")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t("platformReport.adminCourseSummary")}</h2>
          <ExportButton
            data={filteredCourses}
            filename="platform-course-summary"
            columns={courseColumns.map((c) => ({ key: c.key, header: c.header }))}
          />
        </div>

        {isCoursesError && (
          <p className="text-sm text-destructive mb-3">{t("platformReport.failedCourseSummary")}</p>
        )}

        <FilterPanel
          filters={[]}
          values={tableFilters}
          onChange={handleFilterChange}
          searchValue={tableSearch}
          onSearchChange={setTableSearch}
          searchPlaceholder={t("platformReport.searchCourses")}
        />

        <DataTableWrapper
          columns={courseColumns}
          data={filteredCourses}
          keyExtractor={(r) => r.id}
          pageSize={10}
          loading={isCoursesLoading}
        />
      </section>
    </ReportLayout>
  );
};

export default PlatformReports;

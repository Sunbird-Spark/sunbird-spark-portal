import { useState, useMemo } from "react";
import { FiUsers, FiUserCheck, FiUserX } from "react-icons/fi";
import SummaryCard from "@/components/reports/SummaryCard";
import FilterPanel from "@/components/reports/FilterPanel";
import DataTableWrapper from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import { useConsentSummary } from "@/hooks/useConsentSummary";
import { useAppI18n } from "@/hooks/useAppI18n";
import { getExportColumns, buildColumns } from "./userConsentColumns";

/* ── Component ───────────────────────────────────────────────────────────── */

const UserConsentTab = () => {
  const { t } = useAppI18n();
  const { data: apiData, isLoading, isError } = useConsentSummary();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ── Derived data ──────────────────────────────────────────────────────── */

  const filteredData = useMemo(() => {
    let result = apiData;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.userName.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((r) => r.consentStatus === statusFilter);
    return result;
  }, [apiData, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: apiData.length,
      granted: apiData.filter((r) => r.consentStatus === "Granted").length,
      revoked: apiData.filter((r) => r.consentStatus === "Revoked").length,
    }),
    [apiData]
  );

  /* ── Table columns ─────────────────────────────────────────────────────── */

  const columns = useMemo(() => buildColumns(t), [t]);

  /* ── Render ────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        {t("userManagement.consentTab.loading")}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-destructive text-sm">
        {t("userManagement.consentTab.loadFailed")}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <ExportButton
          data={filteredData as unknown as Record<string, unknown>[]}
          filename="user-consent-report"
          columns={getExportColumns(t)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard label={t("userManagement.consentTab.totalUsers")} value={stats.total} colorClass="bg-sunbird-ink" icon={<FiUsers className="w-4 h-4" />} />
        <SummaryCard label={t("userManagement.consentTab.consentGranted")} value={stats.granted} colorClass="bg-sunbird-moss" icon={<FiUserCheck className="w-4 h-4" />} />
        <SummaryCard label={t("userManagement.consentTab.consentRevoked")} value={stats.revoked} colorClass="bg-sunbird-lavender" icon={<FiUserX className="w-4 h-4" />} />
      </div>

      <FilterPanel
        filters={[
          {
            key: "status",
            label: t("userManagement.consentTab.filterLabel"),
            options: [
              { label: t("userManagement.consentTab.filterGranted"), value: "Granted" },
              { label: t("userManagement.consentTab.filterRevoked"), value: "Revoked" },
            ],
          },
        ]}
        values={{ status: statusFilter }}
        onChange={(key, value) => {
          if (key === "status") setStatusFilter(value);
        }}
        searchValue={search}
        onSearchChange={(v) => setSearch(v)}
        searchPlaceholder={t("userManagement.consentTab.searchPlaceholder")}
      />

      <DataTableWrapper
        columns={columns}
        data={filteredData}
        keyExtractor={(r) => r.id}
        pageSize={10}
        emptyMessage={t("userManagement.consentTab.noUsersMatch")}
      />
    </>
  );
};

export default UserConsentTab;

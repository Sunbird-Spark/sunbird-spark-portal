import { useState, useMemo, useCallback } from "react";
import { FiUsers, FiUserCheck, FiUserX } from "react-icons/fi";
import SummaryCard from "@/components/reports/SummaryCard";
import FilterPanel from "@/components/reports/FilterPanel";
import DataTableWrapper from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useConsentSummary } from "@/hooks/useConsentSummary";
import type { UserConsentRecord } from "@/types/reports";
import { useToast } from "@/hooks/useToast";
import { useAppI18n } from "@/hooks/useAppI18n";
import {
  type ConfirmState,
  CLOSED_CONFIRM,
  getExportColumns,
  BulkActionsBar,
  buildColumns,
} from "./userConsentColumns";

/* ── Component ───────────────────────────────────────────────────────────── */

const UserConsentTab = () => {
  const { t } = useAppI18n();
  const { toast } = useToast();
  const { data: apiData, isLoading, isError } = useConsentSummary();

  const [localOverrides, setLocalOverrides] = useState<Map<string, Partial<UserConsentRecord>>>(new Map());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState>(CLOSED_CONFIRM);

  /* ── Merge API data with local overrides ───────────────────────────────── */

  const data = useMemo<UserConsentRecord[]>(
    () => apiData.map((r) => ({ ...r, ...localOverrides.get(r.id) })),
    [apiData, localOverrides],
  );

  /* ── Derived data ──────────────────────────────────────────────────────── */

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.userName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((r) => r.consentStatus === statusFilter);
    return result;
  }, [data, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: data.length,
      granted: data.filter((r) => r.consentStatus === "Granted").length,
      revoked: data.filter((r) => r.consentStatus === "Revoked").length,
    }),
    [data]
  );

  /* ── Selection handlers ────────────────────────────────────────────────── */

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    () => setSelectedIds(new Set(filteredData.map((r) => r.id))),
    [filteredData]
  );

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  /* ── Dialog openers ────────────────────────────────────────────────────── */

  const openBulkRevoke = useCallback(
    () => setConfirm({ open: true, type: "revoke", isBulk: true, targetId: null, isLoading: false }),
    []
  );

  const openBulkReissue = useCallback(
    () => setConfirm({ open: true, type: "reissue", isBulk: true, targetId: null, isLoading: false }),
    []
  );

  const closeConfirm = useCallback(
    () => setConfirm((prev) => ({ ...prev, open: false })),
    []
  );

  /* ── Confirm action ────────────────────────────────────────────────────── */

  const handleConfirm = useCallback(() => {
    const { type, isBulk, targetId } = confirm;
    setConfirm((prev) => ({ ...prev, isLoading: true }));

    setTimeout(() => {
      const idsToUpdate = isBulk ? [...selectedIds] : targetId ? [targetId] : [];
      const newStatus: UserConsentRecord["consentStatus"] = type === "revoke" ? "Revoked" : "Granted";
      const today = new Date().toISOString().split("T")[0]!;

      setLocalOverrides((prev) => {
        const next = new Map(prev);
        for (const id of idsToUpdate) {
          next.set(id, {
            ...next.get(id),
            consentStatus: newStatus,
            consentGivenOn: newStatus === "Granted" ? today : null,
          });
        }
        return next;
      });

      if (isBulk) setSelectedIds(new Set());
      toast({
        title:
          type === "revoke"
            ? t("userManagement.consentTab.revokedToast").replace("{{count}}", String(idsToUpdate.length))
            : t("userManagement.consentTab.reissuedToast").replace("{{count}}", String(idsToUpdate.length)),
      });
      setConfirm(CLOSED_CONFIRM);
    }, 600);
  }, [confirm, selectedIds, toast, t]);

  /* ── Table columns ─────────────────────────────────────────────────────── */

  const columns = useMemo(
    () => buildColumns(selectedIds, handleToggle, t),
    [selectedIds, handleToggle, t]
  );

  /* ── Confirm dialog text ───────────────────────────────────────────────── */

  const confirmTitle = confirm.type === "revoke"
    ? (confirm.isBulk
        ? t("userManagement.consentTab.revokeTitleBulk").replace("{{count}}", String(selectedIds.size))
        : t("userManagement.consentTab.revokeTitle"))
    : (confirm.isBulk
        ? t("userManagement.consentTab.reissueTitleBulk").replace("{{count}}", String(selectedIds.size))
        : t("userManagement.consentTab.reissueTitle"));

  const confirmDescription = confirm.type === "revoke"
    ? t("userManagement.consentTab.revokeDesc")
    : t("userManagement.consentTab.reissueDesc");

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

      <BulkActionsBar
        selectedCount={selectedIds.size}
        filteredCount={filteredData.length}
        onSelectAll={handleSelectAll}
        onClear={handleClearSelection}
        onBulkRevoke={openBulkRevoke}
        onBulkReissue={openBulkReissue}
        t={t}
      />

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
          setSelectedIds(new Set());
        }}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setSelectedIds(new Set());
        }}
        searchPlaceholder={t("userManagement.consentTab.searchPlaceholder")}
      />

      <DataTableWrapper
        columns={columns}
        data={filteredData}
        keyExtractor={(r) => r.id}
        pageSize={10}
        emptyMessage={t("userManagement.consentTab.noUsersMatch")}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirm.type === "revoke" ? t("userManagement.consentTab.revokeTitle") : t("userManagement.consentTab.reissueTitle")}
        confirmVariant={confirm.type === "revoke" ? "destructive" : "default"}
        isLoading={confirm.isLoading}
        confirmButtonProps={{
          'data-edataid': confirm.type === 'revoke' ? 'um-consent-bulk-revoke-confirm' : 'um-consent-bulk-reissue-confirm',
          'data-pageid': 'user-management',
        }}
      />
    </>
  );
};

export default UserConsentTab;

import { useState, useMemo, useCallback } from "react";
import { FiUsers, FiUserCheck, FiUserX, FiClock } from "react-icons/fi";
import SummaryCard from "@/components/reports/SummaryCard";
import FilterPanel from "@/components/reports/FilterPanel";
import DataTableWrapper from "@/components/reports/DataTableWrapper";
import ExportButton from "@/components/reports/ExportButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { userConsentData as initialData } from "@/data/reportsMockData";
import type { UserConsentRecord } from "@/types/reports";
import { useToast } from "@/hooks/useToast";
import {
  type ConfirmState,
  CLOSED_CONFIRM,
  EXPORT_COLUMNS,
  BulkActionsBar,
  buildColumns,
} from "./userConsentColumns";

/* ── Component ───────────────────────────────────────────────────────────── */

const UserConsentTab = () => {
  const { toast } = useToast();

  const [data, setData] = useState<UserConsentRecord[]>(() => initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState>(CLOSED_CONFIRM);

  /* ── Derived data ──────────────────────────────────────────────────────── */

  const uniqueOrgs = useMemo(
    () => [...new Set(data.flatMap((r) => r.consumerOrgs))].sort(),
    [data]
  );

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.userName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((r) => r.consentStatus === statusFilter);
    if (orgFilter !== "all") result = result.filter((r) => r.consumerOrgs.includes(orgFilter));
    return result;
  }, [data, search, statusFilter, orgFilter]);

  const stats = useMemo(
    () => ({
      total: data.length,
      granted: data.filter((r) => r.consentStatus === "Granted").length,
      pending: data.filter((r) => r.consentStatus === "Pending").length,
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

      setData((prev) =>
        prev.map((r) => {
          if (!idsToUpdate.includes(r.id)) return r;
          return {
            ...r,
            consentStatus: newStatus,
            consumerOrgs: newStatus === "Revoked" ? [] : ["Diksha Platform"],
            consentGivenOn: newStatus === "Granted" ? today : r.consentGivenOn,
            lastUpdated: today,
          };
        })
      );

      if (isBulk) setSelectedIds(new Set());
      toast({
        title:
          type === "revoke"
            ? `Consent revoked for ${idsToUpdate.length} user(s)`
            : `Consent reissued for ${idsToUpdate.length} user(s)`,
      });
      setConfirm(CLOSED_CONFIRM);
    }, 600);
  }, [confirm, selectedIds, toast]);

  /* ── Table columns ─────────────────────────────────────────────────────── */

  const columns = useMemo(
    () => buildColumns(selectedIds, handleToggle),
    [selectedIds, handleToggle]
  );

  /* ── Confirm dialog text ───────────────────────────────────────────────── */

  const confirmTitle =
    confirm.type === "revoke"
      ? `Revoke Consent${confirm.isBulk ? ` (${selectedIds.size} users)` : ""}`
      : `Reissue Consent${confirm.isBulk ? ` (${selectedIds.size} users)` : ""}`;

  const confirmDescription =
    confirm.type === "revoke"
      ? "This will revoke PII consent for the selected user(s). They will no longer share data with consumer organisations. Consent can be reissued at any time."
      : "This will reissue PII consent for the selected user(s), re-enabling data sharing with consumer organisations.";

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <>
      <div className="flex justify-end mb-4">
        <ExportButton
          data={filteredData as unknown as Record<string, unknown>[]}
          filename="user-consent-report"
          columns={EXPORT_COLUMNS}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total Users" value={stats.total} colorClass="bg-sunbird-ink" icon={<FiUsers className="w-4 h-4" />} />
        <SummaryCard label="Consent Granted" value={stats.granted} colorClass="bg-sunbird-moss" icon={<FiUserCheck className="w-4 h-4" />} />
        <SummaryCard label="Consent Pending" value={stats.pending} colorClass="bg-sunbird-ginger" icon={<FiClock className="w-4 h-4" />} />
        <SummaryCard label="Consent Revoked" value={stats.revoked} colorClass="bg-sunbird-lavender" icon={<FiUserX className="w-4 h-4" />} />
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        filteredCount={filteredData.length}
        onSelectAll={handleSelectAll}
        onClear={handleClearSelection}
        onBulkRevoke={openBulkRevoke}
        onBulkReissue={openBulkReissue}
      />

      <FilterPanel
        filters={[
          {
            key: "status",
            label: "Consent Status",
            options: [
              { label: "Granted", value: "Granted" },
              { label: "Pending", value: "Pending" },
              { label: "Revoked", value: "Revoked" },
            ],
          },
          {
            key: "org",
            label: "Consumer Org",
            options: uniqueOrgs.map((o) => ({ label: o, value: o })),
          },
        ]}
        values={{ status: statusFilter, org: orgFilter }}
        onChange={(key, value) => {
          if (key === "status") setStatusFilter(value);
          else setOrgFilter(value);
          setSelectedIds(new Set());
        }}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setSelectedIds(new Set());
        }}
        searchPlaceholder="Search by name or email…"
      />

      <DataTableWrapper
        columns={columns}
        data={filteredData}
        keyExtractor={(r) => r.id}
        pageSize={10}
        emptyMessage="No users match the current filters."
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirm.type === "revoke" ? "Revoke" : "Reissue"}
        confirmVariant={confirm.type === "revoke" ? "destructive" : "default"}
        isLoading={confirm.isLoading}
      />
    </>
  );
};

export default UserConsentTab;

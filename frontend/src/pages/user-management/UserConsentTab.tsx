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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading consent data…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-destructive text-sm">
        Failed to load consent data. Please try again later.
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <ExportButton
          data={filteredData as unknown as Record<string, unknown>[]}
          filename="user-consent-report"
          columns={EXPORT_COLUMNS}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard label="Total Users" value={stats.total} colorClass="bg-sunbird-ink" icon={<FiUsers className="w-4 h-4" />} />
        <SummaryCard label="Consent Granted" value={stats.granted} colorClass="bg-sunbird-moss" icon={<FiUserCheck className="w-4 h-4" />} />
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
              { label: "Revoked", value: "Revoked" },
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
        confirmButtonProps={{
          'data-edataid': confirm.type === 'revoke' ? 'um-consent-bulk-revoke-confirm' : 'um-consent-bulk-reissue-confirm',
          'data-pageid': 'user-management',
        }}
      />
    </>
  );
};

export default UserConsentTab;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FiX, FiRefreshCw } from "react-icons/fi";
import type { UserConsentRecord } from "@/types/reports";
import type { Column } from "@/components/reports/DataTableWrapper";

/* ── Types & constants ───────────────────────────────────────────────────── */

export interface ConfirmState {
  open: boolean;
  type: "revoke" | "reissue";
  isBulk: boolean;
  targetId: string | null;
  isLoading: boolean;
}

export const CLOSED_CONFIRM: ConfirmState = {
  open: false,
  type: "revoke",
  isBulk: false,
  targetId: null,
  isLoading: false,
};

export function getExportColumns(t: (k: string, opts?: Record<string, unknown>) => string) {
  return [
    { key: "userName", header: t("userManagement.consentColumns.colUserName") },
    { key: "email", header: t("userManagement.consentColumns.colEmail") },
    { key: "consentStatus", header: t("userManagement.consentColumns.colPiiStatus") },
    { key: "course", header: t("userManagement.consentColumns.colCourse") },
    { key: "consentGivenOn", header: t("userManagement.consentColumns.colConsentGivenOn") },
    { key: "expiry", header: t("userManagement.consentColumns.colExpiry") },
  ];
}

/* ── BulkActionsBar ──────────────────────────────────────────────────────── */

interface BulkActionsBarProps {
  selectedCount: number;
  filteredCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  onBulkRevoke: () => void;
  onBulkReissue: () => void;
  t: (k: string, opts?: Record<string, unknown>) => string;
}

export function BulkActionsBar({
  selectedCount,
  filteredCount,
  onSelectAll,
  onClear,
  onBulkRevoke,
  onBulkReissue,
  t,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 bg-muted/30 rounded-xl border border-border"
      role="toolbar"
      aria-label={t("userManagement.consentColumns.bulkActions")}
    >
      <span className="text-sm font-medium text-foreground">
        {t("userManagement.consentColumns.selectedCount", { count: selectedCount })}
      </span>
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onSelectAll}>
        {t("userManagement.consentColumns.selectAll", { count: filteredCount })}
      </Button>
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
        <FiX className="w-3.5 h-3.5 mr-1" />
        {t("userManagement.consentColumns.clear")}
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={onBulkReissue}>
        <FiRefreshCw className="w-3.5 h-3.5" />
        {t("userManagement.consentColumns.reissueConsent")}
      </Button>
      <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={onBulkRevoke}>
        {t("userManagement.consentColumns.revokeConsent")}
      </Button>
    </div>
  );
}

/* ── Column builder ──────────────────────────────────────────────────────── */

export function buildColumns(
  selectedIds: Set<string>,
  handleToggle: (id: string) => void,
  t: (k: string, opts?: Record<string, unknown>) => string,
): Column<UserConsentRecord>[] {
  return [
    {
      key: "select",
      header: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => handleToggle(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 cursor-pointer accent-sunbird-brick"
          aria-label={t("userManagement.consentColumns.selectUser", { name: row.userName })}
        />
      ),
    },
    { key: "userName", header: t("userManagement.consentColumns.colUserName"), sortable: true },
    { key: "email", header: t("userManagement.consentColumns.colEmail"), sortable: true },
    {
      key: "consentStatus",
      header: t("userManagement.consentColumns.colPiiStatus"),
      sortable: true,
      render: (row) => {
        const variant = row.consentStatus === "Granted" ? "default" : "destructive";
        return <Badge variant={variant}>{row.consentStatus}</Badge>;
      },
    },
    {
      key: "course",
      header: t("userManagement.consentColumns.colCourse"),
      sortable: true,
      render: (row) =>
        row.course ? (
          <span>{row.course}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "consentGivenOn",
      header: t("userManagement.consentColumns.colConsentGivenOn"),
      sortable: true,
      render: (row) =>
        row.consentGivenOn ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "expiry",
      header: t("userManagement.consentColumns.colExpiry"),
      sortable: true,
      render: (row) =>
        row.expiry ? (
          <span>{row.expiry}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];
}

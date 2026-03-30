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

export const EXPORT_COLUMNS = [
  { key: "userName", header: "User Name" },
  { key: "email", header: "Email" },
  { key: "consentStatus", header: "PII Consent Status" },
  { key: "course", header: "Course" },
  { key: "consentGivenOn", header: "Consent Given On" },
  { key: "expiry", header: "Expiry" },
];

/* ── BulkActionsBar ──────────────────────────────────────────────────────── */

interface BulkActionsBarProps {
  selectedCount: number;
  filteredCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  onBulkRevoke: () => void;
  onBulkReissue: () => void;
}

export function BulkActionsBar({
  selectedCount,
  filteredCount,
  onSelectAll,
  onClear,
  onBulkRevoke,
  onBulkReissue,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 bg-muted/30 rounded-xl border border-border"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium text-foreground">
        {selectedCount} user(s) selected
      </span>
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onSelectAll}>
        Select All ({filteredCount})
      </Button>
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
        <FiX className="w-3.5 h-3.5 mr-1" />
        Clear
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={onBulkReissue}>
        <FiRefreshCw className="w-3.5 h-3.5" />
        Reissue Consent
      </Button>
      <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={onBulkRevoke}>
        Revoke Consent
      </Button>
    </div>
  );
}

/* ── Column builder ──────────────────────────────────────────────────────── */

export function buildColumns(
  selectedIds: Set<string>,
  handleToggle: (id: string) => void,
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
          aria-label={`Select ${row.userName}`}
        />
      ),
    },
    { key: "userName", header: "User Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    {
      key: "consentStatus",
      header: "PII Consent Status",
      sortable: true,
      render: (row) => {
        const variant = row.consentStatus === "Granted" ? "default" : "destructive";
        return <Badge variant={variant}>{row.consentStatus}</Badge>;
      },
    },
    {
      key: "course",
      header: "Course",
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
      header: "Consent Given On",
      sortable: true,
      render: (row) =>
        row.consentGivenOn ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "expiry",
      header: "Expiry",
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

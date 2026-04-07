import { Badge } from "@/components/ui/badge";
import type { UserConsentRecord } from "@/types/reports";
import type { Column } from "@/components/reports/DataTableWrapper";

/* ── Column builder ──────────────────────────────────────────────────────── */

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

export function buildColumns(
  t: (k: string, opts?: Record<string, unknown>) => string,
): Column<UserConsentRecord>[] {
  return [
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

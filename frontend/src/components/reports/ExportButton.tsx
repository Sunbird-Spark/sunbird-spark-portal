import { Button } from "@/components/ui/button";
import { FiDownload } from "react-icons/fi";
import { useToast } from "@/hooks/useToast";
import { useAppI18n } from "@/hooks/useAppI18n";

interface ExportButtonProps<T extends object> {
  data: T[];
  filename?: string;
  columns: { key: string; header: string }[];
}

function ExportButton<T extends object>({ data, filename = "report", columns }: ExportButtonProps<T>) {
  const { t } = useAppI18n();
  const { toast } = useToast();

  const handleExport = () => {
    if (data.length === 0) {
      toast({ title: t("exportButton.noDataToExport"), variant: "destructive" });
      return;
    }

    const header = columns.map((c) => c.header).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = (row as Record<string, unknown>)[c.key];
        const str = String(val ?? "");
        return str.includes(",") ? `"${str}"` : str;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: t("exportButton.csvExportedSuccessfully"), variant: "success" });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 border-border">
      <FiDownload className="w-4 h-4" />
      {t("exportButton.exportCsv")}
    </Button>
  );
}

export default ExportButton;

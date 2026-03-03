import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FiSearch } from "react-icons/fi";
import type { FilterOption } from "@/types/reports";

interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const FilterPanel = ({ filters, values, onChange, searchValue, onSearchChange, searchPlaceholder = "Search…" }: FilterPanelProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {onSearchChange !== undefined && (
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 bg-surface border-border rounded-lg"
            aria-label={searchPlaceholder}
          />
        </div>
      )}
      {filters.map((f) => (
        <Select key={f.key} value={values[f.key] ?? "all"} onValueChange={(v) => onChange(f.key, v)}>
          <SelectTrigger className="w-[11.25rem] h-10 bg-surface border-border rounded-lg" aria-label={f.label}>
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {f.label}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
};

export default FilterPanel;

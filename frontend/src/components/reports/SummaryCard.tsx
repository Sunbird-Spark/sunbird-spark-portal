import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  colorClass?: string;
  loading?: boolean;
}

const SummaryCard = ({ label, value, icon, colorClass = "bg-primary", loading = false }: SummaryCardProps) => {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl p-5 shadow-sm">
        <Skeleton className="h-5 w-5 mb-3" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div className={`${colorClass} rounded-2xl p-5 text-primary-foreground`}>
      {icon && (
        <div className="bg-white/20 p-2 rounded-lg inline-block mb-3">
          {icon}
        </div>
      )}
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
};

export default SummaryCard;

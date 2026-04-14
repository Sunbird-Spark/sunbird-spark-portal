import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  actions?: ReactNode;
  className?: string;
}

const ChartCard = ({ title, children, loading = false, actions, className = "" }: ChartCardProps) => {
  if (loading) {
    return (
      <div className={`bg-surface rounded-2xl p-5 shadow-sm ${className}`}>
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className={`bg-surface rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {actions}
      </div>
      <div dir="ltr">{children}</div>
    </div>
  );
};

export default ChartCard;

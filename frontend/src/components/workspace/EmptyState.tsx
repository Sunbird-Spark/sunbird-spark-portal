import { FiPlus, FiInbox } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { IconType } from "react-icons";
import { EMPTY_STATE_VARIANT_STYLES } from "@/services/workspace";
import type { EmptyStateVariant } from "@/types/workspaceTypes";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconType;
  variant?: EmptyStateVariant;
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = FiInbox,
  variant = 'default',
}: EmptyStateProps) => {
  const styles = EMPTY_STATE_VARIANT_STYLES[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-[1.25rem] shadow-sm border border-border">
      {/* Icon */}
      <div className={`w-20 h-20 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-6`}>
        <Icon className={`w-10 h-10 ${styles.iconColor}`} />
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-foreground font-rubik mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground font-rubik max-w-sm mb-6 text-sm leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className={`gap-2 ${styles.buttonBg} text-white font-rubik rounded-xl px-6 shadow-md hover:shadow-lg transition-all`}
        >
          <FiPlus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

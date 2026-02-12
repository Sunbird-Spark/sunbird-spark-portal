import { FiPlus, FiInbox } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { IconType } from "react-icons";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconType;
  variant?: 'default' | 'uploads' | 'collaborations' | 'search';
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = FiInbox,
  variant = 'default',
}: EmptyStateProps) => {
  const variantStyles = {
    default: {
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-400',
      buttonBg: 'bg-sunbird-ginger hover:bg-sunbird-brick',
    },
    uploads: {
      iconBg: 'bg-sunbird-ginger/10',
      iconColor: 'text-sunbird-ginger',
      buttonBg: 'bg-sunbird-ginger hover:bg-sunbird-brick',
    },
    collaborations: {
      iconBg: 'bg-sunbird-wave/10',
      iconColor: 'text-sunbird-wave',
      buttonBg: 'bg-sunbird-wave hover:bg-sunbird-ink',
    },
    search: {
      iconBg: 'bg-sunbird-lavender/10',
      iconColor: 'text-sunbird-lavender',
      buttonBg: 'bg-sunbird-ginger hover:bg-sunbird-brick',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-[20px] shadow-sm border border-border">
      {/* Icon */}
      <div className={`w-20 h-20 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-6`}>
        <Icon className={`w-10 h-10 ${styles.iconColor}`} />
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-foreground font-['Rubik'] mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground font-['Rubik'] max-w-sm mb-6 text-sm leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className={`gap-2 ${styles.buttonBg} text-white font-['Rubik'] rounded-xl px-6 shadow-md hover:shadow-lg transition-all`}
        >
          <FiPlus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
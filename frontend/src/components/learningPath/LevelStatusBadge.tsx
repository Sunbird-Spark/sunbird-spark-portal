import { useAppI18n } from '@/hooks/useAppI18n';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LevelStatusKey } from '@/types/learningPathTypes';

const LABEL_KEY: Record<LevelStatusKey, string> = {
  completed: 'learningPath.statusCompleted',
  active: 'learningPath.statusInProgress',
  notStarted: 'status.notStarted',
  locked: 'learningPath.statusLocked',
  waived: 'learningPath.statusWaived',
  credited: 'learningPath.statusCredited',
  creditedPending: 'learningPath.statusCreditedPending',
};

const CLASS_BY_STATUS: Record<LevelStatusKey, string> = {
  completed: 'border-transparent bg-sunbird-success-message text-white',
  active: 'border-transparent bg-sunbird-brick text-white',
  notStarted: 'border-sunbird-gray-d0 bg-transparent text-sunbird-gray-75',
  locked: 'border-sunbird-gray-d0 bg-transparent text-sunbird-gray-75',
  waived: 'border-transparent bg-sunbird-blue-light text-white',
  credited: 'border-transparent bg-sunbird-blue-light text-white',
  creditedPending: 'border-transparent bg-sunbird-ginger text-white',
};

interface LevelStatusBadgeProps {
  status: LevelStatusKey;
  className?: string;
}

/** Maps a Level's derived status to the Ledger's badge styling (see design's status column). */
export function LevelStatusBadge({ status, className }: LevelStatusBadgeProps) {
  const { t } = useAppI18n();
  return (
    <Badge variant="outline" className={cn(CLASS_BY_STATUS[status], className)} data-testid="level-status-badge">
      {t(LABEL_KEY[status])}
    </Badge>
  );
}

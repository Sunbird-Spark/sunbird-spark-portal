import { FiBriefcase, FiTarget } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { PositionPicker } from './PositionPicker';
import type { PositionAssignment } from '@/types/competencyServiceTypes';

interface RoleCardProps {
  position?: PositionAssignment;
  positions: string[];
  selectedPosition?: string;
  labelFor: (code: string) => string;
  onSelectPosition: (code: string) => void;
}

/**
 * The learner's role: the one they hold, and the one they are aiming at.
 *
 * CURRENT ROLE IS READ-ONLY, deliberately. It is an assignment that arrives from an HR
 * feed or an admin - `position/update` strips `currentPosition` on the self-service
 * route, because who a learner reports as is not a preference. Showing it as an
 * editable field would promise something the API refuses.
 *
 * When nothing is on record the card says so plainly rather than hiding the row: a
 * learner needs to know their role is unset (and who to ask) to make sense of a gap
 * measured only against a target.
 */
export function RoleCard({
  position,
  positions,
  selectedPosition,
  labelFor,
  onSelectPosition,
}: RoleCardProps) {
  const { t } = useAppI18n();
  const current = position?.currentPosition;
  // A saved target from a previous visit, shown when the learner has not picked one now.
  const savedTarget = position?.targetPositions?.[0];

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-sunbird-gray-e5 bg-surface p-5 shadow-sm"
      data-testid="role-card"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunbird-ivory text-sunbird-gray-75">
          <FiBriefcase className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-sunbird-gray-75">{t('passbook.currentRole')}</p>
          {current ? (
            <p className="text-sm font-semibold text-foreground" data-testid="current-role">
              {labelFor(current)}
            </p>
          ) : (
            <p className="text-sm text-sunbird-gray-75" data-testid="current-role-unset">
              {t('passbook.currentRoleUnset')}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 border-t border-sunbird-gray-e5 pt-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunbird-ivory text-sunbird-brick">
          <FiTarget className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <PositionPicker
            positions={positions}
            {...(selectedPosition ?? savedTarget ? { selected: selectedPosition ?? savedTarget } : {})}
            labelFor={labelFor}
            onSelect={onSelectPosition}
          />
        </div>
      </div>
    </div>
  );
}

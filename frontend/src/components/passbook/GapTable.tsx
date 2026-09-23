import { FiAlertCircle, FiCheck, FiTrendingUp } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { sortGapRows } from '@/services/competency';
import { GAP_STATUS, type GapRow } from '@/types/competencyServiceTypes';

interface GapTableProps {
  rows: GapRow[];
  labelFor: (code: string) => string;
  /** True when the framework declares criticality at all; hides the column when it does not. */
  showCriticality?: boolean;
}

function statusVisual(status: string) {
  if (status === GAP_STATUS.met) {
    return { icon: FiCheck, tone: 'text-sunbird-green-dark', bg: 'bg-sunbird-success-message text-white' };
  }
  if (status === GAP_STATUS.below) {
    return { icon: FiTrendingUp, tone: 'text-sunbird-brick', bg: 'bg-sunbird-ivory text-sunbird-brick' };
  }
  return { icon: FiAlertCircle, tone: 'text-sunbird-gray-75', bg: 'bg-sunbird-gray-e5 text-sunbird-gray-75' };
}

/**
 * Required vs held, one row per requirement of the chosen position.
 *
 * Ordered unmet-first by `sortGapRows` so the actionable rows are at the top -
 * the design's point is that "the learner's next action is derived, not
 * browsed".
 */
export function GapTable({ rows, labelFor, showCriticality = false }: GapTableProps) {
  const { t } = useAppI18n();
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-sunbird-gray-d0 p-4 text-sm text-sunbird-gray-75">
        {t('passbook.noRequirements')}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sunbird-gray-e5 bg-surface" data-testid="gap-table">
      <ul className="divide-y divide-sunbird-gray-e5">
        {sortGapRows(rows).map((row) => {
          const { icon: Icon, tone, bg } = statusVisual(row.status);
          return (
            <li
              key={row.competencyId}
              className="flex items-center justify-between gap-3 px-4 py-3"
              data-testid={`gap-row-${row.status}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${bg}`}>
                  <Icon className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{labelFor(row.competencyId)}</p>
                  <p className="text-xs text-sunbird-gray-75">
                    {t('passbook.requiredVsHeld', {
                      required: labelFor(row.requiredLevel),
                      held: row.heldLevelIndex > 0 ? labelFor(row.heldLevel) : t('passbook.nothingHeld'),
                    })}
                    {showCriticality && row.criticality ? ` · ${t(`passbook.criticality.${row.criticality}`, {
                      defaultValue: row.criticality,
                    })}` : ''}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${tone}`}>
                {t(`passbook.gapStatus.${row.status}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

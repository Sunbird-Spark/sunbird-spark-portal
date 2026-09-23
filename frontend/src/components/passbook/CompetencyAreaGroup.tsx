import { useAppI18n } from '@/hooks/useAppI18n';
import { CompetencyCard } from './CompetencyCard';
import { isHeld } from '@/services/competency';
import type { AreaGroup } from '@/services/competency/passbookGrouping';

interface CompetencyAreaGroupProps {
  group: AreaGroup;
  /** False when the framework classifies nothing - render flat, with no heading. */
  showHeading: boolean;
  expandedId: string | null;
  onToggle: (competencyId: string) => void;
  labelFor: (code: string) => string;
}

/**
 * One competency area and the competencies the learner holds within it.
 *
 * The heading carries a held/total count so the learner can see what is left in
 * that area, which is the point of grouping at all - the design's "the learner's
 * next action is derived, not browsed".
 */
export function CompetencyAreaGroup({
  group,
  showHeading,
  expandedId,
  onToggle,
  labelFor,
}: CompetencyAreaGroupProps) {
  const { t } = useAppI18n();
  const held = group.entries.filter(isHeld).length;

  return (
    <div className="flex flex-col gap-3" data-testid={`area-group-${group.areaCode || 'unclassified'}`}>
      {showHeading && (
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {group.areaCode ? labelFor(group.areaCode) : t('passbook.otherArea')}
          </h3>
          <span className="text-xs text-sunbird-gray-75">
            {t('passbook.areaHeldOf', { held, total: group.entries.length })}
          </span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {group.entries.map((entry) => (
          <CompetencyCard
            key={entry.competencyId}
            entry={entry}
            isExpanded={expandedId === entry.competencyId}
            onToggle={() => onToggle(entry.competencyId)}
            labelFor={labelFor}
          />
        ))}
      </div>
    </div>
  );
}

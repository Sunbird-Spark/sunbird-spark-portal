import { useAppI18n } from '@/hooks/useAppI18n';
import { CompetencyAreaGroup } from './CompetencyAreaGroup';
import { GapTable } from './GapTable';
import { PositionPicker } from './PositionPicker';
import type { FrameworkSection } from '@/services/competency/passbookGrouping';
import type { CompetencyGap } from '@/types/competencyServiceTypes';

interface FrameworkSectionViewProps {
  section: FrameworkSection;
  /** Shown only when the learner holds competencies in more than one framework. */
  showFrameworkHeading: boolean;
  frameworkLabel: string;
  positions: string[];
  selectedPosition?: string;
  gap?: CompetencyGap;
  onSelectPosition: (code: string) => void;
  expandedId: string | null;
  onToggle: (competencyId: string) => void;
  labelFor: (code: string) => string;
}

/**
 * Everything for ONE framework: its target-role picker, the gap against that role,
 * and the held competencies grouped by area.
 *
 * Kept per-framework because a gap can only be computed against one framework's
 * requirement set, and levels/areas mean different things between frameworks - so
 * the picker and the gap belong inside the section, not above all of them.
 */
export function FrameworkSectionView({
  section,
  showFrameworkHeading,
  frameworkLabel,
  positions,
  selectedPosition,
  gap,
  onSelectPosition,
  expandedId,
  onToggle,
  labelFor,
}: FrameworkSectionViewProps) {
  const { t } = useAppI18n();

  return (
    <section className="flex flex-col gap-4" data-testid={`framework-section-${section.frameworkId}`}>
      {showFrameworkHeading && (
        <div className="flex items-baseline justify-between gap-3 border-b border-sunbird-gray-e5 pb-2">
          <h2 className="text-base font-semibold text-foreground">{frameworkLabel}</h2>
          <span className="text-xs text-sunbird-gray-75">
            {t('passbook.frameworkCount', { count: section.entries.length })}
          </span>
        </div>
      )}

      {positions.length > 0 && (
        <PositionPicker
          positions={positions}
          {...(selectedPosition ? { selected: selectedPosition } : {})}
          labelFor={labelFor}
          onSelect={onSelectPosition}
        />
      )}

      {gap?.resolved && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t('passbook.readinessFor', { position: labelFor(gap.position) })}
          </h3>
          <GapTable rows={gap.rows} labelFor={labelFor} />
        </div>
      )}

      {section.groups.map((group) => (
        <CompetencyAreaGroup
          key={group.areaCode || 'unclassified'}
          group={group}
          showHeading={section.grouped}
          expandedId={expandedId}
          onToggle={onToggle}
          labelFor={labelFor}
        />
      ))}
    </section>
  );
}

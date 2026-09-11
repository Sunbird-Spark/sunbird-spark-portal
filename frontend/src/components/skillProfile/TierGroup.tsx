import { useAppI18n } from '@/hooks/useAppI18n';
import { SkillCard } from './SkillCard';
import { skillName, type SkillVocabulary, type TierGroup as TierGroupData } from '@/services/skill';

interface TierGroupProps {
  group: TierGroupData;
  /** False when the framework places nothing - render flat, with no heading. */
  showHeading: boolean;
  vocabulary: SkillVocabulary | undefined;
  expandedId: string | null;
  onToggle: (skillId: string) => void;
}

/**
 * One tier of the skill tree and the skills the learner holds within it.
 *
 * The heading shows a count so the learner can see the shape of what they hold per area;
 * "how many are missing" belongs to the gap panel, which knows the role's requirement.
 */
export function TierGroup({ group, showHeading, vocabulary, expandedId, onToggle }: TierGroupProps) {
  const { t } = useAppI18n();

  return (
    <div className="flex flex-col gap-3" data-testid={`tier-group-${group.tierCode || 'unclassified'}`}>
      {showHeading && (
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {group.tierCode ? group.tierName : t('skillProfile.otherTier')}
          </h3>
          <span className="text-xs text-sunbird-gray-75">
            {t('skillProfile.tierCount', { count: group.skills.length })}
          </span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {group.skills.map((skill) => (
          <SkillCard
            key={skill.skillId}
            skill={skill}
            name={skillName(vocabulary, skill.skillId)}
            isExpanded={expandedId === skill.skillId}
            onToggle={() => onToggle(skill.skillId)}
          />
        ))}
      </div>
    </div>
  );
}

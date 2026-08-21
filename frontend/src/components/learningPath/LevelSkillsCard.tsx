import { useAppI18n } from '@/hooks/useAppI18n';

interface LevelSkillsCardProps {
  skills: string[];
}

/** "Skills in this level" rail card on the Level detail screen. */
export function LevelSkillsCard({ skills }: LevelSkillsCardProps) {
  const { t } = useAppI18n();

  return (
    <div className="rounded-xl border border-sunbird-gray-e5 bg-surface p-5 shadow-sm">
      <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
        {t('learningPath.skillsInThisLevel')}
      </span>
      <div className="mt-2 flex flex-col">
        {skills.length === 0 && <p className="py-2.5 text-sm text-sunbird-gray-75">{t('learningPath.noSkillsYet')}</p>}
        {skills.map((skill) => (
          <div key={skill} className="flex items-center justify-between gap-2.5 border-t border-sunbird-gray-e5 py-2.5 first:border-t-0">
            <span className="text-sm text-foreground">{skill}</span>
            <span className="text-[0.6875rem] text-sunbird-gray-75">{t('learningPath.inScope')}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-sunbird-gray-82">{t('learningPath.skillScopeNote')}</p>
    </div>
  );
}

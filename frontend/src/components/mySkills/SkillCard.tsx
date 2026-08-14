import { Link } from 'react-router-dom';
import { FiCheck, FiChevronDown, FiChevronUp, FiLock } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { getLearningPathStatusPath } from '@/utils/getContentDetailPath';
import type { SkillIndexEntry } from '@/services/learningPath/skillIndex';

interface SkillCardProps {
  entry: SkillIndexEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * A skill as a first-class object: earned or not, how many paths teach it, and —
 * once expanded — exactly which Level of which path it comes from.
 */
export function SkillCard({ entry, isExpanded, onToggle }: SkillCardProps) {
  const { t } = useAppI18n();
  const { skill, gained, pathCount, origins } = entry;

  return (
    <div
      className={`flex flex-col rounded-xl border bg-surface shadow-sm transition-colors ${
        gained ? 'border-sunbird-success-message/40' : 'border-dashed border-sunbird-gray-d0'
      }`}
      data-testid={gained ? 'skill-card-gained' : 'skill-card-pending'}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                gained ? 'bg-sunbird-success-message text-white' : 'bg-sunbird-gray-e5 text-sunbird-gray-75'
              }`}
            >
              {gained ? <FiCheck className="h-3 w-3" /> : <FiLock className="h-2.5 w-2.5" />}
            </span>
            <h3 className="truncate text-sm font-semibold text-foreground">{skill}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-7">
            <span className={`text-xs font-medium ${gained ? 'text-sunbird-green-dark' : 'text-sunbird-gray-75'}`}>
              {gained ? t('mySkills.gained') : t('mySkills.pending')}
            </span>
            <span className="text-xs text-sunbird-gray-75">·</span>
            <span className="text-xs text-sunbird-gray-75">{t('mySkills.pathCount', { count: pathCount })}</span>
          </div>
        </div>
        {isExpanded ? (
          <FiChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-sunbird-gray-75" />
        ) : (
          <FiChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-sunbird-gray-75" />
        )}
      </button>

      {isExpanded && (
        <ul className="flex flex-col gap-2 border-t border-sunbird-gray-e5 px-4 py-3" data-testid="skill-card-origins">
          <li className="text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
            {t('mySkills.earnedFrom')}
          </li>
          {origins.map((origin) => (
            <li key={`${origin.pathId}-${origin.levelIndex}`} className="flex items-start gap-2">
              <span
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                  origin.gained ? 'bg-sunbird-success-message' : 'bg-sunbird-gray-d0'
                }`}
              />
              <div className="min-w-0">
                <Link
                  to={getLearningPathStatusPath(origin.pathId, origin.contextId)}
                  className="block truncate text-sm font-medium text-sunbird-brick hover:underline"
                >
                  {origin.pathName}
                </Link>
                <span className="block truncate text-xs text-sunbird-gray-75">
                  {t('mySkills.levelLabel', { index: origin.levelIndex, name: origin.levelName })}
                  {origin.gained ? ` · ${t('mySkills.gained')}` : ` · ${t('mySkills.pending')}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

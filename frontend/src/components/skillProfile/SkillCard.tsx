import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import type { HeldSkill } from '@/types/skillServiceTypes';

interface SkillCardProps {
  skill: HeldSkill;
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function formatDate(ms: number | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * One skill the learner holds, with its evidence on demand.
 *
 * Always rendered in the "held" style: v2 is binary, so a skill only appears here if it is
 * held. There is no level, no status and no expiry to show - the absence of a card IS "not
 * held", which the gap panel reports instead.
 */
export function SkillCard({ skill, name, isExpanded, onToggle }: SkillCardProps) {
  const { t } = useAppI18n();

  return (
    <div
      className="flex flex-col rounded-xl border border-sunbird-success-message/40 bg-surface shadow-sm transition-colors"
      data-testid="skill-card"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sunbird-success-message text-white">
              <FiCheck className="h-3 w-3" />
            </span>
            <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-7">
            <span className="text-xs font-medium text-sunbird-green-dark">
              {t(`skillProfile.source.${skill.sourceType}`, { defaultValue: skill.sourceType })}
            </span>
            {skill.attainedOn && (
              <>
                <span className="text-xs text-sunbird-gray-75">·</span>
                <span className="text-xs text-sunbird-gray-75">{formatDate(skill.attainedOn)}</span>
              </>
            )}
            {skill.evidence.length > 0 && (
              <>
                <span className="text-xs text-sunbird-gray-75">·</span>
                <span className="text-xs text-sunbird-gray-75">
                  {t('skillProfile.evidenceCount', { count: skill.evidence.length })}
                </span>
              </>
            )}
          </div>
        </div>
        <FiChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-sunbird-gray-75 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-sunbird-gray-e5 px-4 py-3" data-testid="skill-evidence">
          {skill.evidence.length === 0 ? (
            <p className="text-xs text-sunbird-gray-75">{t('skillProfile.noEvidence')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {skill.evidence.map((ev) => (
                <li key={ev.evidenceId} className="flex flex-wrap items-center gap-x-2 text-xs">
                  <span className="font-medium text-foreground">
                    {t(`skillProfile.source.${ev.sourceType}`, { defaultValue: ev.sourceType })}
                  </span>
                  {typeof ev.score === 'number' && typeof ev.maxScore === 'number' && (
                    <>
                      <span className="text-sunbird-gray-75">·</span>
                      <span className="text-sunbird-gray-75">
                        {ev.score}/{ev.maxScore}
                      </span>
                    </>
                  )}
                  {ev.occurredOn && (
                    <>
                      <span className="text-sunbird-gray-75">·</span>
                      <span className="text-sunbird-gray-75">{formatDate(ev.occurredOn)}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

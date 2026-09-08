import { FiCheck, FiChevronDown, FiClock, FiLock } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { isHeld } from '@/services/competency';
import { PASSBOOK_STATUS, type PassbookEntry } from '@/types/competencyServiceTypes';

interface CompetencyCardProps {
  entry: PassbookEntry;
  isExpanded: boolean;
  onToggle: () => void;
  labelFor: (code: string) => string;
}

function formatDate(ms: number | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * One competency the learner holds, with its evidence on demand.
 *
 * Styling mirrors `mySkills/SkillCard` (solid success border when held, dashed
 * when not) so the passbook reads as a sibling of My Skills.
 */
export function CompetencyCard({ entry, isExpanded, onToggle, labelFor }: CompetencyCardProps) {
  const { t } = useAppI18n();
  const held = isHeld(entry);
  const expiring = entry.status === PASSBOOK_STATUS.expiring;
  const expired = entry.status === PASSBOOK_STATUS.expired;

  return (
    <div
      className={`flex flex-col rounded-xl border bg-surface shadow-sm transition-colors ${
        held ? 'border-sunbird-success-message/40' : 'border-dashed border-sunbird-gray-d0'
      }`}
      data-testid={held ? 'competency-card-held' : 'competency-card-pending'}
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
                held ? 'bg-sunbird-success-message text-white' : 'bg-sunbird-gray-e5 text-sunbird-gray-75'
              }`}
            >
              {held ? <FiCheck className="h-3 w-3" /> : <FiLock className="h-2.5 w-2.5" />}
            </span>
            <h3 className="truncate text-sm font-semibold text-foreground">{labelFor(entry.competencyId)}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-7">
            <span
              className={`text-xs font-medium ${held ? 'text-sunbird-green-dark' : 'text-sunbird-gray-75'}`}
              data-testid="competency-level"
            >
              {labelFor(entry.level)}
            </span>
            <span className="text-xs text-sunbird-gray-75">·</span>
            <span className="text-xs text-sunbird-gray-75">{t(`passbook.status.${entry.status}`)}</span>
            {entry.attainedOn && (
              <>
                <span className="text-xs text-sunbird-gray-75">·</span>
                <span className="text-xs text-sunbird-gray-75">{formatDate(entry.attainedOn)}</span>
              </>
            )}
            {entry.evidence.length > 0 && (
              <>
                <span className="text-xs text-sunbird-gray-75">·</span>
                <span className="text-xs text-sunbird-gray-75">
                  {t('passbook.evidenceCount', { count: entry.evidence.length })}
                </span>
              </>
            )}
          </div>
          {(expiring || expired) && (
            <p className="mt-1.5 flex items-center gap-1.5 pl-7 text-xs text-sunbird-brick">
              <FiClock className="h-3 w-3" />
              {expiring ? t('passbook.expiringSoon') : t('passbook.expiredNote')}
            </p>
          )}
        </div>
        <FiChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-sunbird-gray-75 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-sunbird-gray-e5 px-4 py-3" data-testid="competency-evidence">
          {entry.evidence.length === 0 ? (
            <p className="text-xs text-sunbird-gray-75">{t('passbook.noEvidence')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {entry.evidence.map((ev) => (
                <li key={ev.evidenceId} className="flex flex-wrap items-center gap-x-2 text-xs">
                  <span className="font-medium text-foreground">
                    {t(`passbook.source.${ev.sourceType}`, { defaultValue: ev.sourceType })}
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

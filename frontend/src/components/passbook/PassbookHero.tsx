import { FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PassbookHeroProps {
  heldCount: number;
  totalCount: number;
  /** Undefined until a target position is chosen - NOT zero, which would read as "0% ready". */
  readiness?: number;
  positionLabel?: string;
  outstanding?: number;
}

/**
 * Passbook summary: how many competencies are held, and - once a target position
 * is chosen - readiness against it. Mirrors `MySkillsHero` so the two profile
 * pages read as siblings.
 *
 * The ring shows READINESS when a position is set, otherwise the held count.
 * Readiness is the more meaningful figure but only exists in context of a
 * position; showing a 0% ring to a fully-qualified learner who simply has not
 * picked a target would be actively wrong.
 */
export function PassbookHero({
  heldCount,
  totalCount,
  readiness,
  positionLabel,
  outstanding,
}: PassbookHeroProps) {
  const { t } = useAppI18n();
  const hasTarget = typeof readiness === 'number' && Boolean(positionLabel);
  const pct = hasTarget ? readiness : totalCount > 0 ? Math.round((heldCount / totalCount) * 100) : 0;
  const complete = hasTarget ? readiness === 100 : totalCount > 0 && heldCount === totalCount;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-sunbird-gray-e5 bg-surface shadow-sm"
      data-testid="passbook-hero"
    >
      <div className={`px-5 pb-5 pt-6 text-center ${complete ? 'bg-sunbird-success-message-bg' : 'bg-sunbird-ivory'}`}>
        <div className="relative mx-auto h-28 w-28">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="7" className="stroke-sunbird-gray-e5" />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE}
              className={`transition-all duration-1000 ease-out ${
                complete ? 'stroke-sunbird-success-message' : 'stroke-sunbird-brick'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {hasTarget ? (
              <>
                <span className="text-[1.625rem] font-bold leading-none text-sunbird-ink">{pct}%</span>
                <span className="text-xs text-sunbird-gray-75">{t('passbook.ready')}</span>
              </>
            ) : (
              <>
                <span className="text-[1.625rem] font-bold leading-none text-sunbird-ink">{heldCount}</span>
                <span className="text-xs text-sunbird-gray-75">{t('passbook.heldCount')}</span>
              </>
            )}
          </div>
        </div>

        {hasTarget ? (
          <p className="mt-3 text-xs text-sunbird-gray-75" data-testid="passbook-hero-target">
            {t('passbook.readinessFor', { position: positionLabel })}
          </p>
        ) : (
          <p className="mt-3 text-xs text-sunbird-gray-75">{t('passbook.pickTargetHint')}</p>
        )}

        {complete && hasTarget && (
          <div className="mt-2 flex animate-fade-in items-center justify-center gap-2 text-sunbird-green-dark">
            <FiAward className="h-4 w-4" />
            <span className="text-sm font-semibold">{t('passbook.fullyReady')}</span>
          </div>
        )}
      </div>

      <div className="divide-y divide-sunbird-gray-e5 px-5 py-2">
        <Stat value={heldCount} label={t('passbook.competenciesHeld')} tone="held" />
        {hasTarget && typeof outstanding === 'number' && (
          <Stat value={outstanding} label={t('passbook.outstanding')} tone={outstanding > 0 ? 'pending' : 'held'} />
        )}
      </div>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: 'held' | 'pending' }) {
  const toneClass =
    tone === 'held' ? 'text-sunbird-green-dark' : tone === 'pending' ? 'text-sunbird-gray-75' : 'text-foreground';
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-sunbird-gray-75">{label}</span>
      <span className={`text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

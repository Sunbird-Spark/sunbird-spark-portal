import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from '@/components/ui/button';
import type { LearningPathPolicy, LPCourseNode } from '@/types/learningPathTypes';
import type { LPAssessmentInfo } from '@/services/learningPath';

const NOTE_KEY: Record<LearningPathPolicy, string> = {
  Fixed: 'learningPath.policyNoteStrict',
  Diagnostic: 'learningPath.policyNoteAdaptive',
  PriorLearning: 'learningPath.policyNotePriorLearning',
};

interface AssessmentGateProps {
  /** Which assessment this gate is for - drives copy, and whether Skip is offered at all. */
  variant: 'prior' | 'outcome';
  assessment: LPCourseNode;
  /** Only meaningful for `variant="prior"` - the outcome assessment is never skippable. */
  policy?: LearningPathPolicy;
  allSkills: string[];
  /** Best score across attempts, plus the attempt count when it is known. */
  bestScore?: LPAssessmentInfo | null;
  onStart: () => void;
  onSkip?: () => void;
  /** Mirrors LevelDetailView's "← Back to path" link - both gates are sub-screens of the path. */
  onBack: () => void;
}

/**
 * Pre-assessment gate screen (design's `bPrior`): stats, scoped skills, Start
 * (/ Skip, prior only) CTAs, policy note. Shared by the Prior and Outcome
 * assessments - they differ only in copy and in whether Skip exists at all
 * (an outcome assessment is the path's own completion gate, so skipping it
 * makes no sense).
 */
export function AssessmentGate({
  variant,
  assessment,
  policy,
  allSkills,
  bestScore,
  onStart,
  onSkip,
  onBack,
}: AssessmentGateProps) {
  const { t } = useAppI18n();
  const isPrior = variant === 'prior';
  const canSkip = isPrior && policy === 'Fixed' && Boolean(onSkip);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_21.25rem] lg:items-start">
      <div className="overflow-hidden rounded-xl border border-sunbird-gray-e5 bg-surface shadow-sm">
        <div className="border-b border-sunbird-gray-e5 p-6">
          <button type="button" onClick={onBack} className="mb-3 block bg-transparent p-0 text-sm font-medium text-sunbird-brick">
            ← {t('learningPath.backToPath')}
          </button>
          <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-lavender">
            {t(isPrior ? 'learningPath.priorAssessmentSub' : 'learningPath.outcomeAssessmentSub')}
          </span>
          <h2 className="mt-1.5 text-2xl font-bold text-foreground">{assessment.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3.5 border-b border-sunbird-gray-e5 p-6 sm:grid-cols-4">
          <div>
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.questions')}
            </span>
            <span className="text-lg font-medium text-foreground">{assessment.questionCount ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.bestScore')}
            </span>
            <span className="text-lg font-medium text-foreground">
              {bestScore ? `${bestScore.score}/${bestScore.maxScore}` : '—'}
            </span>
          </div>
          <div>
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.attempts')}
            </span>
            <span className="text-lg font-medium text-foreground" data-testid="assessment-gate-attempts">
              {bestScore?.attemptCount ?? '—'}
            </span>
          </div>
        </div>
        <div className="p-6">
          <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
            {t('learningPath.allScopedSkills')}
          </span>
          <div className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {allSkills.map((skill) => (
              <div key={skill} className="flex items-center justify-between gap-2.5 border-t border-sunbird-gray-e5 py-2.5">
                <span className="text-sm text-foreground">{skill}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-sunbird-gray-82">{t('learningPath.definesTheScope')}</p>
        </div>
      </div>
      <div className="rounded-xl border border-sunbird-gray-e5 bg-surface p-5 shadow-sm">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          {t(isPrior ? 'learningPath.beforeThePathOpens' : 'learningPath.beforeTheFinalAssessment')}
        </span>
        <p className="mb-[1.125rem] text-sm leading-relaxed text-sunbird-gray-4a">
          {isPrior && policy ? t(NOTE_KEY[policy]) : t('learningPath.outcomeAssessmentNote')}
        </p>
        <Button size="lg" className="w-full" onClick={onStart}>
          {t('learningPath.startAssessment')}
        </Button>
        {canSkip && (
          <div className="mt-2.5">
            <Button variant="outline" className="w-full" onClick={onSkip}>
              {t('learningPath.skipAndStartLevel1')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

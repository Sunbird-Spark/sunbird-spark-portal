import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from '@/components/ui/button';
import type { LearningPathPolicy, LPCourseNode } from '@/types/learningPathTypes';

const NOTE_KEY: Record<LearningPathPolicy, string> = {
  Fixed: 'learningPath.policyNoteStrict',
  Diagnostic: 'learningPath.policyNoteAdaptive',
  PriorLearning: 'learningPath.policyNotePriorLearning',
};

interface PriorAssessmentGateProps {
  priorAssessment: LPCourseNode;
  policy: LearningPathPolicy;
  allSkills: string[];
  bestScore?: { score: number; maxScore: number } | null;
  onStart: () => void;
  onSkip: () => void;
}

/** Pre-path gate screen (design's `bPrior`): stats, scoped skills, Start / Skip CTAs, policy note. */
export function PriorAssessmentGate({
  priorAssessment,
  policy,
  allSkills,
  bestScore,
  onStart,
  onSkip,
}: PriorAssessmentGateProps) {
  const { t } = useAppI18n();
  const canSkip = policy === 'Fixed';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_21.25rem] lg:items-start">
      <div className="overflow-hidden rounded-xl border border-sunbird-gray-e5 bg-surface shadow-sm">
        <div className="border-b border-sunbird-gray-e5 p-6">
          <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-lavender">
            {t('learningPath.priorAssessmentSub')}
          </span>
          <h2 className="mt-1.5 text-2xl font-bold text-foreground">{priorAssessment.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3.5 border-b border-sunbird-gray-e5 p-6 sm:grid-cols-4">
          <div>
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.questions')}
            </span>
            <span className="text-lg font-medium text-foreground">{priorAssessment.questionCount ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.bestScore')}
            </span>
            <span className="text-lg font-medium text-foreground">
              {bestScore ? `${bestScore.score}/${bestScore.maxScore}` : '—'}
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
        <span className="mb-1.5 block text-sm font-medium text-foreground">{t('learningPath.beforeThePathOpens')}</span>
        <p className="mb-[1.125rem] text-sm leading-relaxed text-sunbird-gray-4a">{t(NOTE_KEY[policy])}</p>
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

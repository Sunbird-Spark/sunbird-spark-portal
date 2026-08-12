import { FiAlertCircle } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import type { LearningPathPolicy } from '@/types/learningPathTypes';

const NOTE_KEY: Record<LearningPathPolicy, string> = {
  Fixed: 'learningPath.policyNoteStrict',
  Diagnostic: 'learningPath.policyNoteAdaptive',
  PriorLearning: 'learningPath.policyNotePriorLearning',
};

interface PolicyNoteBannerProps {
  policy: LearningPathPolicy;
}

/** The amber policy explainer shown above the Ledger (design's `policyNote`). */
export function PolicyNoteBanner({ policy }: PolicyNoteBannerProps) {
  const { t } = useAppI18n();
  return (
    <div
      className="flex items-start gap-2.5 rounded-md border border-sunbird-ginger/45 bg-sunbird-warning-bg px-4 py-2.5 text-sm leading-relaxed text-sunbird-warning-text"
      data-testid="policy-note-banner"
    >
      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sunbird-brick" />
      <span>{t(NOTE_KEY[policy])}</span>
    </div>
  );
}

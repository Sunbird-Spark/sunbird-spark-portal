import { useAppI18n } from '@/hooks/useAppI18n';

interface WaiverNoteProps {
  note: string;
}

/** "Why this level is not blocking you" callout on the Level detail screen (Adaptive/Prior-learning policies). */
export function WaiverNote({ note }: WaiverNoteProps) {
  const { t } = useAppI18n();
  return (
    <div className="rounded-xl border border-sunbird-blue-light/25 bg-sunbird-blue-light/10 p-[1.125rem]" data-testid="waiver-note">
      <span className="mb-1.5 block text-sm font-medium text-sunbird-ink">{t('learningPath.whyNotBlocking')}</span>
      <span className="text-sm leading-relaxed text-sunbird-ink">{note}</span>
    </div>
  );
}

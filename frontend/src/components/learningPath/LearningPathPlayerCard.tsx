import { FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from '@/components/ui/button';
import { ContentPlayer } from '@/components/players';
import PageLoader from '@/components/common/PageLoader';

interface LearningPathPlayerCardProps {
  title: string;
  crumb: string;
  isCompleted: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  playerIsLoading: boolean;
  playerError: Error | null;
  playerMetadata?: { mimeType: string; [key: string]: unknown };
  cdata?: Array<{ id: string; type: string }>;
  objectRollup?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ContentPlayer's own event prop typing
  onPlayerEvent?: (event: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ContentPlayer's own event prop typing
  onTelemetryEvent?: (event: any) => void;
}

/**
 * The lesson pane for the Learning Path's own player screen (design's `bPlayer`):
 * breadcrumb + Previous/Next header, the actual player body (same `ContentPlayer`
 * every other content screen uses), and an auto-save/completion footer. No
 * Units/Lessons sidebar or course-level enrolment gate - access to this screen
 * is governed entirely by the Learning Path enrolment, not the inner course's own.
 */
export function LearningPathPlayerCard({
  title,
  crumb,
  isCompleted,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  playerIsLoading,
  playerError,
  playerMetadata,
  cdata,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}: LearningPathPlayerCardProps) {
  const { t } = useAppI18n();

  return (
    <div className="overflow-hidden rounded-xl border border-sunbird-gray-e5 bg-surface shadow-sm">
      <div className="flex items-center gap-3.5 border-b border-sunbird-gray-e5 px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-medium text-foreground">{title}</span>
          <span className="text-xs text-sunbird-gray-75">{crumb}</span>
        </div>
        <Button size="sm" variant="outline" onClick={onPrevious} disabled={!hasPrevious}>
          <FiChevronLeft className="mr-1 h-4 w-4" />
          {t('learningPath.previous')}
        </Button>
        <Button size="sm" onClick={onNext} disabled={!hasNext}>
          {t('learningPath.next')}
          <FiChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-[26.25rem] px-9 py-7">
        {playerIsLoading && <PageLoader message={t('loading')} fullPage={false} />}
        {!playerIsLoading && playerError && (
          <p className="text-center text-sm text-destructive">{playerError.message}</p>
        )}
        {!playerIsLoading && !playerError && playerMetadata && (
          <ContentPlayer
            mimeType={playerMetadata.mimeType}
            metadata={playerMetadata}
            cdata={cdata}
            objectRollup={objectRollup}
            onPlayerEvent={onPlayerEvent}
            onTelemetryEvent={onTelemetryEvent}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-sunbird-gray-e5 bg-sunbird-ivory px-5 py-3">
        <span className="text-xs text-sunbird-gray-75">{t('learningPath.autoSaveNote')}</span>
        {isCompleted && (
          <span className="flex items-center gap-1.5 rounded-pill bg-sunbird-moss/15 px-3 py-1.5 text-xs font-medium text-sunbird-moss">
            <FiCheck className="h-3.5 w-3.5" />
            {t('learningPath.markedComplete')}
          </span>
        )}
      </div>
    </div>
  );
}

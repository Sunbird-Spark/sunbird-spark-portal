import { FiBookOpen, FiHelpCircle } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Badge } from '@/components/ui/badge';
import type { LPCourseNode } from '@/types/learningPathTypes';
import type { ProgressInfo } from '@/types/learningPathTypes';

interface LedgerCourseRowProps {
  course: LPCourseNode;
  progress: ProgressInfo & { status: 'completed' | 'active' | 'notStarted' };
  onOpen: () => void;
}

const CTA_KEY: Record<'completed' | 'active' | 'notStarted', string> = {
  completed: 'learningPath.review',
  active: 'learningPath.resume',
  notStarted: 'learningPath.start',
};

/** A single Course row inside an expanded Level (design's `c.` row template). */
export function LedgerCourseRow({ course, progress, onOpen }: LedgerCourseRowProps) {
  const { t } = useAppI18n();
  const Icon = course.isAssessmentCourse ? FiHelpCircle : FiBookOpen;

  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-3 rounded-md border border-sunbird-gray-e5 bg-surface px-3.5 py-3"
      data-testid="ledger-course-row"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sunbird-lavender/15 text-sunbird-lavender">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{course.name}</span>
          {course.isAssessmentCourse && (
            <Badge variant="secondary" className="text-[0.6875rem]">
              {t('learningPath.questionSetOnly')}
            </Badge>
          )}
        </div>
        <span className="text-xs text-sunbird-gray-75">
          {progress.completed}/{progress.total} · {progress.pct}%
        </span>
      </div>
      <span className="shrink-0 text-sm font-medium text-sunbird-brick">{t(CTA_KEY[progress.status])}</span>
    </div>
  );
}

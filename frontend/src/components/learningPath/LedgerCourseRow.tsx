import { FiBookOpen, FiChevronDown, FiChevronUp, FiHelpCircle } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Badge } from '@/components/ui/badge';
import { CourseUnitTree } from './CourseUnitTree';
import type { LPCourseNode } from '@/types/learningPathTypes';
import type { LPAssessmentInfo } from '@/services/learningPath';
import type { ProgressInfo } from '@/types/learningPathTypes';

interface LedgerCourseRowProps {
  course: LPCourseNode;
  progress: ProgressInfo & { status: 'completed' | 'active' | 'notStarted' };
  onOpen: () => void;
  /**
   * Expand/collapse of the course's own units. Opt-in: when `onToggle` is
   * omitted the row behaves exactly as before (no chevron, no unit tree), so
   * the ledger table and level-detail screens are unaffected.
   */
  isExpanded?: boolean;
  onToggle?: () => void;
  /** Opens one leaf inside this course. Required for the unit tree to be interactive. */
  onOpenContent?: (contentId: string) => void;
  contentStatus?: Record<string, number>;
  /** Best score / attempts per leaf, forwarded to the unit tree. */
  assessmentInfo?: Record<string, LPAssessmentInfo>;
  activeContentId?: string | null;
}

// "Revisit" rather than "Review" for a finished course: "Review" is taken by the
// authoring review/publish pipeline, so it reads as a workflow action here.
const CTA_KEY: Record<'completed' | 'active' | 'notStarted', string> = {
  completed: 'learningPath.revisit',
  active: 'learningPath.resume',
  notStarted: 'learningPath.start',
};

/** A single Course row inside an expanded Level (design's `c.` row template). */
export function LedgerCourseRow({
  course,
  progress,
  onOpen,
  isExpanded = false,
  onToggle,
  onOpenContent,
  contentStatus,
  assessmentInfo,
  activeContentId = null,
}: LedgerCourseRowProps) {
  const { t } = useAppI18n();
  const Icon = course.isAssessmentCourse ? FiHelpCircle : FiBookOpen;
  const units = course.units ?? [];
  const isExpandable = Boolean(onToggle) && units.length > 0;

  return (
    <div className="rounded-md border border-sunbird-gray-e5 bg-surface" data-testid="ledger-course-row-wrapper">
      <div
        onClick={onOpen}
        className="flex cursor-pointer items-center gap-3 px-3.5 py-3"
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
        {isExpandable && (
          // Stops propagation so toggling the unit list never navigates into the course.
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            aria-expanded={isExpanded}
            aria-label={t(isExpanded ? 'learningPath.hideUnits' : 'learningPath.showUnits')}
            data-testid="ledger-course-row-toggle"
            className="shrink-0 bg-transparent p-1 text-sunbird-gray-75"
          >
            {isExpanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {isExpandable && isExpanded && (
        <div className="border-t border-sunbird-gray-e5 px-3 py-2">
          <CourseUnitTree
            nodes={units}
            contentStatus={contentStatus}
            assessmentInfo={assessmentInfo}
            activeContentId={activeContentId}
            onOpenContent={(contentId) => onOpenContent?.(contentId)}
            untitledLabel={t('collectionSidebar.untitled')}
          />
        </div>
      )}
    </div>
  );
}

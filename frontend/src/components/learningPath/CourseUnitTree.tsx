import { FiCheckCircle, FiCircle, FiFolder } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import type { LPUnitNode } from '@/types/learningPathTypes';
import type { LPAssessmentInfo } from '@/services/learningPath';

interface CourseUnitTreeProps {
  nodes: LPUnitNode[];
  /** Merged course/path `contentStatus` — used to tick off completed leaves. */
  contentStatus?: Record<string, number>;
  /**
   * `contentId -> best score / attempts`, built from the path record's
   * `assessmentStatus` (see `buildAssessmentInfoMap`). Absent entries simply
   * render no score, which is also the pre-attempt state.
   */
  assessmentInfo?: Record<string, LPAssessmentInfo>;
  activeContentId?: string | null;
  onOpenContent: (contentId: string) => void;
  untitledLabel: string;
  depth?: number;
}

const COMPLETE_STATUS = 2;

/** Assessment leaves are the only ones that can carry a score or an attempt limit. */
function isAssessmentLeaf(node: LPUnitNode): boolean {
  const mimeType = node.mimeType ?? '';
  return (
    mimeType === 'application/vnd.sunbird.questionset' ||
    mimeType === 'application/vnd.sunbird.question' ||
    mimeType === 'application/vnd.ekstep.scorm-archive'
  );
}

/**
 * The units/leaves inside a Course, rendered as an indented tree under its rail
 * row. Mirrors `CollectionSidebar`'s `ExpandedUnitContent` — sub-units are
 * labels, leaves are clickable rows — but reads from the Learning Path's own
 * `LPUnitNode` model instead of the raw hierarchy.
 *
 * Assessment leaves additionally show the attempt count and best score, matching
 * the course player's `ContentRow`. The `courseDetails.*` i18n keys are reused
 * verbatim so both surfaces stay worded identically.
 */
export function CourseUnitTree({
  nodes,
  contentStatus,
  assessmentInfo,
  activeContentId = null,
  onOpenContent,
  untitledLabel,
  depth = 0,
}: CourseUnitTreeProps) {
  const { t } = useAppI18n();

  if (nodes.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-1 ${depth > 0 ? 'ml-2 border-l-2 border-sunbird-gray-e5 pl-3' : ''}`}
      data-testid="course-unit-tree"
    >
      {nodes.map((node) => {
        if (node.isUnit) {
          return (
            <div key={node.identifier} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 py-1">
                <FiFolder className="h-3 w-3 shrink-0 text-sunbird-gray-75" />
                <span className="truncate text-[0.75rem] font-medium text-sunbird-gray-4a">
                  {node.name || untitledLabel}
                </span>
              </div>
              <CourseUnitTree
                nodes={node.children}
                contentStatus={contentStatus}
                assessmentInfo={assessmentInfo}
                activeContentId={activeContentId}
                onOpenContent={onOpenContent}
                untitledLabel={untitledLabel}
                depth={depth + 1}
              />
            </div>
          );
        }

        const isDone = contentStatus?.[node.identifier] === COMPLETE_STATUS;
        const isActive = activeContentId === node.identifier;
        const isAssessment = isAssessmentLeaf(node);
        const info = isAssessment ? assessmentInfo?.[node.identifier] : undefined;
        // Attempts render only when both sides of "N of M" are known.
        const showAttempts = info?.attemptCount != null && node.maxAttempts != null;
        // Same gate as ContentRow: a score is only meaningful once completed.
        const showScore = isDone && info != null;

        return (
          <button
            key={node.identifier}
            type="button"
            onClick={() => onOpenContent(node.identifier)}
            data-testid="course-unit-leaf"
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sunbird-gray-f3 ${
              isActive ? 'bg-sunbird-gray-f3' : 'bg-transparent'
            }`}
          >
            {isDone ? (
              <FiCheckCircle className="h-3.5 w-3.5 shrink-0 text-sunbird-brick" />
            ) : (
              <FiCircle className="h-3.5 w-3.5 shrink-0 text-sunbird-gray-b2" />
            )}
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={`truncate text-[0.75rem] ${isActive ? 'font-medium text-foreground' : 'text-sunbird-gray-4a'}`}
              >
                {node.name || untitledLabel}
              </span>
              {showAttempts && (
                <span
                  className="shrink-0 text-[0.625rem] font-medium text-muted-foreground"
                  title={t('courseDetails.attemptsLabel', {
                    current: info?.attemptCount,
                    max: node.maxAttempts,
                  })}
                  data-testid="course-unit-leaf-attempts"
                >
                  {info?.attemptCount}/{node.maxAttempts}
                </span>
              )}
            </span>
            {showScore && (
              <span
                className="shrink-0 text-[0.625rem] text-gray-600"
                data-testid="course-unit-leaf-score"
              >
                {t('courseDetails.scoreLabel', { score: info.score, max: info.maxScore })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

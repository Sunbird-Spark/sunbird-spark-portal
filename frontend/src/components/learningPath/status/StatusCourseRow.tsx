import { FiBookOpen, FiCheck, FiHelpCircle } from 'react-icons/fi';
import type { LPCourseNode, ProgressInfo } from '@/types/learningPathTypes';

interface StatusCourseRowProps {
  course: LPCourseNode;
  progress: ProgressInfo & { status: 'completed' | 'active' | 'notStarted' };
}

/** A read-only course row inside a level — this page reports status, it never launches content. */
export function StatusCourseRow({ course, progress }: StatusCourseRowProps) {
  const Icon = course.isAssessmentCourse ? FiHelpCircle : FiBookOpen;
  const isDone = progress.status === 'completed';

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-sunbird-gray-e5 bg-surface px-3.5 py-2.5"
      data-testid="status-course-row"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isDone ? 'bg-sunbird-success-message-bg text-sunbird-success-message' : 'bg-sunbird-gray-f3 text-sunbird-gray-75'
        }`}
      >
        {isDone ? <FiCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{course.name}</span>
      <div className="flex w-28 shrink-0 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-sunbird-gray-e5">
          <div
            className={`h-full rounded-pill ${isDone ? 'bg-sunbird-success-message' : 'bg-sunbird-brick'}`}
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-xs text-sunbird-gray-75">{progress.pct}%</span>
      </div>
    </div>
  );
}

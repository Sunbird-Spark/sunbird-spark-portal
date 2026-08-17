import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningPathRail } from './LearningPathRail';
import type { LearningPathModel, LevelProgressInfo, LevelStatusKey } from '../../types/learningPathTypes';
import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

function buildModel(): LearningPathModel {
  return {
    identifier: 'lp_1',
    name: 'Data Foundations',
    policy: 'Fixed',
    levels: [
      {
        identifier: 'level_1',
        name: 'Level-1',
        index: 0,
        skills: [],
        courses: [
          {
            identifier: 'course_1',
            name: 'LP-Course-1-JP-PP',
            leafNodesCount: 2,
            leafIds: ['leaf_1', 'leaf_2'],
            skills: [],
            isAssessmentCourse: false,
          },
        ],
      },
      {
        identifier: 'level_2',
        name: 'Level-2',
        index: 1,
        skills: [],
        courses: [
          {
            identifier: 'course_2',
            name: 'LP-Course-2',
            leafNodesCount: 1,
            leafIds: ['leaf_3'],
            skills: [],
            isAssessmentCourse: false,
          },
        ],
      },
    ],
    allSkills: [],
    courseTotal: 2,
    leafTotal: 3,
  };
}

const levelProgress: LevelProgressInfo[] = [
  { pct: 100, completed: 1, total: 1, doneCourses: 1 },
  { pct: 0, completed: 0, total: 1, doneCourses: 0 },
];
const levelStatuses: LevelStatusKey[] = ['completed', 'locked'];

function renderRail(overrides: Partial<Parameters<typeof LearningPathRail>[0]> = {}) {
  const onOpenCourse = vi.fn();
  const props = {
    pathTitle: 'Data Foundations',
    model: buildModel(),
    progress: { pct: 50, completed: 1, total: 3, doneLevels: 1, levelCount: 2 },
    levelProgress,
    levelStatuses,
    priorDone: true,
    outcomeUnlocked: false,
    summaryByCollectionId: new Map<string, ViewerSummaryRecord>(),
    pathSummary: undefined,
    onBackToPath: vi.fn(),
    onOpenLevel: vi.fn(),
    onOpenPrior: vi.fn(),
    onOpenCourse,
    ...overrides,
  };
  render(<LearningPathRail {...props} />);
  return { onOpenCourse };
}

describe('LearningPathRail', () => {
  it('shows the child courses of an unlocked Level', () => {
    renderRail();
    expect(screen.getByText('LP-Course-1-JP-PP')).toBeInTheDocument();
  });

  it('does not show child courses of a locked Level', () => {
    renderRail();
    expect(screen.queryByText('LP-Course-2')).not.toBeInTheDocument();
  });

  // Regression: a Level's own course row must open that course, not the Level itself -
  // clicking it should not also trigger the parent Level row's onOpenLevel handler.
  it('opens the course at its first leaf id when a child course row is clicked, without opening the Level', () => {
    const onOpenLevel = vi.fn();
    const { onOpenCourse } = renderRail({ onOpenLevel });
    fireEvent.click(screen.getByText('LP-Course-1-JP-PP'));
    expect(onOpenCourse).toHaveBeenCalledWith('course_1', 'leaf_1');
    expect(onOpenLevel).not.toHaveBeenCalled();
  });
});

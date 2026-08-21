import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LedgerTable } from './LedgerTable';
import type { LearningPathModel, LevelProgressInfo, LevelStatusKey } from '../../types/learningPathTypes';
import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

function buildModel(): LearningPathModel {
  return {
    identifier: 'lp_1',
    name: 'TLP-3',
    policy: 'Diagnostic',
    levels: [
      {
        identifier: 'level_1',
        name: 'Level-1',
        index: 0,
        skills: [],
        courses: [
          {
            identifier: 'course_1',
            name: 'LP-Course-1',
            leafNodesCount: 1,
            leafIds: ['leaf_1'],
            skills: [],
            isAssessmentCourse: false,
          },
        ],
      },
    ],
    outcomeAssessment: {
      identifier: 'course_outcome',
      name: 'LP-PostAssess-Course',
      leafNodesCount: 1,
      leafIds: ['leaf_outcome'],
      skills: [],
      isAssessmentCourse: true,
    },
    allSkills: [],
    courseTotal: 2,
    leafTotal: 2,
  };
}

const levelProgress: LevelProgressInfo[] = [{ pct: 100, completed: 1, total: 1, doneCourses: 1 }];
const levelStatuses: LevelStatusKey[] = ['completed'];

function renderTable(overrides: Partial<Parameters<typeof LedgerTable>[0]> = {}) {
  const onOpenOutcome = vi.fn();
  render(
    <LedgerTable
      model={buildModel()}
      levelProgress={levelProgress}
      levelStatuses={levelStatuses}
      priorProgress={null}
      priorDone
      outcomeUnlocked
      outcomeProgress={{ pct: 0, completed: 0, total: 1, status: 'notStarted' }}
      summaryByCollectionId={new Map<string, ViewerSummaryRecord>()}
      onOpenLevel={vi.fn()}
      onOpenPrior={vi.fn()}
      onOpenOutcome={onOpenOutcome}
      onOpenCourse={vi.fn()}
      {...overrides}
    />
  );
  return { onOpenOutcome };
}

describe('LedgerTable outcome row', () => {
  // Regression: the row rendered a bare Badge, so an unlocked outcome assessment
  // showed "Start" but clicking it did nothing.
  it('opens the outcome assessment when clicked once every Level is complete', () => {
    const { onOpenOutcome } = renderTable();
    fireEvent.click(screen.getByTestId('ledger-outcome-row'));
    expect(onOpenOutcome).toHaveBeenCalledTimes(1);
  });

  it('does not open the outcome assessment while it is still locked', () => {
    const { onOpenOutcome } = renderTable({ outcomeUnlocked: false });
    fireEvent.click(screen.getByTestId('ledger-outcome-row'));
    expect(onOpenOutcome).not.toHaveBeenCalled();
    expect(screen.getByText('learningPath.locked')).toBeInTheDocument();
  });

  it('shows the outcome assessment as completed once it is done', () => {
    renderTable({ outcomeProgress: { pct: 100, completed: 1, total: 1, status: 'completed' } });
    const row = screen.getByTestId('ledger-outcome-row');
    expect(within(row).getByText('learningPath.statusCompleted')).toBeInTheDocument();
    expect(within(row).getByText('1/1')).toBeInTheDocument();
  });
});

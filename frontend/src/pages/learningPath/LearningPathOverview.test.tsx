import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LearningPathOverview } from './LearningPathOverview';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/learningPath/LearningPathCreatorPanel', () => ({
  LearningPathCreatorPanel: ({ pathId }: { pathId: string }) => (
    <div data-testid="lp-creator-panel">{pathId}</div>
  ),
}));

const baseModel = {
  identifier: 'lp1',
  name: 'My Path',
  description: '',
  policy: 'Fixed' as const,
  levels: [],
  courseTotal: 0,
  allSkills: [] as string[],
};

const baseEnrollment = {
  isEnrolled: false,
  batches: [],
  batchListLoading: false,
  batchListError: undefined,
  enrolLoading: false,
  enrolError: undefined,
  handleEnrol: vi.fn(),
  batchEndDate: undefined,
};

function buildLp(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    model: baseModel,
    policy: 'Fixed',
    progress: { pct: 0, doneLevels: 0 },
    levelProgress: [],
    levelStatuses: [],
    priorState: { progress: null, done: true },
    outcomeState: { progress: null, unlocked: false },
    enrollment: baseEnrollment,
    pathSummary: undefined,
    summaryByCollectionId: {},
    isTrackable: true,
    isCreatorViewingOwnPath: false,
    isMentorViewingPath: false,
    ...overrides,
  } as any;
}

const noop = () => undefined;

describe('LearningPathOverview', () => {
  it('shows the EnrolCard prompt for a learner who has not enrolled', () => {
    render(
      <MemoryRouter>
        <LearningPathOverview lp={buildLp()} isAuthenticated onOpenLevel={noop} onOpenPrior={noop} onOpenOutcome={noop} onOpenCourse={noop} />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('lp-creator-panel')).not.toBeInTheDocument();
  });

  it('shows the creator panel instead of EnrolCard when the viewer created the path', () => {
    render(
      <MemoryRouter>
        <LearningPathOverview
          lp={buildLp({ isCreatorViewingOwnPath: true })}
          isAuthenticated
          onOpenLevel={noop}
          onOpenPrior={noop}
          onOpenOutcome={noop}
          onOpenCourse={noop}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('lp-creator-panel')).toHaveTextContent('lp1');
  });

  it('shows the creator panel for a batch mentor even when not the creator', () => {
    render(
      <MemoryRouter>
        <LearningPathOverview
          lp={buildLp({ isMentorViewingPath: true })}
          isAuthenticated
          onOpenLevel={noop}
          onOpenPrior={noop}
          onOpenOutcome={noop}
          onOpenCourse={noop}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('lp-creator-panel')).toBeInTheDocument();
  });

  it('does not show the creator panel when the path is not trackable, even for the creator', () => {
    render(
      <MemoryRouter>
        <LearningPathOverview
          lp={buildLp({ isCreatorViewingOwnPath: true, isTrackable: false })}
          isAuthenticated
          onOpenLevel={noop}
          onOpenPrior={noop}
          onOpenOutcome={noop}
          onOpenCourse={noop}
        />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('lp-creator-panel')).not.toBeInTheDocument();
  });

  it('renders Path Progress as a full-width banner above the ledger/side-panel row', () => {
    render(
      <MemoryRouter>
        <LearningPathOverview lp={buildLp()} isAuthenticated onOpenLevel={noop} onOpenPrior={noop} onOpenOutcome={noop} onOpenCourse={noop} />
      </MemoryRouter>
    );

    const progressCard = screen.getByTestId('path-progress-card');
    const policyBanner = screen.getByTestId('policy-note-banner');

    // DOCUMENT_POSITION_FOLLOWING (4) — progressCard must precede policyBanner in the DOM,
    // which in turn precedes the ledger/side-panel row, so it never slides back into a sidebar.
    expect(progressCard.compareDocumentPosition(policyBanner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

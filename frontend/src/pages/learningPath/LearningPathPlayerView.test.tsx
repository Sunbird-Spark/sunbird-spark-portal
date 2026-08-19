import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningPathPlayerView } from './LearningPathPlayerView';
import type { LPCourseNode, LPLevelNode } from '@/types/learningPathTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

let mockCollectionData: { hierarchyRoot: unknown } | undefined;
vi.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ data: mockCollectionData, isLoading: false }),
}));

let mockContentData: { data: { content: { mimeType: string; identifier: string } } } | undefined;
vi.mock('@/hooks/useContent', () => ({
  useContentRead: () => ({ data: mockContentData, isLoading: false, error: null }),
}));

let mockQumlData: { mimeType: string } | undefined;
vi.mock('@/hooks/useQumlContent', () => ({
  useQumlContent: () => ({ data: mockQumlData, isLoading: false, error: null }),
}));

const mockHandleTelemetryEvent = vi.fn();
const mockUseContentView = vi.fn((..._args: unknown[]) => mockHandleTelemetryEvent);
vi.mock('@/hooks/useContentView', () => ({
  useContentView: (arg: unknown) => mockUseContentView(arg),
}));

vi.mock('@/components/players', () => ({
  ContentPlayer: ({
    mimeType,
    onPlayerEvent,
  }: {
    mimeType: string;
    onPlayerEvent?: (event: unknown) => void;
  }) => (
    <div data-testid="content-player">
      {mimeType}
      <button
        onClick={() =>
          onPlayerEvent?.({
            eid: 'QUML_SUMMARY',
            edata: { extra: [{ id: 'score', value: '8' }, { id: 'endpageseen', value: 'true' }] },
          })
        }
      >
        simulate-quml-summary
      </button>
    </div>
  ),
}));

const course1: LPCourseNode = {
  identifier: 'course_1',
  name: 'Reading data honestly',
  leafNodesCount: 2,
  leafIds: ['res_1', 'res_2'],
  skills: [],
  isAssessmentCourse: false,
};

const level1: LPLevelNode = {
  identifier: 'level_1',
  name: 'Foundations',
  index: 1,
  skills: [],
  courses: [course1],
};

function buildLp(overrides: Record<string, unknown> = {}) {
  return {
    model: {
      identifier: 'lp_1',
      name: 'Data Foundations',
      policy: 'Fixed' as const,
      levels: [level1],
      priorAssessment: undefined,
      outcomeAssessment: undefined,
      allSkills: [],
      courseTotal: 1,
      leafTotal: 2,
    },
    progress: { pct: 50, completed: 1, total: 2, doneLevels: 0, levelCount: 1 },
    levelProgress: [{ pct: 50, completed: 0, total: 1, doneCourses: 0 }],
    levelStatuses: ['active' as const],
    priorState: { progress: null, done: true },
    outcomeState: { progress: null, unlocked: false },
    enrollment: { isEnrolled: true, effectiveContextId: 'lpbatch' },
    pathSummary: { contentStatus: { res_1: 2, res_2: 0 } },
    summaryRecords: [],
    summaryByCollectionId: new Map(),
    ...overrides,
  } as unknown as Parameters<typeof LearningPathPlayerView>[0]['lp'];
}

describe('LearningPathPlayerView', () => {
  it('shows a "must join" message when not enrolled in the Learning Path', () => {
    mockCollectionData = { hierarchyRoot: level1.courses[0] };
    mockContentData = { data: { content: { mimeType: 'video/mp4', identifier: 'res_1' } } };

    render(
      <LearningPathPlayerView
        lp={buildLp({ enrollment: { isEnrolled: false, effectiveContextId: undefined } })}
        courseId="course_1"
        contentId="res_1"
        onBackToPath={vi.fn()}
        onOpenLevel={vi.fn()}
        onOpenPrior={vi.fn()}
        onOpenOutcome={vi.fn()}
        onNavigateContent={vi.fn()}
      />
    );

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
  });

  it('renders the ContentPlayer and the Learning Path rail when enrolled', () => {
    mockCollectionData = { hierarchyRoot: { identifier: 'course_1', mimeType: 'application/vnd.ekstep.content-collection', children: [] } };
    mockContentData = { data: { content: { mimeType: 'video/mp4', identifier: 'res_1' } } };

    render(
      <LearningPathPlayerView
        lp={buildLp()}
        courseId="course_1"
        contentId="res_1"
        onBackToPath={vi.fn()}
        onOpenLevel={vi.fn()}
        onOpenPrior={vi.fn()}
        onOpenOutcome={vi.fn()}
        onNavigateContent={vi.fn()}
      />
    );

    expect(screen.getByTestId('content-player')).toHaveTextContent('video/mp4');
    expect(screen.getByTestId('learning-path-rail')).toBeInTheDocument();
  });

  it('calls onNavigateContent with the next leaf id when Next is clicked', () => {
    const onNavigateContent = vi.fn();
    mockCollectionData = { hierarchyRoot: { identifier: 'course_1', mimeType: 'application/vnd.ekstep.content-collection', children: [{ identifier: 'res_1', mimeType: 'video/mp4' }, { identifier: 'res_2', mimeType: 'video/mp4' }] } };
    mockContentData = { data: { content: { mimeType: 'video/mp4', identifier: 'res_1' } } };

    render(
      <LearningPathPlayerView
        lp={buildLp()}
        courseId="course_1"
        contentId="res_1"
        onBackToPath={vi.fn()}
        onOpenLevel={vi.fn()}
        onOpenPrior={vi.fn()}
        onOpenOutcome={vi.fn()}
        onNavigateContent={onNavigateContent}
      />
    );

    fireEvent.click(screen.getByText('learningPath.next'));
    expect(onNavigateContent).toHaveBeenCalledWith('course_1', 'res_2');
  });

  // Regression: the QUML player's terminal QUML_SUMMARY event (used for the
  // prior/outcome assessment and any Question Set course) arrives via
  // onPlayerEvent, not onTelemetryEvent — without wiring it through
  // normalizeQumlPlayerEvent, question-set progress/score never updates.
  it('routes onPlayerEvent (QUML_SUMMARY) through normalizeQumlPlayerEvent into useContentView', () => {
    mockCollectionData = { hierarchyRoot: { identifier: 'course_1', mimeType: 'application/vnd.ekstep.content-collection', children: [] } };
    mockContentData = { data: { content: { mimeType: 'application/vnd.sunbird.questionset', identifier: 'res_1' } } };
    mockQumlData = { mimeType: 'application/vnd.sunbird.questionset' };
    mockHandleTelemetryEvent.mockClear();

    render(
      <LearningPathPlayerView
        lp={buildLp()}
        courseId="course_1"
        contentId="res_1"
        onBackToPath={vi.fn()}
        onOpenLevel={vi.fn()}
        onOpenPrior={vi.fn()}
        onOpenOutcome={vi.fn()}
        onNavigateContent={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('simulate-quml-summary'));
    expect(mockHandleTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eid: 'QUML_SUMMARY', edata: expect.objectContaining({ score: 8, endpageseen: true }) })
    );
  });

  // Regression: verified live against the deployed lern-service that a
  // synthetic `<lpContextId>:<courseId>` composite context (constructed
  // whether or not a "fan-out" summary record exists) has no backing
  // `user_enrolments` row - view/start|update|end all return SUCCESS against
  // it, but summary/read for that exact courseId+batchId comes back empty, so
  // nothing is ever readable/resumable. Writes must instead target the
  // Learning Path ROOT (model.identifier) + its own plain batch id, which the
  // learner has a real enrolment row for.
  it('scopes writes to the Learning Path root + plain batch id, not a per-course composite', () => {
    mockCollectionData = { hierarchyRoot: { identifier: 'course_1', mimeType: 'application/vnd.ekstep.content-collection', children: [] } };
    mockContentData = { data: { content: { mimeType: 'video/mp4', identifier: 'res_1' } } };
    mockUseContentView.mockClear();

    render(
      <LearningPathPlayerView
        lp={buildLp({
          enrollment: { isEnrolled: true, effectiveContextId: 'lpbatch' },
          summaryRecords: [
            {
              collectionId: 'course_1',
              contextId: 'FANOUT_BATCH:course_1',
              active: true,
              status: 1,
              progress: 0,
              contentStatus: {},
            },
          ],
        })}
        courseId="course_1"
        contentId="res_1"
        onBackToPath={vi.fn()}
        onOpenLevel={vi.fn()}
        onOpenPrior={vi.fn()}
        onOpenOutcome={vi.fn()}
        onNavigateContent={vi.fn()}
      />
    );

    expect(mockUseContentView).toHaveBeenCalledWith(
      expect.objectContaining({ collectionId: 'lp_1', contextId: 'lpbatch' })
    );
  });

  // Regression: this screen renders LearningPathRail directly (the rail container
  // is only used inside CollectionSidePanel), so it must wire the outcome
  // assessment up itself - otherwise the rail's outcome row is inert here even
  // though it works on the path overview screen. It now opens the outcome GATE
  // (not the player directly) - LearningPathPage's `/outcome` branch does the
  // navigateContent jump once the learner clicks Start there.
  it('opens the outcome gate from the rail once every Level is complete', () => {
    mockCollectionData = { hierarchyRoot: { identifier: 'course_1', mimeType: 'application/vnd.ekstep.content-collection', children: [] } };
    mockContentData = { data: { content: { mimeType: 'video/mp4', identifier: 'res_1' } } };
    const onOpenOutcome = vi.fn();

    render(
      <LearningPathPlayerView
        lp={buildLp({
          model: {
            identifier: 'lp_1',
            name: 'Data Foundations',
            policy: 'Fixed' as const,
            levels: [level1],
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
            leafTotal: 3,
          },
          levelProgress: [{ pct: 100, completed: 1, total: 1, doneCourses: 1 }],
          levelStatuses: ['completed' as const],
          outcomeState: { progress: null, unlocked: true, done: false },
        })}
        courseId="course_1"
        contentId="res_1"
        onBackToPath={vi.fn()}
        onOpenLevel={vi.fn()}
        onOpenPrior={vi.fn()}
        onOpenOutcome={onOpenOutcome}
        onNavigateContent={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('rail-outcome-row'));
    expect(onOpenOutcome).toHaveBeenCalled();
  });
});

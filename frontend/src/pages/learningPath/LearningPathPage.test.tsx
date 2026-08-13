import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LearningPathPage from './LearningPathPage';
import type { LPCourseNode, LPLevelNode } from '@/types/learningPathTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermissions: () => ({ isAuthenticated: true }),
}));

vi.mock('@/hooks/useImpression', () => ({
  default: () => undefined,
}));

const priorCourse: LPCourseNode = {
  identifier: 'course_prior',
  name: 'Prior check',
  leafNodesCount: 1,
  leafIds: ['qs_prior'],
  skills: ['Data literacy'],
  isAssessmentCourse: true,
  questionCount: 10,
};

const outcomeCourse: LPCourseNode = {
  identifier: 'course_outcome',
  name: 'Outcome check',
  leafNodesCount: 1,
  leafIds: ['qs_outcome'],
  skills: ['Data literacy'],
  isAssessmentCourse: true,
};

const level1: LPLevelNode = {
  identifier: 'level_1',
  name: 'Foundations',
  index: 1,
  skills: ['Data literacy'],
  courses: [
    { identifier: 'course_1', name: 'Course 1', leafNodesCount: 1, leafIds: ['res_1'], skills: [], isAssessmentCourse: false },
  ],
};

type LpTestData = {
  model: {
    identifier: string;
    name: string;
    policy: 'Fixed';
    levels: LPLevelNode[];
    priorAssessment: LPCourseNode;
    outcomeAssessment: LPCourseNode;
    allSkills: string[];
    courseTotal: number;
    leafTotal: number;
  };
  policy: 'Fixed';
  progress: { pct: number; completed: number; total: number; doneLevels: number; levelCount: number };
  levelProgress: Array<{ pct: number; completed: number; total: number; doneCourses: number }>;
  levelStatuses: Array<'notStarted'>;
  priorState: { progress: null; done: boolean };
  outcomeState: { progress: null; unlocked: boolean };
  enrollment: {
    isEnrolled: boolean;
    effectiveContextId: undefined;
    batches: never[];
    batchListLoading: boolean;
    batchListError: undefined;
    isBatchEnded: boolean;
    isBatchUpcoming: boolean;
    batchEndDate: undefined;
    certificates: undefined;
    enrolLoading: boolean;
    enrolError: string;
    handleEnrol: () => void;
    handleUnenrol: () => void;
  };
  resumeTarget: null;
  pathSummary: undefined;
  summaryByCollectionId: Map<string, unknown>;
  isLoading: boolean;
  isError: boolean;
};

let mockLpData: LpTestData;

function buildLp(overrides: Partial<LpTestData> = {}): LpTestData {
  return {
    model: {
      identifier: 'lp_1',
      name: 'Data Foundations',
      policy: 'Fixed' as const,
      levels: [level1],
      priorAssessment: priorCourse,
      outcomeAssessment: outcomeCourse,
      allSkills: ['Data literacy'],
      courseTotal: 3,
      leafTotal: 3,
    },
    policy: 'Fixed' as const,
    progress: { pct: 0, completed: 0, total: 3, doneLevels: 0, levelCount: 1 },
    levelProgress: [{ pct: 0, completed: 0, total: 1, doneCourses: 0 }],
    levelStatuses: ['notStarted' as const],
    priorState: { progress: null, done: false },
    outcomeState: { progress: null, unlocked: false },
    enrollment: {
      isEnrolled: false,
      effectiveContextId: undefined,
      batches: [],
      batchListLoading: false,
      batchListError: undefined,
      isBatchEnded: false,
      isBatchUpcoming: false,
      batchEndDate: undefined,
      certificates: undefined,
      enrolLoading: false,
      enrolError: '',
      handleEnrol: vi.fn(),
      handleUnenrol: vi.fn(),
    },
    resumeTarget: null,
    pathSummary: undefined,
    summaryByCollectionId: new Map(),
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

vi.mock('@/hooks/useLearningPath', () => ({
  useLearningPath: () => mockLpData,
}));

vi.mock('./LearningPathPlayerView', () => ({
  LearningPathPlayerView: ({ courseId, contentId }: { courseId: string; contentId: string }) => (
    <div data-testid="lp-player-view">{`${courseId}/${contentId}`}</div>
  ),
}));

function renderAt(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/learning-path/:pathId" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/level/:levelId" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/prior" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/complete" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/status" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/course/:courseId/content/:contentId" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/batch/:contextId" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/batch/:contextId/level/:levelId" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/batch/:contextId/prior" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/batch/:contextId/complete" element={<LearningPathPage />} />
        <Route path="/learning-path/:pathId/batch/:contextId/status" element={<LearningPathPage />} />
        <Route
          path="/learning-path/:pathId/batch/:contextId/course/:courseId/content/:contentId"
          element={<LearningPathPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('LearningPathPage', () => {
  it('renders the overview screen (Ledger table) by default', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1');
    expect(screen.getByText('Data Foundations')).toBeInTheDocument();
  });

  it('renders the prior assessment gate at /prior', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/batch/batch_1/prior');
    expect(screen.getByText('Prior check')).toBeInTheDocument();
  });

  it('renders the level detail view at /level/:levelId', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/batch/batch_1/level/level_1');
    expect(screen.getByText(/Foundations/)).toBeInTheDocument();
  });

  it('renders the completion view at /complete', () => {
    mockLpData = buildLp({ progress: { pct: 100, completed: 3, total: 3, doneLevels: 1, levelCount: 1 } });
    renderAt('/learning-path/lp_1/batch/batch_1/complete');
    expect(screen.getByText('learningPath.pathComplete')).toBeInTheDocument();
  });

  // Regression: before enrolment there is no contextId in the URL (overview lives at
  // /learning-path/:pathId, not /learning-path/:pathId/batch/:contextId). Sub-screen
  // links built from that bare URL must still resolve to a route, not fall through to
  // the app's catch-all "*" -> Navigate("/") and bounce the learner to Home.
  it('renders the level detail view at /level/:levelId with no contextId in the URL', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/level/level_1');
    expect(screen.getByText(/Foundations/)).toBeInTheDocument();
  });

  it('renders the prior assessment gate at /prior with no contextId in the URL', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/prior');
    expect(screen.getByText('Prior check')).toBeInTheDocument();
  });

  it('renders the completion view at /complete with no contextId in the URL', () => {
    mockLpData = buildLp({ progress: { pct: 100, completed: 3, total: 3, doneLevels: 1, levelCount: 1 } });
    renderAt('/learning-path/lp_1/complete');
    expect(screen.getByText('learningPath.pathComplete')).toBeInTheDocument();
  });

  it('renders the Learning Path player view at /course/:courseId/content/:contentId with no contextId in the URL', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/course/course_1/content/res_1');
    expect(screen.getByTestId('lp-player-view')).toHaveTextContent('course_1/res_1');
  });

  it('shows a loader while the hierarchy/summary are still loading', () => {
    mockLpData = buildLp({ isLoading: true });
    renderAt('/learning-path/lp_1');
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('shows an error state when the hierarchy fails to load', () => {
    mockLpData = buildLp({ isError: true });
    renderAt('/learning-path/lp_1');
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('renders the Learning Path player view at /course/:courseId/content/:contentId', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/batch/batch_1/course/course_1/content/res_1');
    expect(screen.getByTestId('lp-player-view')).toHaveTextContent('course_1/res_1');
  });

  // Regression: the overview screen (/learning-path/:pathId) had no way back to
  // wherever the learner came from - every entry point already sets
  // location.state.from (mirrors the Collection detail flow's back button).
  it('shows a back button on the overview screen that returns to location.state.from', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1', { from: '/my-learning' });
    expect(screen.getByText('button.goBack')).toBeInTheDocument();
  });

  it('renders the status timeline view at /status', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/batch/batch_1/status');
    expect(screen.getByTestId('status-path-header-node')).toBeInTheDocument();
    expect(screen.getAllByTestId('status-timeline-node')).toHaveLength(1);
  });

  it('renders the status timeline view at /status with no contextId in the URL', () => {
    mockLpData = buildLp();
    renderAt('/learning-path/lp_1/status');
    expect(screen.getByTestId('status-path-header-node')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MySkills from './MySkills';
import { useMySkills } from '@/hooks/useMySkills';
import { useSkillSuggestions } from '@/hooks/useSkillSuggestions';
import type { PathSkillSummary } from '@/services/learningPath/skillAggregation';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));

vi.mock('@/hooks/useImpression', () => ({ default: vi.fn() }));

vi.mock('@/hooks/useMySkills', () => ({ useMySkills: vi.fn() }));
vi.mock('@/hooks/useSkillSuggestions', () => ({ useSkillSuggestions: vi.fn() }));

const mockUseMySkills = vi.mocked(useMySkills);
const mockUseSkillSuggestions = vi.mocked(useSkillSuggestions);

function summary(overrides: Partial<PathSkillSummary>): PathSkillSummary {
  return {
    pathId: 'p1',
    contextId: 'ctx1',
    pathName: 'Data Foundations',
    progressPct: 100,
    status: 'completed',
    allSkills: ['SQL'],
    gainedSkills: new Set(['SQL']),
    gainedCount: 1,
    pendingCount: 0,
    skillSources: [{ skill: 'SQL', levelId: 'l1', levelName: 'Foundations', levelIndex: 1, gained: true }],
    ...overrides,
  };
}

function baseResult(overrides: Partial<ReturnType<typeof useMySkills>> = {}): ReturnType<typeof useMySkills> {
  return {
    entries: [],
    summaries: [],
    aggregate: { totalSkills: 0, gainedSkills: 0, pendingSkills: 0, pathsCompleted: 0, pathsOngoing: 0 },
    analyzedCount: 0,
    totalCount: 0,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MySkills />
    </MemoryRouter>
  );
}

describe('MySkills', () => {
  beforeEach(() => {
    mockUseSkillSuggestions.mockReturnValue({ suggestions: [], isLoading: false });
  });

  it('shows a loading state', () => {
    mockUseMySkills.mockReturnValue(baseResult({ isLoading: true }));
    renderPage();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('shows an error state with retry', () => {
    mockUseMySkills.mockReturnValue(baseResult({ isError: true }));
    renderPage();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('shows an empty state when the learner has no enrolled Learning Paths', () => {
    mockUseMySkills.mockReturnValue(baseResult());
    renderPage();
    expect(screen.getByText('mySkills.noPaths')).toBeInTheDocument();
  });

  it('defaults to the skill view, showing one card per distinct skill', () => {
    const s = summary({});
    mockUseMySkills.mockReturnValue(
      baseResult({
        entries: [{ path: { pathId: 'p1', contextId: 'ctx1', name: 'Data Foundations' }, summary: s, isLoading: false, isError: false }],
        summaries: [s],
        aggregate: { totalSkills: 1, gainedSkills: 1, pendingSkills: 0, pathsCompleted: 1, pathsOngoing: 0 },
        analyzedCount: 1,
        totalCount: 1,
      })
    );
    renderPage();

    expect(screen.getByTestId('my-skills-hero')).toBeInTheDocument();
    expect(screen.getByTestId('skill-card-gained')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
  });

  it('reveals which path a skill came from when its card is expanded', () => {
    const s = summary({});
    mockUseMySkills.mockReturnValue(
      baseResult({ entries: [{ path: { pathId: 'p1', name: 'Data Foundations' }, summary: s, isLoading: false, isError: false }], summaries: [s], analyzedCount: 1, totalCount: 1 })
    );
    renderPage();

    expect(screen.queryByTestId('skill-card-origins')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('SQL'));

    expect(screen.getByTestId('skill-card-origins')).toBeInTheDocument();
    expect(screen.getByText('Data Foundations').closest('a')).toHaveAttribute(
      'href',
      '/learning-path/p1/batch/ctx1/status'
    );
  });

  it('switches to the path view and lists the enrolled paths', () => {
    const s = summary({});
    mockUseMySkills.mockReturnValue(
      baseResult({ entries: [{ path: { pathId: 'p1', name: 'Data Foundations' }, summary: s, isLoading: false, isError: false }], summaries: [s], analyzedCount: 1, totalCount: 1 })
    );
    renderPage();

    fireEvent.click(screen.getByText('mySkills.viewByPath'));
    expect(screen.getByTestId('skill-path-accordion')).toBeInTheDocument();
    expect(screen.getByText('Data Foundations')).toBeInTheDocument();
  });

  it('narrows the skill list by search query', () => {
    const dataPath = summary({ pathId: 'p1', pathName: 'Data Foundations' });
    const cloudPath = summary({
      pathId: 'p2',
      pathName: 'Cloud Basics',
      allSkills: ['AWS'],
      gainedSkills: new Set(),
      skillSources: [{ skill: 'AWS', levelId: 'l9', levelName: 'Cloud', levelIndex: 1, gained: false }],
    });
    mockUseMySkills.mockReturnValue(
      baseResult({
        entries: [
          { path: { pathId: 'p1', name: 'Data Foundations' }, summary: dataPath, isLoading: false, isError: false },
          { path: { pathId: 'p2', name: 'Cloud Basics' }, summary: cloudPath, isLoading: false, isError: false },
        ],
        summaries: [dataPath, cloudPath],
        analyzedCount: 2,
        totalCount: 2,
      })
    );
    renderPage();

    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('mySkills.searchPlaceholder'), { target: { value: 'aws' } });

    expect(screen.queryByText('SQL')).not.toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
  });

  it('reveals more skills via the load more button', () => {
    const many = summary({
      pathId: 'p1',
      skillSources: Array.from({ length: 30 }, (_, i) => ({
        skill: `Skill ${String(i).padStart(2, '0')}`,
        levelId: `l${i}`,
        levelName: 'Level',
        levelIndex: 1,
        gained: false,
      })),
    });
    mockUseMySkills.mockReturnValue(
      baseResult({
        entries: [{ path: { pathId: 'p1', name: 'Path' }, summary: many, isLoading: false, isError: false }],
        summaries: [many],
        analyzedCount: 1,
        totalCount: 1,
      })
    );
    renderPage();

    expect(screen.queryByText('Skill 29')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('mySkills.loadMore'));
    expect(screen.getByText('Skill 29')).toBeInTheDocument();
  });

  it('shows the skills-you-could-gain-next row when suggestions exist', () => {
    const s = summary({});
    mockUseMySkills.mockReturnValue(
      baseResult({
        entries: [{ path: { pathId: 'p1', contextId: 'ctx1', name: 'Data Foundations' }, summary: s, isLoading: false, isError: false }],
        summaries: [s],
        analyzedCount: 1,
        totalCount: 1,
      })
    );
    mockUseSkillSuggestions.mockReturnValue({
      suggestions: [
        {
          pathId: 'p2',
          pathName: 'Cloud Basics',
          source: 'discover',
          progressPct: 0,
          newSkills: ['Cloud'],
          totalSkills: 1,
        },
      ],
      isLoading: false,
    });

    renderPage();

    expect(screen.getByTestId('skill-suggestion-row')).toBeInTheDocument();
    expect(screen.getByText('Cloud Basics')).toBeInTheDocument();
  });

  it('shows the skill growth chart once at least two distinct completion days exist', () => {
    const s = summary({
      allSkills: ['SQL', 'Python'],
      gainedSkills: new Set(['SQL', 'Python']),
      gainedCount: 2,
      pendingCount: 0,
      skillSources: [
        { skill: 'SQL', levelId: 'l1', levelName: 'Foundations', levelIndex: 1, gained: true, gainedAt: 10 * 86_400_000 },
        { skill: 'Python', levelId: 'l2', levelName: 'Advanced', levelIndex: 2, gained: true, gainedAt: 12 * 86_400_000 },
      ],
    });
    mockUseMySkills.mockReturnValue(
      baseResult({
        entries: [{ path: { pathId: 'p1', name: 'Data Foundations' }, summary: s, isLoading: false, isError: false }],
        summaries: [s],
        analyzedCount: 1,
        totalCount: 1,
      })
    );

    renderPage();

    expect(screen.getByTestId('skill-growth-chart')).toBeInTheDocument();
  });
});

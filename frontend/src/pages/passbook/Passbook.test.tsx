import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Passbook from './Passbook';
import { usePassbook, useCompetencyLabels } from '@/hooks/usePassbook';
import { useCompetencyFramework, useCompetencyGap, useSaveTargetPosition } from '@/hooks/useCompetencyGap';
import { PASSBOOK_STATUS, GAP_STATUS, type PassbookEntry } from '@/types/competencyServiceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));
vi.mock('@/hooks/useImpression', () => ({ default: vi.fn() }));
vi.mock('@/hooks/usePassbook', () => ({
  usePassbook: vi.fn(),
  useCompetencyLabels: vi.fn(),
  labelFor: (labels: Record<string, string>, code: string) => labels[code] ?? code,
}));
vi.mock('@/hooks/useCompetencyGap', () => ({
  useCompetencyFramework: vi.fn(),
  useCompetencyGap: vi.fn(),
  useSaveTargetPosition: vi.fn(),
}));

const mockPassbook = vi.mocked(usePassbook);
const mockLabels = vi.mocked(useCompetencyLabels);
const mockFramework = vi.mocked(useCompetencyFramework);
const mockGap = vi.mocked(useCompetencyGap);
const mockSave = vi.mocked(useSaveTargetPosition);

const entry = (over: Partial<PassbookEntry> = {}): PassbookEntry => ({
  competencyId: 'medication-administration',
  frameworkId: 'fw_health_competency2',
  level: 'l4',
  levelIndex: 4,
  status: PASSBOOK_STATUS.attained,
  sourceType: 'ASSESSMENT',
  evidence: [],
  ...over,
});

const mutate = vi.fn();

function setup(over: Partial<ReturnType<typeof usePassbook>> = {}) {
  mockPassbook.mockReturnValue({
    entries: [entry()],
    frameworkId: 'fw_health_competency2',
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...over,
  } as ReturnType<typeof usePassbook>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLabels.mockReturnValue({ 'medication-administration': 'Medication Administration', l4: 'L4 Expert' });
  mockFramework.mockReturnValue({ meta: undefined, isLoading: false, isError: false });
  mockGap.mockReturnValue({ gap: undefined, isLoading: false, isError: false });
  mockSave.mockReturnValue({ mutate } as unknown as ReturnType<typeof useSaveTargetPosition>);
  setup();
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <Passbook />
    </MemoryRouter>
  );

describe('Passbook', () => {
  it('renders held competencies with their framework-resolved name and level', () => {
    renderPage();
    expect(screen.getByText('Medication Administration')).toBeInTheDocument();
    expect(screen.getByTestId('competency-level')).toHaveTextContent('L4 Expert');
    expect(screen.getByTestId('competency-card-held')).toBeInTheDocument();
  });

  it('shows the held count in the hero when no target position is chosen', () => {
    renderPage();
    expect(screen.getByTestId('passbook-hero')).toBeInTheDocument();
    expect(screen.queryByTestId('passbook-hero-target')).not.toBeInTheDocument();
  });

  // Regression guard: the service reports "no position" as readiness 0, which
  // must not reach the learner as a score.
  it('does not render a readiness figure for an unresolved gap', () => {
    mockGap.mockReturnValue({
      gap: { rows: [], readiness: 0, position: '', frameworkId: '', mandatoryOutstanding: 0, resolved: false },
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.queryByTestId('gap-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('passbook-hero-target')).not.toBeInTheDocument();
  });

  it('renders the gap table once a position resolves', () => {
    mockFramework.mockReturnValue({
      meta: { frameworkId: 'fw', levels: [], requirements: {}, positions: ['staff-nurse-icu'] },
      isLoading: false,
      isError: false,
    });
    mockGap.mockReturnValue({
      gap: {
        rows: [
          {
            competencyId: 'medication-administration',
            requiredLevel: 'l3',
            requiredLevelIndex: 3,
            heldLevel: 'l4',
            heldLevelIndex: 4,
            criticality: 'MANDATORY',
            status: GAP_STATUS.met,
          },
        ],
        readiness: 100,
        position: 'staff-nurse-icu',
        frameworkId: 'fw',
        mandatoryOutstanding: 0,
        resolved: true,
      },
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByTestId('gap-table')).toBeInTheDocument();
    expect(screen.getByTestId('gap-row-MET')).toBeInTheDocument();
  });

  it('saves the chosen position as a target', () => {
    mockFramework.mockReturnValue({
      meta: { frameworkId: 'fw', levels: [], requirements: {}, positions: ['staff-nurse-icu'] },
      isLoading: false,
      isError: false,
    });
    renderPage();
    fireEvent.click(screen.getByTestId('position-option-staff-nurse-icu'));
    expect(mutate).toHaveBeenCalledWith('staff-nurse-icu');
  });

  it('expands a card to reveal its evidence', () => {
    setup({
      entries: [
        entry({
          evidence: [
            { evidenceId: 'e1', level: 'l4', sourceType: 'ASSESSMENT', sourceId: 'qs1', score: 1, maxScore: 1 },
          ],
        }),
      ],
    });
    renderPage();
    expect(screen.queryByTestId('competency-evidence')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Medication Administration'));
    expect(screen.getByTestId('competency-evidence')).toBeInTheDocument();
  });

  it('shows an empty state, not an error, when the learner holds nothing', () => {
    setup({ entries: [], frameworkId: undefined });
    renderPage();
    expect(screen.getByTestId('passbook-empty')).toBeInTheDocument();
  });

  // An unreachable API and an empty passbook are indistinguishable unless the
  // error path is explicit - the Kong route 404s until it is provisioned.
  it('offers retry when the passbook call fails', () => {
    const refetch = vi.fn();
    setup({ entries: [], isError: true, refetch });
    renderPage();
    // must NOT look like "you hold no competencies"
    expect(screen.queryByTestId('passbook-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders a loader while the passbook is in flight', () => {
    setup({ isLoading: true });
    const { container } = renderPage();
    expect(container.querySelector('[data-testid="passbook-hero"]')).toBeNull();
  });
});

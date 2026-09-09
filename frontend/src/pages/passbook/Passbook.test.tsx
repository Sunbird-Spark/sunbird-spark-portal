import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Passbook from './Passbook';
import { usePassbook } from '@/hooks/usePassbook';
import { useCompetencyVocabulary } from '@/hooks/useCompetencyVocabulary';
import { useCompetencyFrameworks, useCompetencyGap, useSaveTargetPosition } from '@/hooks/useCompetencyGap';
import { PASSBOOK_STATUS, GAP_STATUS, type PassbookEntry } from '@/types/competencyServiceTypes';
import type { FrameworkVocabulary } from '@/services/competency/passbookGrouping';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));
vi.mock('@/hooks/useImpression', () => ({ default: vi.fn() }));
vi.mock('@/hooks/usePassbook', () => ({ usePassbook: vi.fn() }));
vi.mock('@/hooks/useCompetencyVocabulary', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useCompetencyVocabulary')>(
    '@/hooks/useCompetencyVocabulary'
  );
  return { ...actual, useCompetencyVocabulary: vi.fn() };
});
vi.mock('@/hooks/useCompetencyGap', () => ({
  useCompetencyFrameworks: vi.fn(),
  useCompetencyGap: vi.fn(),
  useSaveTargetPosition: vi.fn(),
}));

const mockPassbook = vi.mocked(usePassbook);
const mockVocab = vi.mocked(useCompetencyVocabulary);
const mockFrameworks = vi.mocked(useCompetencyFrameworks);
const mockGap = vi.mocked(useCompetencyGap);
const mockSave = vi.mocked(useSaveTargetPosition);
const mutate = vi.fn();

const entry = (competencyId: string, frameworkId = 'fw2', over: Partial<PassbookEntry> = {}): PassbookEntry => ({
  competencyId,
  frameworkId,
  level: 'l3',
  levelIndex: 3,
  status: PASSBOOK_STATUS.attained,
  sourceType: 'ASSESSMENT',
  evidence: [],
  ...over,
});

const vocab = (over: Partial<FrameworkVocabulary> = {}): FrameworkVocabulary => ({
  frameworkId: 'fw2',
  labels: { med: 'Medication Administration', domain: 'Domain', l3: 'L3 Practitioner' },
  areaOf: {},
  positions: [],
  ...over,
});

function setPassbook(over: Partial<ReturnType<typeof usePassbook>> = {}) {
  mockPassbook.mockReturnValue({
    entries: [entry('med')],
    position: undefined,
    frameworkId: 'fw2',
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...over,
  } as ReturnType<typeof usePassbook>);
}

beforeEach(() => {
  vi.clearAllMocks();
  setPassbook();
  mockVocab.mockReturnValue({ vocabularies: { fw2: vocab() }, isLoading: false });
  mockFrameworks.mockReturnValue({ metas: {}, isLoading: false });
  mockGap.mockReturnValue({ gap: undefined, isLoading: false, isError: false });
  mockSave.mockReturnValue({ mutate } as unknown as ReturnType<typeof useSaveTargetPosition>);
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <Passbook />
    </MemoryRouter>
  );

describe('Passbook', () => {
  it('renders held competencies with the framework-resolved name and level', () => {
    renderPage();
    expect(screen.getByText('Medication Administration')).toBeInTheDocument();
    expect(screen.getByTestId('competency-level')).toHaveTextContent('L3 Practitioner');
  });

  it('groups competencies by area, with a heading per area', () => {
    setPassbook({ entries: [entry('med'), entry('comms')] });
    mockVocab.mockReturnValue({
      vocabularies: {
        fw2: vocab({
          areaOf: { med: 'domain', comms: 'behavioural' },
          labels: { domain: 'Domain', behavioural: 'Behavioural', med: 'Medication', comms: 'Comms' },
        }),
      },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('area-group-domain')).toBeInTheDocument();
    expect(screen.getByTestId('area-group-behavioural')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
  });

  // fw_health_competency2 classifies nothing (its sheet omitted the Area column);
  // a lone "Other" heading over everything would look like a fault.
  it('renders flat with no area heading when the framework classifies nothing', () => {
    setPassbook({ entries: [entry('med'), entry('ipc')] });
    renderPage();
    expect(screen.getByTestId('area-group-unclassified')).toBeInTheDocument();
    expect(screen.queryByText('passbook.otherArea')).not.toBeInTheDocument();
  });

  // User 23 holds both fw_health_competency and fw_health_competency2.
  it('renders a section per framework when the learner holds more than one', () => {
    setPassbook({ entries: [entry('med', 'fwA'), entry('old', 'fwB')] });
    mockVocab.mockReturnValue({
      vocabularies: {
        fwA: vocab({ frameworkId: 'fwA', labels: { fwA: 'Health v2', med: 'Medication' } }),
        fwB: vocab({ frameworkId: 'fwB', labels: { fwB: 'Health v1', old: 'Medication (old)' } }),
      },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('framework-section-fwA')).toBeInTheDocument();
    expect(screen.getByTestId('framework-section-fwB')).toBeInTheDocument();
    expect(screen.getByText('Health v2')).toBeInTheDocument();
    expect(screen.getByText('Health v1')).toBeInTheDocument();
  });

  it('hides the framework heading when there is only one', () => {
    renderPage();
    expect(screen.getByTestId('framework-section-fw2')).toBeInTheDocument();
    expect(screen.queryByText('passbook.frameworkCount')).not.toBeInTheDocument();
  });

  it('offers each framework its own target roles', () => {
    setPassbook({ entries: [entry('med', 'fwA'), entry('old', 'fwB')] });
    mockVocab.mockReturnValue({
      vocabularies: { fwA: vocab({ frameworkId: 'fwA' }), fwB: vocab({ frameworkId: 'fwB' }) },
      isLoading: false,
    });
    mockFrameworks.mockReturnValue({
      metas: {
        fwA: { frameworkId: 'fwA', levels: [], requirements: {}, positions: ['nurse'] },
        fwB: { frameworkId: 'fwB', levels: [], requirements: {}, positions: ['officer'] },
      },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('position-option-nurse')).toBeInTheDocument();
    expect(screen.getByTestId('position-option-officer')).toBeInTheDocument();
  });

  // competency/v1/framework/read 404s on the test cluster; the picker must still work
  // from the taxonomy read's positions.
  it('falls back to the taxonomy positions when the competency framework read is unavailable', () => {
    mockFrameworks.mockReturnValue({ metas: {}, isLoading: false });
    mockVocab.mockReturnValue({
      vocabularies: { fw2: vocab({ positions: ['staff-nurse-icu', 'nursing-officer'] }) },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('position-option-staff-nurse-icu')).toBeInTheDocument();
    expect(screen.getByTestId('position-option-nursing-officer')).toBeInTheDocument();
  });

  it('prefers the competency framework positions when both are available', () => {
    mockFrameworks.mockReturnValue({
      metas: { fw2: { frameworkId: 'fw2', levels: [], requirements: {}, positions: ['from-meta'] } },
      isLoading: false,
    });
    mockVocab.mockReturnValue({
      vocabularies: { fw2: vocab({ positions: ['from-taxonomy'] }) },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('position-option-from-meta')).toBeInTheDocument();
    expect(screen.queryByTestId('position-option-from-taxonomy')).not.toBeInTheDocument();
  });

  // Current role is READ-ONLY: position/update strips currentPosition on the
  // self-service route, so showing it as editable would promise what the API refuses.
  it('shows the current role when an HR feed has set one', () => {
    setPassbook({
      position: { frameworkId: 'fw2', currentPosition: 'staff-nurse-icu', targetPositions: [], source: 'ADMIN' },
    });
    mockVocab.mockReturnValue({
      vocabularies: { fw2: vocab({ labels: { 'staff-nurse-icu': 'Staff Nurse (ICU)', med: 'Medication' } }) },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('current-role')).toHaveTextContent('Staff Nurse (ICU)');
    expect(screen.queryByTestId('current-role-unset')).not.toBeInTheDocument();
  });

  it('says the current role is unset rather than hiding the row', () => {
    setPassbook({ position: { frameworkId: 'fw2', targetPositions: [], source: 'SELF' } });
    renderPage();
    expect(screen.getByTestId('current-role-unset')).toBeInTheDocument();
    expect(screen.queryByTestId('current-role')).not.toBeInTheDocument();
  });

  it('pre-selects a target saved on a previous visit', () => {
    setPassbook({ position: { frameworkId: 'fw2', targetPositions: ['staff-nurse-icu'], source: 'SELF' } });
    mockVocab.mockReturnValue({
      vocabularies: { fw2: vocab({ positions: ['staff-nurse-icu', 'nursing-officer'] }) },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('position-option-staff-nurse-icu')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('position-option-nursing-officer')).toHaveAttribute('aria-selected', 'false');
  });

  it('only shows a position block on the framework it belongs to', () => {
    setPassbook({
      entries: [entry('med', 'fwA'), entry('old', 'fwB')],
      position: { frameworkId: 'fwA', currentPosition: 'nurse', targetPositions: [], source: 'ADMIN' },
    });
    mockVocab.mockReturnValue({
      vocabularies: { fwA: vocab({ frameworkId: 'fwA' }), fwB: vocab({ frameworkId: 'fwB' }) },
      isLoading: false,
    });
    renderPage();
    // one current-role row, in fwA's section only
    expect(screen.getAllByTestId('current-role')).toHaveLength(1);
    expect(screen.getAllByTestId('current-role-unset')).toHaveLength(1);
  });

  it('saves the chosen role as a target', () => {
    mockFrameworks.mockReturnValue({
      metas: { fw2: { frameworkId: 'fw2', levels: [], requirements: {}, positions: ['staff-nurse-icu'] } },
      isLoading: false,
    });
    renderPage();
    fireEvent.click(screen.getByTestId('position-option-staff-nurse-icu'));
    expect(mutate).toHaveBeenCalledWith('staff-nurse-icu');
  });

  it('renders the gap table once a role resolves', () => {
    mockFrameworks.mockReturnValue({
      metas: { fw2: { frameworkId: 'fw2', levels: [], requirements: {}, positions: ['staff-nurse-icu'] } },
      isLoading: false,
    });
    mockGap.mockReturnValue({
      gap: {
        rows: [
          {
            competencyId: 'med',
            requiredLevel: 'l3',
            requiredLevelIndex: 3,
            heldLevel: 'l3',
            heldLevelIndex: 3,
            criticality: 'MANDATORY',
            status: GAP_STATUS.met,
          },
        ],
        readiness: 100,
        position: 'staff-nurse-icu',
        frameworkId: 'fw2',
        mandatoryOutstanding: 0,
        resolved: true,
      },
      isLoading: false,
      isError: false,
    });
    renderPage();
    fireEvent.click(screen.getByTestId('position-option-staff-nurse-icu'));
    expect(screen.getByTestId('gap-table')).toBeInTheDocument();
    expect(screen.getByTestId('gap-row-MET')).toBeInTheDocument();
  });

  // The service reports "no role" as readiness 0, which must not reach the learner
  // as a score.
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

  it('expands a card to reveal its evidence', () => {
    setPassbook({
      entries: [
        entry('med', 'fw2', {
          evidence: [{ evidenceId: 'e1', level: 'l3', sourceType: 'ASSESSMENT', sourceId: 'qs1', score: 1, maxScore: 1 }],
        }),
      ],
    });
    renderPage();
    expect(screen.queryByTestId('competency-evidence')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Medication Administration'));
    expect(screen.getByTestId('competency-evidence')).toBeInTheDocument();
  });

  it('shows an empty state when the learner holds nothing', () => {
    setPassbook({ entries: [], frameworkId: undefined });
    renderPage();
    expect(screen.getByTestId('passbook-empty')).toBeInTheDocument();
  });

  it('offers retry when the passbook call fails', () => {
    const refetch = vi.fn();
    setPassbook({ entries: [], isError: true, refetch });
    renderPage();
    expect(screen.queryByTestId('passbook-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });
});

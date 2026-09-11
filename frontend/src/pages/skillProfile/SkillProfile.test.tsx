import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SkillProfile from './SkillProfile';
import {
  useSkillProfile,
  useSkillGap,
  useSkillRecommend,
  useSkillFrameworks,
  useSaveTargetRole,
} from '@/hooks/useSkillProfile';
import { buildSkillVocabulary } from '@/services/skill';
import type { HeldSkill } from '@/types/skillServiceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));
vi.mock('@/hooks/useImpression', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useSkillProfile', () => ({
  useSkillProfile: vi.fn(),
  useSkillGap: vi.fn(),
  useSkillRecommend: vi.fn(),
  useSkillFrameworks: vi.fn(),
  useSaveTargetRole: vi.fn(),
}));

const mockProfile = vi.mocked(useSkillProfile);
const mockGap = vi.mocked(useSkillGap);
const mockRecommend = vi.mocked(useSkillRecommend);
const mockFrameworks = vi.mocked(useSkillFrameworks);
const mockSave = vi.mocked(useSaveTargetRole);
const mutate = vi.fn();

const held = (skillId: string, frameworkId = 'fw'): HeldSkill => ({
  skillId,
  frameworkId,
  sourceType: 'COURSE',
  evidence: [],
});

const vocab = buildSkillVocabulary('fw', {
  framework: {
    categories: [
      {
        code: 'competency',
        terms: [
          {
            code: 'domain',
            name: 'Domain',
            children: [
              {
                code: 'medication',
                name: 'Medication',
                children: [{ code: 'dosage-calculation', name: 'Dosage Calculation' }],
              },
            ],
          },
          {
            code: 'behavioural',
            name: 'Behavioural',
            children: [
              { code: 'comms', name: 'Comms', children: [{ code: 'patient-counselling', name: 'Patient Counselling' }] },
            ],
          },
        ],
      },
    ],
  },
});

function setProfile(over: Partial<ReturnType<typeof useSkillProfile>> = {}) {
  mockProfile.mockReturnValue({
    skills: [held('dosage-calculation')],
    frameworkIds: ['fw'],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...over,
  } as ReturnType<typeof useSkillProfile>);
}

beforeEach(() => {
  vi.clearAllMocks();
  setProfile();
  mockFrameworks.mockReturnValue({
    metas: {
      fw: {
        frameworkId: 'fw',
        tierLabels: ['Competency area', 'Competency', 'Skill'],
        depth: 3,
        leafSkills: ['dosage-calculation'],
        roles: { 'staff-nurse': ['dosage-calculation'] },
        roleCodes: ['staff-nurse'],
      },
    },
    vocabularies: { fw: vocab },
    isLoading: false,
  });
  mockGap.mockReturnValue({ gap: undefined, isLoading: false, isError: false });
  mockRecommend.mockReturnValue({ recommendation: undefined, isLoading: false });
  mockSave.mockReturnValue({ mutate } as unknown as ReturnType<typeof useSaveTargetRole>);
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <SkillProfile />
    </MemoryRouter>
  );

describe('SkillProfile', () => {
  it('renders held skills with their framework name', () => {
    renderPage();
    expect(screen.getByText('Dosage Calculation')).toBeInTheDocument();
    expect(screen.getByTestId('skill-card')).toBeInTheDocument();
  });

  it('groups skills under the outermost tier', () => {
    setProfile({ skills: [held('dosage-calculation'), held('patient-counselling')] });
    renderPage();
    expect(screen.getByTestId('tier-group-domain')).toBeInTheDocument();
    expect(screen.getByTestId('tier-group-behavioural')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
  });

  it('renders flat when the framework places nothing', () => {
    mockFrameworks.mockReturnValue({ metas: {}, vocabularies: {}, isLoading: false });
    renderPage();
    expect(screen.getByTestId('tier-group-unclassified')).toBeInTheDocument();
    expect(screen.queryByText('skillProfile.otherTier')).not.toBeInTheDocument();
  });

  // Current role is an HR assignment; the self-service route strips it. "Not set" must not
  // read as 0% ready.
  it('says the current role is unset rather than showing a score', () => {
    mockGap.mockReturnValue({
      gap: { frameworkId: 'fw', targets: [], resolved: true },
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByTestId('gap-current-unset')).toBeInTheDocument();
    expect(screen.getByTestId('gap-target-unset')).toBeInTheDocument();
  });

  it('shows readiness for both current and target roles', () => {
    mockGap.mockReturnValue({
      gap: {
        frameworkId: 'fw',
        current: { role: 'staff-nurse', readiness: 100, required: 1, met: 1, outstanding: [] },
        targets: [
          { role: 'nursing-officer', readiness: 50, required: 4, met: 2, outstanding: ['patient-counselling'] },
        ],
        resolved: true,
      },
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByTestId('gap-current')).toHaveTextContent('100%');
    expect(screen.getByTestId('gap-target')).toHaveTextContent('50%');
    // outstanding skills are named, not shown as raw codes
    expect(screen.getByTestId('gap-target-outstanding')).toHaveTextContent('Patient Counselling');
  });

  it('saves the chosen target role', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('role-option-staff-nurse'));
    expect(mutate).toHaveBeenCalledWith('staff-nurse');
  });

  it('lists ranked next steps in the service order, linking to content', () => {
    mockRecommend.mockReturnValue({
      recommendation: {
        role: 'staff-nurse',
        frameworkId: 'fw',
        outstanding: ['a'],
        candidates: [
          {
            identifier: 'do_course1',
            name: 'Safe Medication Practice',
            primaryCategory: 'Course',
            skills: ['a'],
            gapCovered: 3,
            alreadyHeld: 0,
            totalSkills: 3,
          },
        ],
      },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('next-steps')).toBeInTheDocument();
    expect(screen.getByTestId('next-step-do_course1')).toHaveAttribute('href', '/collection/do_course1');
  });

  it('expands a skill to reveal its evidence', () => {
    setProfile({
      skills: [
        {
          ...held('dosage-calculation'),
          evidence: [{ evidenceId: 'e1', sourceType: 'COURSE', sourceId: 'c1', revoked: false }],
        },
      ],
    });
    renderPage();
    expect(screen.queryByTestId('skill-evidence')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Dosage Calculation'));
    expect(screen.getByTestId('skill-evidence')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is held', () => {
    setProfile({ skills: [], frameworkIds: [] });
    renderPage();
    expect(screen.getByTestId('skill-profile-empty')).toBeInTheDocument();
  });

  // The v2 routes are not mirrored into the deployed monolith yet, so 404s are expected -
  // and an unreachable API must not look like an empty profile.
  it('offers retry when the profile call fails', () => {
    const refetch = vi.fn();
    setProfile({ skills: [], isError: true, refetch });
    renderPage();
    expect(screen.queryByTestId('skill-profile-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SkillPathAccordion } from './SkillPathAccordion';
import type { ComponentProps } from 'react';
import type { PathSkillSummary } from '@/services/learningPath/skillAggregation';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));

function summary(overrides: Partial<PathSkillSummary> = {}): PathSkillSummary {
  return {
    pathId: 'path-1',
    contextId: 'ctx-1',
    pathName: 'Data Foundations',
    progressPct: 50,
    status: 'ongoing',
    allSkills: ['SQL', 'Python'],
    gainedSkills: new Set(['SQL']),
    gainedCount: 1,
    pendingCount: 1,
    skillSources: [
      { skill: 'SQL', levelId: 'l1', levelName: 'Foundations', levelIndex: 1, gained: true },
      { skill: 'Python', levelId: 'l2', levelName: 'Advanced', levelIndex: 2, gained: false },
    ],
    ...overrides,
  };
}

function renderAccordion(props: Partial<ComponentProps<typeof SkillPathAccordion>> = {}) {
  return render(
    <MemoryRouter>
      <SkillPathAccordion
        pathName="Data Foundations"
        summary={summary()}
        isLoading={false}
        isExpanded={false}
        onToggle={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('SkillPathAccordion', () => {
  it('shows a skeleton while the path is still loading', () => {
    renderAccordion({ summary: undefined, isLoading: true });
    expect(screen.getByTestId('skill-path-skeleton')).toBeInTheDocument();
  });

  it('renders the collapsed summary without skill tags', () => {
    renderAccordion();
    expect(screen.getByText('Data Foundations')).toBeInTheDocument();
    expect(screen.queryByTestId('skill-chip-gained')).not.toBeInTheDocument();
  });

  it('expands to show gained and pending skill groups plus the status link', () => {
    renderAccordion({ isExpanded: true });

    const gained = screen.getAllByTestId('skill-chip-gained');
    const pending = screen.getAllByTestId('skill-chip-pending');
    expect(gained).toHaveLength(1);
    expect(pending).toHaveLength(1);

    const link = screen.getByText('mySkills.viewPathStatus').closest('a');
    expect(link).toHaveAttribute('href', '/learning-path/path-1/batch/ctx-1/status');
  });

  it('toggles expansion on click', () => {
    const onToggle = vi.fn();
    renderAccordion({ onToggle });
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

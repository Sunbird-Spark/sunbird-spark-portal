import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PathSkillProgressCard } from './PathSkillProgressCard';
import type { PathSkillSummary } from '@/services/learningPath/pathSkillStatus';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (k: string, p?: Record<string, unknown>) => (p ? `${k} ${JSON.stringify(p)}` : k),
  }),
}));

const summary: PathSkillSummary = {
  skills: [
    { code: 'ppe-use', state: 'notStarted', percent: 0, notTaught: false },
    { code: 'dosage-calculation', state: 'held', percent: 0, notTaught: false },
    { code: 'hand-hygiene', state: 'inProgress', percent: 60, notTaught: false },
    { code: 'hmis-reporting', state: 'notStarted', percent: 0, notTaught: true },
  ],
  held: 1,
  required: 4,
  readiness: 25,
};

const name = (c: string) => c.replace(/-/g, ' ');
const renderCard = (over: Partial<PathSkillSummary> = {}, hasRole = true) =>
  render(
    <MemoryRouter>
      <PathSkillProgressCard summary={{ ...summary, ...over }} name={name} roleName="Staff Nurse (ICU)" hasRole={hasRole} />
    </MemoryRouter>
  );

describe('PathSkillProgressCard', () => {
  it('shows readiness against the role', () => {
    renderCard();
    expect(screen.getByTestId('path-skill-readiness')).toHaveTextContent('25%');
    expect(screen.getByTestId('path-skill-count')).toHaveTextContent('"held":1');
  });

  it('renders every skill, whatever its state', () => {
    renderCard();
    ['ppe-use', 'dosage-calculation', 'hand-hygiene', 'hmis-reporting'].forEach((c) =>
      expect(screen.getByTestId(`path-skill-${c}`)).toBeInTheDocument()
    );
  });

  // The whole point: a partly-done skill must not look identical to an untouched one.
  it('shows the percentage on an in-progress skill only', () => {
    renderCard();
    expect(screen.getByTestId('path-skill-hand-hygiene')).toHaveTextContent('60%');
    expect(screen.getByTestId('path-skill-ppe-use')).not.toHaveTextContent('%');
  });

  // Ordering is the progress story: what you have, then what is moving, then what is untouched.
  it('orders held first and not-started last', () => {
    renderCard();
    const ids = screen
      .getAllByRole('listitem')
      .map((e) => e.getAttribute('data-testid'));
    expect(ids[0]).toBe('path-skill-dosage-calculation');   // held
    expect(ids[1]).toBe('path-skill-hand-hygiene');         // in progress
    expect(ids[ids.length - 1]).toBe('path-skill-ppe-use'); // not started, alphabetically last
  });

  // Finishing the path is not enough when the role needs something it never teaches.
  it('flags a required skill the path does not teach', () => {
    renderCard();
    expect(screen.getByTestId('path-skill-hmis-reporting')).toHaveTextContent('notOnThisPath');
  });

  it('falls back to a path-scoped heading when there is no target role', () => {
    renderCard({}, false);
    expect(screen.getByText(/skillsFromThisPath/)).toBeInTheDocument();
  });
});
